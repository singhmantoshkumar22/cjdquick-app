import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";
import { getClientFromRequest } from "@/lib/client-auth";

export async function GET(request: NextRequest) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const status = searchParams.get("status");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const where: any = {
      clientId: clientContext.id,
    };

    if (status) {
      where.status = status;
    }

    if (fromDate) {
      where.invoiceDate = { ...where.invoiceDate, gte: new Date(fromDate) };
    }

    if (toDate) {
      where.invoiceDate = { ...where.invoiceDate, lte: new Date(toDate) };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { invoiceDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    // Get summary stats
    const stats = await prisma.invoice.aggregate({
      where: { clientId: clientContext.id },
      _sum: {
        totalAmount: true,
        paidAmount: true,
        balanceDue: true,
      },
      _count: true,
    });

    const pendingInvoices = await prisma.invoice.count({
      where: {
        clientId: clientContext.id,
        status: { in: ["PENDING", "SENT", "PARTIALLY_PAID"] },
      },
    });

    const overdueInvoices = await prisma.invoice.count({
      where: {
        clientId: clientContext.id,
        status: "OVERDUE",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: invoices,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        stats: {
          totalInvoices: stats._count,
          totalAmount: stats._sum.totalAmount || 0,
          paidAmount: stats._sum.paidAmount || 0,
          balanceDue: stats._sum.balanceDue || 0,
          pendingInvoices,
          overdueInvoices,
        },
      },
    });
  } catch (error) {
    console.error("Client billing error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
