import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - List packing tasks and stations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const packStationId = searchParams.get("packStationId");
    const status = searchParams.get("status");
    const view = searchParams.get("view"); // "tasks" or "stations"
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get pack stations
    if (view === "stations") {
      const stationWhere: any = {};
      if (warehouseId) {
        stationWhere.zone = { warehouseId };
      }

      const stations = await prisma.packStation.findMany({
        where: stationWhere,
        include: {
          zone: {
            select: {
              id: true,
              code: true,
              name: true,
              warehouseId: true,
            },
          },
          packingTasks: {
            where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
            select: {
              id: true,
              taskNumber: true,
              status: true,
            },
          },
          _count: {
            select: {
              packingTasks: true,
            },
          },
        },
        orderBy: { code: "asc" },
      });

      const stationsWithStats = stations.map((station) => ({
        ...station,
        activeTasks: station.packingTasks.length,
        isAvailable: station.status === "ACTIVE" && station.packingTasks.length === 0,
      }));

      return NextResponse.json({
        success: true,
        data: stationsWithStats,
      });
    }

    // Get packing tasks
    const taskWhere: any = {};
    if (packStationId) taskWhere.packStationId = packStationId;
    if (status) taskWhere.status = status;
    if (warehouseId) {
      taskWhere.packStation = { zone: { warehouseId } };
    }

    const [tasks, total] = await Promise.all([
      prisma.packingTask.findMany({
        where: taskWhere,
        include: {
          packStation: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      }),
      prisma.packingTask.count({ where: taskWhere }),
    ]);

    // Parse items JSON and calculate progress
    const tasksWithProgress = tasks.map((task) => {
      let items: any[] = [];
      try {
        items = JSON.parse(task.itemsList || "[]");
      } catch {
        items = [];
      }

      const scannedItems = items.filter((i: any) => i.scanned).length;

      return {
        ...task,
        parsedItems: items,
        progress: {
          totalItems: task.totalItems || items.length,
          scannedItems,
          percent: items.length > 0 ? Math.round((scannedItems / items.length) * 100) : 0,
        },
      };
    });

    const stats = {
      pending: tasks.filter((t) => t.status === "PENDING").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      completed: tasks.filter((t) => t.status === "COMPLETED").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        items: tasksWithProgress,
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
    console.error("Get Packing Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch packing data" },
      { status: 500 }
    );
  }
}

// POST - Create packing task or pack station
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    // Create pack station
    if (type === "station") {
      const {
        zoneId,
        code,
        name,
        hasScale,
        hasPrinter,
        hasScanner,
        hasCamera,
      } = body;

      if (!zoneId || !code || !name) {
        return NextResponse.json(
          { success: false, error: "Zone ID, code, and name are required" },
          { status: 400 }
        );
      }

      const station = await prisma.packStation.create({
        data: {
          zoneId,
          code,
          name,
          hasScale: hasScale ?? true,
          hasPrinter: hasPrinter ?? true,
          hasScanner: hasScanner ?? true,
          hasCamera: hasCamera ?? false,
          status: "AVAILABLE",
        },
      });

      return NextResponse.json({
        success: true,
        data: station,
        message: "Pack station created successfully",
      });
    }

    // Create packing task
    const {
      packStationId,
      orderId,
      awbNumber,
      items,
      priority,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Generate task number
    const taskNumber = `PCK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const itemsList = items || [];
    const task = await prisma.packingTask.create({
      data: {
        packStationId,
        orderId,
        awbNumber,
        taskNumber,
        itemsList: JSON.stringify(itemsList),
        totalItems: itemsList.length,
        priority: priority || 5,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      data: task,
      message: "Packing task created successfully",
    });
  } catch (error) {
    console.error("Create Packing Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create packing resource" },
      { status: 500 }
    );
  }
}

// PATCH - Update packing task
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, itemSku, scannedBarcode, packageWeight, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    const task = await prisma.packingTask.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Handle specific actions
    if (action === "START") {
      const updated = await prisma.packingTask.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Packing started",
      });
    }

    if (action === "SCAN_ITEM" && itemSku) {
      let items: any[] = [];
      try {
        items = JSON.parse(task.itemsList || "[]");
      } catch {
        items = [];
      }

      // Find and mark item as scanned
      const itemIndex = items.findIndex(
        (i: any) => i.sku === itemSku && !i.scanned
      );

      if (itemIndex === -1) {
        return NextResponse.json(
          { success: false, error: "Item not found or already scanned" },
          { status: 400 }
        );
      }

      items[itemIndex].scanned = true;
      items[itemIndex].scannedAt = new Date().toISOString();
      items[itemIndex].scannedBarcode = scannedBarcode;

      const allScanned = items.every((i: any) => i.scanned);
      const scannedCount = items.filter((i: any) => i.scanned).length;

      const updated = await prisma.packingTask.update({
        where: { id },
        data: {
          itemsList: JSON.stringify(items),
          packedItems: scannedCount,
          allItemsScanned: allScanned,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          ...updated,
          parsedItems: items,
          allScanned,
        },
        message: `Item ${itemSku} scanned`,
      });
    }

    if (action === "VERIFY_WEIGHT") {
      const updated = await prisma.packingTask.update({
        where: { id },
        data: {
          packagedWeightGrams: packageWeight ? Math.round(packageWeight * 1000) : null,
          weightVerified: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Weight verified",
      });
    }

    if (action === "PRINT_LABEL") {
      const updated = await prisma.packingTask.update({
        where: { id },
        data: {
          shippingLabelPrinted: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Shipping label printed",
      });
    }

    if (action === "COMPLETE") {
      // Verify all steps completed
      if (!task.allItemsScanned) {
        return NextResponse.json(
          { success: false, error: "All items must be scanned first" },
          { status: 400 }
        );
      }

      const updated = await prisma.packingTask.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Packing completed",
      });
    }

    // General update
    const updated = await prisma.packingTask.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Task updated",
    });
  } catch (error) {
    console.error("Update Packing Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update packing task" },
      { status: 500 }
    );
  }
}

// PUT - Update pack station status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, assignedTo, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Station ID is required" },
        { status: 400 }
      );
    }

    const validStatuses = ["ACTIVE", "INACTIVE", "MAINTENANCE"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const station = await prisma.packStation.update({
      where: { id },
      data: { status, assignedTo, ...updateData },
    });

    return NextResponse.json({
      success: true,
      data: station,
      message: "Pack station updated",
    });
  } catch (error) {
    console.error("Update Station Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update pack station" },
      { status: 500 }
    );
  }
}
