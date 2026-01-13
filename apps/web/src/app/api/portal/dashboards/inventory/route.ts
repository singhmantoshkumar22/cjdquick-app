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
        error: "Inventory dashboard is only available for brands with Fulfillment service model",
      }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get("locationId");

    // Get warehouse assignments for this brand
    const warehouseAssignments = await prisma.brandWarehouseAssignment.findMany({
      where: { brandId, isActive: true },
      include: { location: true },
    });

    const assignedLocationIds = warehouseAssignments.map(w => w.locationId);

    // Filter by specific location if provided
    const locationFilter = locationId
      ? { locationId }
      : { locationId: { in: assignedLocationIds } };

    // Get inventory stats
    const [
      inventoryItems,
      totalItems,
      lowStockItems,
      inventoryByLocation,
    ] = await Promise.all([
      // Get inventory items with pagination
      prisma.inventoryItem.findMany({
        where: {
          brandId,
          ...locationFilter,
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          id: true,
          sku: true,
          name: true,
          category: true,
          totalQuantity: true,
          reservedQty: true,
          availableQty: true,
          minStockLevel: true,
          costPrice: true,
          status: true,
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      // Total inventory items count
      prisma.inventoryItem.count({
        where: {
          brandId,
          ...locationFilter,
        },
      }),
      // Low stock items
      prisma.inventoryItem.findMany({
        where: {
          brandId,
          ...locationFilter,
          status: "ACTIVE",
        },
        select: {
          id: true,
          sku: true,
          name: true,
          totalQuantity: true,
          minStockLevel: true,
          location: {
            select: { name: true },
          },
        },
      }).then(items => items.filter(item => item.totalQuantity < item.minStockLevel)),
      // Inventory by location
      prisma.inventoryItem.groupBy({
        by: ["locationId"],
        where: {
          brandId,
          locationId: { in: assignedLocationIds },
        },
        _sum: {
          totalQuantity: true,
          availableQty: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Map location data
    const locationMap = new Map(warehouseAssignments.map(w => [w.locationId, w.location.name]));
    const inventoryByLocationWithNames = inventoryByLocation
      .filter(loc => loc.locationId !== null)
      .map(loc => ({
        locationId: loc.locationId!,
        locationName: locationMap.get(loc.locationId!) || "Unknown",
        totalQuantity: loc._sum?.totalQuantity || 0,
        availableQty: loc._sum?.availableQty || 0,
        skuCount: loc._count?.id || 0,
      }));

    // Calculate totals
    const totalQuantity = inventoryByLocationWithNames.reduce((acc, loc) => acc + loc.totalQuantity, 0);
    const totalAvailable = inventoryByLocationWithNames.reduce((acc, loc) => acc + loc.availableQty, 0);
    const totalValue = inventoryItems.reduce((acc, item) => acc + ((item.costPrice || 0) * item.totalQuantity), 0);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSKUs: totalItems,
          totalQuantity,
          totalAvailable,
          totalValue: Math.round(totalValue * 100) / 100,
          lowStockCount: lowStockItems.length,
        },
        inventoryByLocation: inventoryByLocationWithNames,
        lowStockItems: lowStockItems.slice(0, 10),
        items: inventoryItems,
        assignedWarehouses: warehouseAssignments.map(w => ({
          id: w.locationId,
          name: w.location.name,
          isPrimary: w.isPrimary,
        })),
      },
    });
  } catch (error) {
    console.error("Inventory Dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inventory data" },
      { status: 500 }
    );
  }
}
