import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";
import { getPortalUserFromRequest } from "@/lib/portal-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const brandId = user.brand.id;
    const serviceModel = user.brand.serviceModel;

    // Get warehouse assignments for this brand (may be empty for SHIPPING brands)
    const warehouseAssignments = await prisma.brandWarehouseAssignment.findMany({
      where: { brandId, isActive: true },
      include: { location: true },
    });

    const assignedLocationIds = warehouseAssignments.map(w => w.locationId);

    // Calculate date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Parallel queries for WMS stats
    const [
      totalSKUs,
      totalInventory,
      inventoryByLocation,
      ordersToday,
      ordersByStatus,
      inboundToday,
      pendingReceiving,
      returnsToday,
    ] = await Promise.all([
      // Total distinct SKUs in inventory
      prisma.inventoryItem.groupBy({
        by: ["sku"],
        where: {
          brandId,
          locationId: { in: assignedLocationIds },
        },
      }).then(r => r.length),

      // Total inventory quantity
      prisma.inventoryItem.aggregate({
        where: {
          brandId,
          locationId: { in: assignedLocationIds },
        },
        _sum: {
          totalQuantity: true,
        },
      }),

      // Inventory by location
      prisma.inventoryItem.groupBy({
        by: ["locationId"],
        where: {
          brandId,
          locationId: { in: assignedLocationIds },
        },
        _sum: {
          totalQuantity: true,
        },
        _count: {
          id: true,
        },
      }),

      // Orders placed today
      prisma.unifiedOrder.count({
        where: {
          brandId,
          createdAt: { gte: today, lt: tomorrow },
        },
      }),

      // Orders by fulfillment status
      prisma.unifiedOrder.groupBy({
        by: ["status"],
        where: {
          brandId,
          status: { in: ["CREATED", "CONFIRMED", "PROCESSING", "READY_TO_SHIP", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY"] },
        },
        _count: {
          id: true,
        },
      }),

      // Receiving orders expected today
      prisma.receivingOrder.count({
        where: {
          brandId,
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
      }),

      // Pending receiving orders
      prisma.receivingOrder.findMany({
        where: {
          brandId,
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          grnNumber: true,
          status: true,
          remarks: true,
          createdAt: true,
        },
      }),

      // Returns in transit (inbound)
      prisma.unifiedReturn.count({
        where: {
          order: { brandId },
          status: "IN_TRANSIT",
        },
      }).catch(() => 0),
    ]);

    // Map location data
    const locationMap = new Map(warehouseAssignments.map(w => [w.locationId, w.location]));

    // Calculate outbound stats (orders in different fulfillment stages)
    const outboundStats = {
      pendingPicklist: 0,
      pickingInProgress: 0,
      packed: 0,
      readyToShip: 0,
    };

    (ordersByStatus as Array<{ status: string; _count: { id: number } }>).forEach((s) => {
      switch (s.status) {
        case "CREATED":
        case "CONFIRMED":
          outboundStats.pendingPicklist += s._count.id;
          break;
        case "PROCESSING":
          outboundStats.pickingInProgress += s._count.id;
          break;
        case "READY_TO_SHIP":
          outboundStats.packed += s._count.id;
          break;
        case "SHIPPED":
        case "IN_TRANSIT":
        case "OUT_FOR_DELIVERY":
          outboundStats.readyToShip += s._count.id;
          break;
      }
    });

    // Format location stats
    const locationStats = (inventoryByLocation as Array<{ locationId: string; _sum: { totalQuantity: number | null }; _count: { id: number } }>).map((inv) => {
      const location = locationMap.get(inv.locationId);
      return {
        id: inv.locationId,
        name: location?.name || "Unknown",
        items: inv._sum.totalQuantity || 0,
        skuCount: inv._count.id,
        capacity: Math.min(Math.round(((inv._sum.totalQuantity || 0) / 500) * 100), 100), // Estimated capacity
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        serviceModel,
        assignedWarehouses: warehouseAssignments.map(w => ({
          id: w.locationId,
          name: w.location.name,
          isPrimary: w.isPrimary,
        })),
        overview: {
          totalSKUs,
          totalInventory: totalInventory._sum?.totalQuantity || 0,
          ordersToday,
          inboundToday,
          returnsInTransit: returnsToday,
        },
        outbound: {
          pendingPicklist: outboundStats.pendingPicklist,
          pickingInProgress: outboundStats.pickingInProgress,
          packed: outboundStats.packed,
          readyToShip: outboundStats.readyToShip,
          total: outboundStats.pendingPicklist + outboundStats.pickingInProgress + outboundStats.packed,
        },
        inbound: {
          expectedToday: inboundToday,
          pendingReceiving: pendingReceiving.length,
          pendingOrders: pendingReceiving,
        },
        locations: locationStats,
      },
    });
  } catch (error) {
    console.error("WMS Dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch WMS dashboard data" },
      { status: 500 }
    );
  }
}
