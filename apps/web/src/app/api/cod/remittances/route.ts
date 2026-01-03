import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// Generate remittance number
function generateRemittanceNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REM${dateStr}${random}`;
}

// GET - List COD remittances
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const [remittances, total] = await Promise.all([
      prisma.cODRemittance.findMany({
        where,
        include: {
          collections: {
            select: {
              id: true,
              awbNumber: true,
              collectedAmount: true,
            },
            take: 10,
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.cODRemittance.count({ where }),
    ]);

    // Get summary
    const stats = await prisma.cODRemittance.aggregate({
      where,
      _sum: {
        grossCodCollected: true,
        netRemittance: true,
        deductions: true,
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        remittances,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        stats: {
          totalRemittances: stats._count,
          totalGross: stats._sum.grossCodCollected || 0,
          totalNet: stats._sum.netRemittance || 0,
          totalDeductions: stats._sum.deductions || 0,
        },
      },
    });
  } catch (error) {
    console.error("COD Remittances GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch COD remittances" },
      { status: 500 }
    );
  }
}

// POST - Create a new remittance (pay client)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientId,
      periodStart,
      periodEnd,
      collectionIds,
      deductions,
      deductionDetails,
      bankAccountNumber,
      bankIfsc,
      bankName,
      remarks,
    } = body;

    // Validate required fields
    if (!clientId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get eligible collections for this client in the period
    let collections;
    if (collectionIds?.length) {
      collections = await prisma.cODCollection.findMany({
        where: {
          id: { in: collectionIds },
          status: "DEPOSITED",
          isReconciled: false,
        },
      });
    } else {
      // Get all unreconciled deposited collections for the client in the period
      const shipments = await prisma.shipment.findMany({
        where: {
          clientId,
          paymentMode: "COD",
          status: "DELIVERED",
          deliveredAt: {
            gte: new Date(periodStart),
            lte: new Date(periodEnd),
          },
        },
        select: { awbNumber: true },
      });

      const awbNumbers = shipments.map((s) => s.awbNumber);

      collections = await prisma.cODCollection.findMany({
        where: {
          awbNumber: { in: awbNumbers },
          status: "DEPOSITED",
          isReconciled: false,
        },
      });
    }

    if (collections.length === 0) {
      return NextResponse.json(
        { success: false, error: "No eligible collections found for remittance" },
        { status: 400 }
      );
    }

    // Calculate amounts
    const grossCodCollected = collections.reduce((sum, c) => sum + c.collectedAmount, 0);
    const totalDeductions = deductions || 0;
    const netRemittance = grossCodCollected - totalDeductions;

    // Create remittance
    const remittance = await prisma.cODRemittance.create({
      data: {
        remittanceNumber: generateRemittanceNumber(),
        clientId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        grossCodCollected,
        deductions: totalDeductions,
        netRemittance,
        deductionDetails: deductionDetails ? JSON.stringify(deductionDetails) : null,
        shipmentCount: collections.length,
        deliveredCount: collections.length,
        rtoCount: 0,
        status: "PENDING",
        bankAccountNumber,
        bankIfsc,
        bankName,
        remarks,
      },
    });

    // Update collections with remittance reference
    await prisma.cODCollection.updateMany({
      where: { id: { in: collections.map((c) => c.id) } },
      data: {
        remittanceId: remittance.id,
        isReconciled: true,
        reconciledAt: new Date(),
        status: "RECONCILED",
      },
    });

    // Create ledger entry
    await prisma.cODLedger.create({
      data: {
        transactionType: "REMITTANCE",
        referenceType: "REMITTANCE",
        referenceId: remittance.id,
        clientId,
        amount: netRemittance,
        direction: "DEBIT",
        description: `COD remittance to client - ${collections.length} shipments`,
        transactionTime: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: remittance,
    });
  } catch (error) {
    console.error("COD Remittance POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create COD remittance" },
      { status: 500 }
    );
  }
}
