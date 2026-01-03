import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - List pick lists with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const waveId = searchParams.get("waveId");
    const status = searchParams.get("status");
    const assignedTo = searchParams.get("assignedTo");
    const priority = searchParams.get("priority");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (warehouseId) where.warehouseId = warehouseId;
    if (waveId) where.waveId = waveId;
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;
    if (priority) where.priority = priority;

    const [pickLists, total] = await Promise.all([
      prisma.pickList.findMany({
        where,
        include: {
          wave: {
            select: {
              id: true,
              waveNumber: true,
              status: true,
            },
          },
          items: {
            include: {
              item: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      }),
      prisma.pickList.count({ where }),
    ]);

    // Calculate progress for each pick list
    const pickListsWithProgress = pickLists.map((pl) => {
      const totalItems = pl.items.length;
      const pickedItems = pl.items.filter((i) => i.status === "PICKED").length;
      const progressPercent = totalItems > 0 ? (pickedItems / totalItems) * 100 : 0;

      const totalQty = pl.items.reduce((sum, i) => sum + i.quantityRequired, 0);
      const pickedQty = pl.items.reduce((sum, i) => sum + i.quantityPicked, 0);

      return {
        ...pl,
        progress: {
          itemsTotal: totalItems,
          itemsPicked: pickedItems,
          qtyTotal: totalQty,
          qtyPicked: pickedQty,
          percent: Math.round(progressPercent),
        },
      };
    });

    // Get summary stats
    const stats = {
      pending: pickLists.filter((p) => p.status === "PENDING").length,
      inProgress: pickLists.filter((p) => p.status === "IN_PROGRESS").length,
      completed: pickLists.filter((p) => p.status === "COMPLETED").length,
      totalItems: pickLists.reduce((sum, p) => sum + p._count.items, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        items: pickListsWithProgress,
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
    console.error("Get Pick Lists Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pick lists" },
      { status: 500 }
    );
  }
}

// POST - Create pick list from orders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      warehouseId,
      waveId,
      orderIds,
      pickMethod,
      priority,
      assignedTo,
      items,
    } = body;

    if (!warehouseId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Warehouse ID and items are required" },
        { status: 400 }
      );
    }

    // Generate pick list number
    const pickListNumber = `PL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create pick list with items
    const pickList = await prisma.pickList.create({
      data: {
        warehouseId,
        waveId,
        pickListNumber,
        pickMethod: pickMethod || "DISCRETE",
        priority: priority || 5,
        orderIds: JSON.stringify(orderIds || []),
        assignedTo,
        status: "PENDING",
        items: {
          create: items.map((item: any, index: number) => ({
            itemId: item.itemId || item.inventoryItemId,
            orderId: item.orderId || orderIds?.[0] || "",
            binCode: item.binCode || "",
            binId: item.binId || item.sourceBinId,
            batchNumber: item.batchNumber || item.batchId,
            quantityRequired: item.quantity || item.quantityRequired || 1,
            sequence: item.sequence || item.pickSequence || index + 1,
            status: "PENDING",
          })),
        },
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: pickList,
      message: "Pick list created successfully",
    });
  } catch (error) {
    console.error("Create Pick List Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create pick list" },
      { status: 500 }
    );
  }
}

// PATCH - Update pick list or pick items
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, itemId, pickedQuantity, status, assignedTo, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Pick list ID is required" },
        { status: 400 }
      );
    }

    // Handle different actions
    if (action === "START_PICKING") {
      const pickList = await prisma.pickList.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: pickList,
        message: "Picking started",
      });
    }

    if (action === "PICK_ITEM" && itemId) {
      // Update individual item
      const item = await prisma.pickListItem.update({
        where: { id: itemId },
        data: {
          quantityPicked: pickedQuantity || 0,
          status: pickedQuantity > 0 ? "PICKED" : "PENDING",
          pickedAt: pickedQuantity > 0 ? new Date() : null,
        },
      });

      // Check if all items are picked
      const allItems = await prisma.pickListItem.findMany({
        where: { pickListId: id },
      });

      const allPicked = allItems.every((i) => i.status === "PICKED");
      if (allPicked) {
        await prisma.pickList.update({
          where: { id },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      }

      return NextResponse.json({
        success: true,
        data: item,
        allPicked,
        message: "Item picked",
      });
    }

    if (action === "COMPLETE") {
      const pickList = await prisma.pickList.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: pickList,
        message: "Pick list completed",
      });
    }

    if (action === "ASSIGN") {
      const pickList = await prisma.pickList.update({
        where: { id },
        data: { assignedTo },
      });

      return NextResponse.json({
        success: true,
        data: pickList,
        message: "Pick list assigned",
      });
    }

    // General update
    const pickList = await prisma.pickList.update({
      where: { id },
      data: { status, ...updateData },
    });

    return NextResponse.json({
      success: true,
      data: pickList,
      message: "Pick list updated",
    });
  } catch (error) {
    console.error("Update Pick List Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update pick list" },
      { status: 500 }
    );
  }
}

// PUT - Generate optimized pick route
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { pickListId } = body;

    if (!pickListId) {
      return NextResponse.json(
        { success: false, error: "Pick list ID is required" },
        { status: 400 }
      );
    }

    // Get pick list items with bin locations
    const pickList = await prisma.pickList.findUnique({
      where: { id: pickListId },
      include: {
        items: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    // Get bin details for items that have binId
    const binIds = pickList?.items
      .map((i) => i.binId)
      .filter((id): id is string => Boolean(id)) || [];
    const bins = binIds.length > 0
      ? await prisma.storageBin.findMany({
          where: { id: { in: binIds } },
          select: { id: true, code: true, aisle: true, rack: true, level: true },
        })
      : [];
    const binMap = new Map(bins.map((b) => [b.id, b]));

    if (!pickList) {
      return NextResponse.json(
        { success: false, error: "Pick list not found" },
        { status: 404 }
      );
    }

    // Enrich items with bin data
    const enrichedItems = pickList.items.map((item) => ({
      ...item,
      bin: item.binId ? binMap.get(item.binId) : null,
    }));

    // Optimize route by sorting bins (aisle -> rack -> level)
    const optimizedItems = [...enrichedItems].sort((a, b) => {
      if (!a.bin || !b.bin) return 0;

      // Sort by aisle first
      const aisleCompare = (a.bin.aisle || "").localeCompare(b.bin.aisle || "");
      if (aisleCompare !== 0) return aisleCompare;

      // Then by rack
      const rackCompare = (a.bin.rack || "").localeCompare(b.bin.rack || "");
      if (rackCompare !== 0) return rackCompare;

      // Then by level (descending - pick from top first for efficiency)
      return (b.bin.level || "").localeCompare(a.bin.level || "");
    });

    // Update pick sequences
    await prisma.$transaction(
      optimizedItems.map((item, index) =>
        prisma.pickListItem.update({
          where: { id: item.id },
          data: { sequence: index + 1 },
        })
      )
    );

    // Generate route summary
    const route = optimizedItems.map((item, index) => ({
      sequence: index + 1,
      binCode: item.bin?.code || item.binCode,
      aisle: item.bin?.aisle,
      rack: item.bin?.rack,
      level: item.bin?.level,
      itemId: item.id,
      quantity: item.quantityRequired,
    }));

    // Save optimized route
    await prisma.pickList.update({
      where: { id: pickListId },
      data: { optimizedRoute: JSON.stringify(route) },
    });

    return NextResponse.json({
      success: true,
      data: {
        pickListId,
        route,
        totalStops: route.length,
        estimatedDistance: `${route.length * 5}m`, // Rough estimate
      },
      message: "Pick route optimized",
    });
  } catch (error) {
    console.error("Optimize Route Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to optimize pick route" },
      { status: 500 }
    );
  }
}
