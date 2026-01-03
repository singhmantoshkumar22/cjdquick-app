import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// Generate deposit number
function generateDepositNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DEP${dateStr}${random}`;
}

// GET - List COD deposits
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const hubId = searchParams.get("hubId");
    const depositedById = searchParams.get("depositedById");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};

    if (status) where.status = status;
    if (hubId) where.hubId = hubId;
    if (depositedById) where.depositedById = depositedById;

    if (dateFrom || dateTo) {
      where.depositTime = {};
      if (dateFrom) where.depositTime.gte = new Date(dateFrom);
      if (dateTo) where.depositTime.lte = new Date(dateTo);
    }

    const [deposits, total] = await Promise.all([
      prisma.cODDeposit.findMany({
        where,
        include: {
          collections: {
            select: {
              id: true,
              awbNumber: true,
              collectedAmount: true,
              paymentMode: true,
            },
          },
        },
        orderBy: { depositTime: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.cODDeposit.count({ where }),
    ]);

    // Get summary
    const stats = await prisma.cODDeposit.aggregate({
      where,
      _sum: {
        expectedAmount: true,
        depositedAmount: true,
        shortageAmount: true,
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        deposits,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        stats: {
          totalDeposits: stats._count,
          totalExpected: stats._sum.expectedAmount || 0,
          totalDeposited: stats._sum.depositedAmount || 0,
          totalShortage: stats._sum.shortageAmount || 0,
        },
      },
    });
  } catch (error) {
    console.error("COD Deposits GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch COD deposits" },
      { status: 500 }
    );
  }
}

// POST - Create a new deposit (driver deposits cash at hub)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      depositedById,
      depositedByName,
      depositedByType,
      receivedById,
      receivedByName,
      hubId,
      collectionIds,
      depositedAmount,
      cashAmount,
      upiAmount,
      cardAmount,
      chequeAmount,
      remarks,
    } = body;

    // Validate required fields
    if (!depositedById || !receivedById || !hubId || !collectionIds?.length) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the collections being deposited
    const collections = await prisma.cODCollection.findMany({
      where: {
        id: { in: collectionIds },
        status: "COLLECTED",
      },
    });

    if (collections.length !== collectionIds.length) {
      return NextResponse.json(
        { success: false, error: "Some collections are invalid or already deposited" },
        { status: 400 }
      );
    }

    // Calculate expected amount
    const expectedAmount = collections.reduce((sum, c) => sum + c.collectedAmount, 0);
    const actualDeposited = depositedAmount || expectedAmount;
    const shortageAmount = Math.max(0, expectedAmount - actualDeposited);
    const excessAmount = Math.max(0, actualDeposited - expectedAmount);

    // Create deposit record
    const deposit = await prisma.cODDeposit.create({
      data: {
        depositNumber: generateDepositNumber(),
        depositedById,
        depositedByName,
        depositedByType: depositedByType || "DRIVER",
        receivedById,
        receivedByName,
        hubId,
        expectedAmount,
        depositedAmount: actualDeposited,
        shortageAmount,
        excessAmount,
        collectionCount: collections.length,
        cashAmount: cashAmount || 0,
        upiAmount: upiAmount || 0,
        cardAmount: cardAmount || 0,
        chequeAmount: chequeAmount || 0,
        status: shortageAmount > 0 ? "DISCREPANCY" : "VERIFIED",
        depositTime: new Date(),
        verifiedAt: shortageAmount === 0 ? new Date() : null,
        verifiedBy: shortageAmount === 0 ? receivedById : null,
      },
    });

    // Update collections with deposit reference
    await prisma.cODCollection.updateMany({
      where: { id: { in: collectionIds } },
      data: {
        depositId: deposit.id,
        depositedAt: new Date(),
        status: "DEPOSITED",
      },
    });

    // Create ledger entry
    await prisma.cODLedger.create({
      data: {
        transactionType: "DEPOSIT",
        referenceType: "DEPOSIT",
        referenceId: deposit.id,
        driverId: depositedByType === "DRIVER" ? depositedById : null,
        hubId,
        amount: actualDeposited,
        direction: "DEBIT",
        description: `COD deposited at hub - ${collections.length} collections`,
        transactionTime: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: deposit,
    });
  } catch (error) {
    console.error("COD Deposit POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create COD deposit" },
      { status: 500 }
    );
  }
}
