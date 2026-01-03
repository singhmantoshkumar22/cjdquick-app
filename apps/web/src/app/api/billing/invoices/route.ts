import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// Generate invoice number
function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV${year}${month}${random}`;
}

// GET - List invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};

    if (clientId) where.clientId = clientId;
    if (status) {
      const statuses = status.split(",");
      where.status = statuses.length > 1 ? { in: statuses } : status;
    }
    if (dateFrom || dateTo) {
      where.invoiceDate = {};
      if (dateFrom) where.invoiceDate.gte = new Date(dateFrom);
      if (dateTo) where.invoiceDate.lte = new Date(dateTo);
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: {
            select: { id: true, companyName: true },
          },
          payments: {
            select: { id: true, amount: true, paymentDate: true, status: true },
          },
          _count: {
            select: { lineItems: true },
          },
        },
        orderBy: { invoiceDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    // Get summary stats
    const stats = await prisma.invoice.aggregate({
      where,
      _sum: {
        totalAmount: true,
        paidAmount: true,
        balanceDue: true,
      },
      _count: true,
    });

    const overdueCount = await prisma.invoice.count({
      where: {
        ...where,
        status: { in: ["PENDING", "SENT", "PARTIALLY_PAID"] },
        dueDate: { lt: new Date() },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        invoices,
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
          overdueCount,
        },
      },
    });
  } catch (error) {
    console.error("Invoices GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// POST - Generate invoice for client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientId,
      periodStart,
      periodEnd,
      shipmentIds, // Optional: specific shipments to invoice
      notes,
    } = body;

    // Validate required fields
    if (!clientId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get client details
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, companyName: true, gstNumber: true, billingAddress: true },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    // Get active rate card for client
    const rateCard = await prisma.rateCard.findFirst({
      where: { clientId, isActive: true },
      include: { zoneRates: true, weightSlabs: true },
    });

    // Get shipments to invoice
    const shipmentFilter: any = {
      clientId,
      createdAt: {
        gte: new Date(periodStart),
        lte: new Date(periodEnd),
      },
      status: { in: ["DELIVERED", "RTO_DELIVERED"] },
    };

    if (shipmentIds?.length) {
      shipmentFilter.id = { in: shipmentIds };
    }

    const shipments = await prisma.shipment.findMany({
      where: shipmentFilter,
      select: {
        id: true,
        awbNumber: true,
        chargeableWeightKg: true,
        actualWeightKg: true,
        volumetricWeightKg: true,
        paymentMode: true,
        codAmount: true,
        status: true,
        shipperPincode: true,
        consigneePincode: true,
      },
    });

    if (shipments.length === 0) {
      return NextResponse.json(
        { success: false, error: "No shipments found for the given period" },
        { status: 400 }
      );
    }

    // Calculate freight charges
    let freightCharges = 0;
    let codCharges = 0;
    let handlingCharges = 0;
    let deliveredCount = 0;
    let rtoCount = 0;

    const lineItems: any[] = [];

    for (const shipment of shipments) {
      const weight = shipment.actualWeightKg || shipment.chargeableWeightKg || 0.5;
      let freightRate = rateCard?.baseFreightPerKg || 50; // Default rate

      // Calculate freight for this shipment
      let shipmentFreight = Math.max(
        weight * freightRate,
        rateCard?.minFreight || 30
      );

      // RTO charge
      if (shipment.status === "RTO_DELIVERED") {
        shipmentFreight *= (rateCard?.rtoChargePercent || 100) / 100;
        rtoCount++;
      } else {
        deliveredCount++;
      }

      freightCharges += shipmentFreight;

      // COD charge
      let shipmentCodCharge = 0;
      if (shipment.paymentMode === "COD" && shipment.codAmount) {
        shipmentCodCharge = Math.max(
          (shipment.codAmount * (rateCard?.codChargePercent || 2)) / 100,
          rateCard?.codMinCharge || 20
        );
        codCharges += shipmentCodCharge;
      }

      // Handling charge
      const shipmentHandling = rateCard?.handlingChargePerShipment || 0;
      handlingCharges += shipmentHandling;

      // Add line item
      lineItems.push({
        shipmentId: shipment.id,
        awbNumber: shipment.awbNumber,
        description: `Freight - ${shipment.awbNumber} (${weight} kg)`,
        itemType: "FREIGHT",
        quantity: 1,
        rate: shipmentFreight,
        amount: shipmentFreight,
        weight,
        taxPercent: rateCard?.gstPercent || 18,
        taxAmount: (shipmentFreight * (rateCard?.gstPercent || 18)) / 100,
        totalAmount: shipmentFreight * (1 + (rateCard?.gstPercent || 18) / 100),
      });

      if (shipmentCodCharge > 0) {
        lineItems.push({
          shipmentId: shipment.id,
          awbNumber: shipment.awbNumber,
          description: `COD Charge - ${shipment.awbNumber}`,
          itemType: "COD_CHARGE",
          quantity: 1,
          rate: shipmentCodCharge,
          amount: shipmentCodCharge,
          taxPercent: rateCard?.gstPercent || 18,
          taxAmount: (shipmentCodCharge * (rateCard?.gstPercent || 18)) / 100,
          totalAmount: shipmentCodCharge * (1 + (rateCard?.gstPercent || 18) / 100),
        });
      }
    }

    // Add fuel surcharge
    const fuelSurcharge = (freightCharges * (rateCard?.fuelSurchargePercent || 0)) / 100;

    // Calculate totals
    const subtotal = freightCharges + codCharges + handlingCharges + fuelSurcharge;
    const gstPercent = rateCard?.gstPercent || 18;
    const gstAmount = (subtotal * gstPercent) / 100;
    const totalAmount = subtotal + gstAmount;

    // Payment terms
    const paymentTermsDays = rateCard?.paymentTermsDays || 7;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + paymentTermsDays);

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        clientId,
        clientName: client.companyName,
        clientGstin: client.gstNumber,
        clientAddress: client.billingAddress,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        invoiceDate: new Date(),
        dueDate,
        totalShipments: shipments.length,
        deliveredCount,
        rtoCount,
        freightCharges,
        codCharges,
        fuelSurcharge,
        handlingCharges,
        subtotal,
        taxAmount: gstAmount,
        gstAmount,
        cgstAmount: gstAmount / 2,
        sgstAmount: gstAmount / 2,
        totalAmount,
        netPayable: totalAmount,
        balanceDue: totalAmount,
        status: "DRAFT",
        notes,
        lineItems: {
          create: lineItems,
        },
      },
      include: {
        lineItems: true,
      },
    });

    // Create ledger entry
    await prisma.clientLedger.create({
      data: {
        clientId,
        transactionDate: new Date(),
        transactionType: "INVOICE",
        referenceType: "INVOICE",
        referenceId: invoice.id,
        referenceNumber: invoice.invoiceNumber,
        debitAmount: totalAmount,
        creditAmount: 0,
        balanceAmount: totalAmount, // This should be cumulative in production
        description: `Invoice ${invoice.invoiceNumber} - ${shipments.length} shipments`,
      },
    });

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Invoice POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
