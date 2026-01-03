import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// Generate payment number
function generatePaymentNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY${dateStr}${random}`;
}

// GET - List payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const clientId = searchParams.get("clientId");
    const invoiceId = searchParams.get("invoiceId");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};

    if (clientId) where.clientId = clientId;
    if (invoiceId) where.invoiceId = invoiceId;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.paymentDate = {};
      if (dateFrom) where.paymentDate.gte = new Date(dateFrom);
      if (dateTo) where.paymentDate.lte = new Date(dateTo);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              clientName: true,
            },
          },
        },
        orderBy: { paymentDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.payment.count({ where }),
    ]);

    // Get summary
    const stats = await prisma.payment.aggregate({
      where: { ...where, status: "CONFIRMED" },
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        stats: {
          totalPayments: stats._count,
          totalAmount: stats._sum.amount || 0,
        },
      },
    });
  } catch (error) {
    console.error("Payments GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST - Record payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      invoiceId,
      amount,
      paymentDate,
      paymentMode,
      bankName,
      transactionRef,
      chequeNumber,
      chequeDate,
      remarks,
      confirmedBy,
    } = body;

    // Validate required fields
    if (!invoiceId || !amount || !paymentMode) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (amount > invoice.balanceDue) {
      return NextResponse.json(
        { success: false, error: "Payment amount exceeds balance due" },
        { status: 400 }
      );
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        paymentNumber: generatePaymentNumber(),
        invoiceId,
        clientId: invoice.clientId,
        amount,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMode,
        bankName,
        transactionRef,
        chequeNumber,
        chequeDate: chequeDate ? new Date(chequeDate) : null,
        status: "PENDING",
        remarks,
      },
    });

    // If auto-confirm (for certain payment modes)
    if (["NEFT", "RTGS", "UPI", "BANK_TRANSFER"].includes(paymentMode)) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          confirmedBy: confirmedBy || "SYSTEM",
        },
      });

      // Update invoice
      const newPaidAmount = invoice.paidAmount + amount;
      const newBalanceDue = invoice.totalAmount - newPaidAmount;
      const newStatus =
        newBalanceDue <= 0
          ? "PAID"
          : newPaidAmount > 0
          ? "PARTIALLY_PAID"
          : invoice.status;

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          status: newStatus,
          paidAt: newBalanceDue <= 0 ? new Date() : null,
          paymentRef: transactionRef,
        },
      });

      // Create ledger entry
      await prisma.clientLedger.create({
        data: {
          clientId: invoice.clientId,
          transactionDate: new Date(),
          transactionType: "PAYMENT",
          referenceType: "PAYMENT",
          referenceId: payment.id,
          referenceNumber: payment.paymentNumber,
          debitAmount: 0,
          creditAmount: amount,
          balanceAmount: newBalanceDue,
          description: `Payment received - ${payment.paymentNumber}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Payment POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
