import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - List receiving records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status;

    const [records, total] = await Promise.all([
      prisma.receivingRecord.findMany({
        where,
        include: {
          items: {
            select: {
              id: true,
              sku: true,
              itemName: true,
              expectedQty: true,
              receivedQty: true,
              damagedQty: true,
              status: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.receivingRecord.count({ where }),
    ]);

    // Calculate progress for each record
    const recordsWithProgress = records.map((record) => {
      const expectedQty = record.items.reduce((sum: number, i) => sum + i.expectedQty, 0);
      const receivedQty = record.items.reduce((sum: number, i) => sum + i.receivedQty, 0);
      const progressPercent = expectedQty > 0 ? (receivedQty / expectedQty) * 100 : 0;

      return {
        ...record,
        progress: {
          expectedQuantity: expectedQty,
          receivedQuantity: receivedQty,
          percent: Math.round(progressPercent),
          itemsTotal: record.items.length,
          itemsReceived: record.items.filter((i) => i.status === "RECEIVED").length,
        },
      };
    });

    const stats = {
      expected: records.filter((r) => r.status === "EXPECTED").length,
      inProgress: records.filter((r) => r.status === "IN_PROGRESS").length,
      completed: records.filter((r) => r.status === "COMPLETED").length,
      totalItems: records.reduce((sum, r) => sum + r.items.length, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        items: recordsWithProgress,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        stats,
      },
    });
  } catch (error) {
    console.error("Get Receiving Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch receiving records" },
      { status: 500 }
    );
  }
}

// POST - Create receiving record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      warehouseId,
      supplierId,
      supplierName,
      poNumber,
      carrierName,
      trackingNumber,
      vehicleNumber,
      expectedDate,
      dockDoor,
      items,
      notes,
    } = body;

    if (!warehouseId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Warehouse ID and items are required" },
        { status: 400 }
      );
    }

    // Generate receipt number
    const receiptNumber = `RCV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Calculate expected totals
    const expectedItems = items.length;
    const expectedUnits = items.reduce((sum: number, item: any) => sum + (item.expectedQty || 0), 0);

    // Create receiving record with items
    const record = await prisma.receivingRecord.create({
      data: {
        warehouseId,
        receiptNumber,
        supplierId,
        supplierName,
        poNumber,
        carrierName,
        trackingNumber,
        vehicleNumber,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        expectedItems,
        expectedUnits,
        dockDoor,
        notes,
        status: "EXPECTED",
        items: {
          create: items.map((item: any) => ({
            sku: item.sku,
            itemName: item.itemName || item.name || item.sku,
            barcode: item.barcode,
            expectedQty: item.expectedQty || item.quantity || 0,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            lotNumber: item.lotNumber,
            status: "PENDING",
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: record,
      message: "Receiving record created successfully",
    });
  } catch (error) {
    console.error("Create Receiving Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create receiving record" },
      { status: 500 }
    );
  }
}

// PATCH - Update receiving record or items
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      action,
      itemId,
      receivedQty,
      damagedQty,
      putawayBinId,
      qcStatus,
      notes,
      receivedBy,
      ...updateData
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Receiving record ID is required" },
        { status: 400 }
      );
    }

    // Handle different actions
    if (action === "ARRIVED") {
      const record = await prisma.receivingRecord.update({
        where: { id },
        data: {
          status: "ARRIVED",
          receivedDate: new Date(),
          receivedBy,
        },
      });

      return NextResponse.json({
        success: true,
        data: record,
        message: "Shipment arrived",
      });
    }

    if (action === "START") {
      const record = await prisma.receivingRecord.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
        },
      });

      return NextResponse.json({
        success: true,
        data: record,
        message: "Receiving started",
      });
    }

    if (action === "RECEIVE_ITEM" && itemId) {
      // Update individual item
      const item = await prisma.receivingItem.update({
        where: { id: itemId },
        data: {
          receivedQty: receivedQty || 0,
          rejectedQty: damagedQty || 0,
          acceptedQty: (receivedQty || 0) - (damagedQty || 0),
          binId: putawayBinId,
          qcStatus: qcStatus || "PASSED",
        },
      });

      // Update bin status if putaway bin specified
      if (putawayBinId) {
        await prisma.storageBin.update({
          where: { id: putawayBinId },
          data: { status: "PARTIAL" },
        });
      }

      // Check if all items are received
      const allItems = await prisma.receivingItem.findMany({
        where: { receivingId: id },
      });

      const allReceived = allItems.every((i) => i.qcStatus === "PASSED" || i.qcStatus === "FAILED");

      // Update totals
      const receivedItems = allItems.filter((i) => i.receivedQty > 0).length;
      const receivedUnits = allItems.reduce((sum, i) => sum + i.receivedQty, 0);
      const damagedItems = allItems.filter((i) => i.rejectedQty > 0).length;

      await prisma.receivingRecord.update({
        where: { id },
        data: {
          receivedItems,
          receivedUnits,
          damagedItems,
          status: allReceived ? "COMPLETED" : "IN_PROGRESS",
        },
      });

      return NextResponse.json({
        success: true,
        data: item,
        allReceived,
        message: "Item received",
      });
    }

    if (action === "COMPLETE") {
      const record = await prisma.receivingRecord.update({
        where: { id },
        data: {
          status: "COMPLETED",
        },
      });

      return NextResponse.json({
        success: true,
        data: record,
        message: "Receiving completed",
      });
    }

    if (action === "VERIFY") {
      const record = await prisma.receivingRecord.update({
        where: { id },
        data: {
          verifiedBy: updateData.verifiedBy,
        },
      });

      return NextResponse.json({
        success: true,
        data: record,
        message: "Receiving verified",
      });
    }

    if (action === "REJECT_ITEM" && itemId) {
      const item = await prisma.receivingItem.update({
        where: { id: itemId },
        data: {
          qcStatus: "FAILED",
          qcRemarks: notes,
        },
      });

      return NextResponse.json({
        success: true,
        data: item,
        message: "Item rejected",
      });
    }

    // General update
    const record = await prisma.receivingRecord.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: record,
      message: "Receiving record updated",
    });
  } catch (error) {
    console.error("Update Receiving Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update receiving record" },
      { status: 500 }
    );
  }
}

// PUT - Bulk receive items
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { receivingId, items } = body;

    if (!receivingId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Receiving ID and items are required" },
        { status: 400 }
      );
    }

    const record = await prisma.receivingRecord.findUnique({
      where: { id: receivingId },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: "Receiving record not found" },
        { status: 404 }
      );
    }

    // Process each item
    const results = await prisma.$transaction(
      items.map((item: any) =>
        prisma.receivingItem.update({
          where: { id: item.id },
          data: {
            receivedQty: item.receivedQty,
            rejectedQty: item.damagedQty || 0,
            acceptedQty: (item.receivedQty || 0) - (item.damagedQty || 0),
            binId: item.putawayBinId,
            qcStatus: item.qcStatus || "PASSED",
          },
        })
      )
    );

    // Check if all done
    const allItems = await prisma.receivingItem.findMany({
      where: { receivingId },
    });

    const allReceived = allItems.every((i) => i.qcStatus === "PASSED" || i.qcStatus === "FAILED");
    const receivedItems = allItems.filter((i) => i.receivedQty > 0).length;
    const receivedUnits = allItems.reduce((sum, i) => sum + i.receivedQty, 0);

    await prisma.receivingRecord.update({
      where: { id: receivingId },
      data: {
        receivedItems,
        receivedUnits,
        status: allReceived ? "COMPLETED" : "IN_PROGRESS",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        itemsProcessed: results.length,
        allReceived,
      },
      message: `${results.length} items received`,
    });
  } catch (error) {
    console.error("Bulk Receive Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process bulk receive" },
      { status: 500 }
    );
  }
}
