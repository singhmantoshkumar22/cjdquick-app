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

    // Check if brand has access to OMS (FULFILLMENT or HYBRID service model)
    if (serviceModel !== "FULFILLMENT" && serviceModel !== "HYBRID") {
      return NextResponse.json({
        success: false,
        error: "OMS is only available for brands with Fulfillment service model",
      }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "last30days";

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "last7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "last30days":
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get warehouse assignments for this brand
    const warehouseAssignments = await prisma.brandWarehouseAssignment.findMany({
      where: { brandId, isActive: true },
      include: { location: true },
    });

    const assignedLocationIds = warehouseAssignments.map(w => w.locationId);

    // Parallel queries for OMS stats
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalInventoryValue,
      lowStockCount,
      pendingReceiving,
      totalReturns,
    ] = await Promise.all([
      // Total orders in the period
      prisma.unifiedOrder.count({
        where: {
          brandId,
          createdAt: { gte: startDate },
        },
      }),
      // Pending orders
      prisma.unifiedOrder.count({
        where: {
          brandId,
          status: { in: ["CREATED", "CONFIRMED", "PROCESSING", "READY_TO_SHIP"] },
        },
      }),
      // Completed orders in period
      prisma.unifiedOrder.count({
        where: {
          brandId,
          status: "DELIVERED",
          deliveredAt: { gte: startDate },
        },
      }),
      // Total inventory value (from brand's inventory items)
      prisma.inventoryItem.aggregate({
        where: {
          brandId,
          locationId: { in: assignedLocationIds },
        },
        _sum: {
          totalQuantity: true,
        },
      }),
      // Low stock items
      prisma.inventoryItem.count({
        where: {
          brandId,
          locationId: { in: assignedLocationIds },
          totalQuantity: { lt: prisma.inventoryItem.fields.minStockLevel },
        },
      }).catch(() => 0), // Fallback if query fails
      // Pending receiving orders
      prisma.receivingOrder.count({
        where: {
          brandId,
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
      }),
      // Returns in period - filter through order relation
      prisma.unifiedReturn.count({
        where: {
          order: { brandId },
          createdAt: { gte: startDate },
        },
      }).catch(() => 0),
    ]);

    // Calculate fulfillment rate
    const fulfillmentRate = totalOrders > 0
      ? Math.round((completedOrders / totalOrders) * 100)
      : 0;

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
          totalOrders,
          pendingOrders,
          completedOrders,
          fulfillmentRate,
        },
        inventory: {
          totalQuantity: totalInventoryValue._sum?.totalQuantity || 0,
          lowStockCount,
          pendingReceiving,
        },
        returns: {
          total: totalReturns,
        },
        period: {
          range,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("OMS Dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch OMS dashboard data" },
      { status: 500 }
    );
  }
}
