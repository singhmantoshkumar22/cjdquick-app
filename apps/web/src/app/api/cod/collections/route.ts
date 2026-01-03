import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - List COD collections with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const collectedById = searchParams.get("collectedById");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (collectedById) {
      where.collectedById = collectedById;
    }

    if (dateFrom || dateTo) {
      where.collectionTime = {};
      if (dateFrom) {
        where.collectionTime.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.collectionTime.lte = new Date(dateTo);
      }
    }

    const [collections, total] = await Promise.all([
      prisma.cODCollection.findMany({
        where,
        orderBy: { collectionTime: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.cODCollection.count({ where }),
    ]);

    // Get summary stats
    const stats = await prisma.cODCollection.aggregate({
      where,
      _sum: {
        expectedAmount: true,
        collectedAmount: true,
        shortageAmount: true,
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        collections,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        stats: {
          totalCollections: stats._count,
          totalExpected: stats._sum.expectedAmount || 0,
          totalCollected: stats._sum.collectedAmount || 0,
          totalShortage: stats._sum.shortageAmount || 0,
        },
      },
    });
  } catch (error) {
    console.error("COD Collections GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch COD collections" },
      { status: 500 }
    );
  }
}

// POST - Record a new COD collection (from mobile app on delivery)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      shipmentId,
      orderId,
      awbNumber,
      expectedAmount,
      collectedAmount,
      paymentMode,
      paymentRef,
      collectedById,
      collectedByName,
      collectedByType,
      latitude,
      longitude,
      remarks,
    } = body;

    // Validate required fields
    if (!awbNumber || !expectedAmount || !collectedById || !collectedByName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if collection already exists for this AWB
    const existing = await prisma.cODCollection.findFirst({
      where: { awbNumber },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "COD already collected for this AWB" },
        { status: 409 }
      );
    }

    const shortageAmount = Math.max(0, expectedAmount - (collectedAmount || expectedAmount));

    const collection = await prisma.cODCollection.create({
      data: {
        shipmentId,
        orderId,
        awbNumber,
        expectedAmount,
        collectedAmount: collectedAmount || expectedAmount,
        shortageAmount,
        paymentMode: paymentMode || "CASH",
        paymentRef,
        collectedById,
        collectedByName,
        collectedByType: collectedByType || "DRIVER",
        collectionTime: new Date(),
        latitude,
        longitude,
        remarks,
        status: "COLLECTED",
      },
    });

    // Create ledger entry
    await prisma.cODLedger.create({
      data: {
        transactionType: "COLLECTION",
        referenceType: "COLLECTION",
        referenceId: collection.id,
        driverId: collectedByType === "DRIVER" ? collectedById : null,
        amount: collection.collectedAmount,
        direction: "CREDIT",
        description: `COD collected for AWB ${awbNumber}`,
        awbNumber,
        transactionTime: new Date(),
      },
    });

    // Update shipment COD status if shipmentId provided
    if (shipmentId) {
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: {
          status: "DELIVERED",
          podCaptured: true,
          deliveredAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: collection,
    });
  } catch (error) {
    console.error("COD Collection POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record COD collection" },
      { status: 500 }
    );
  }
}
