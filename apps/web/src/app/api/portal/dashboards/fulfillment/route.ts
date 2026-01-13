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
        error: "Fulfillment dashboard is only available for brands with Fulfillment service model",
      }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get("locationId");
    const range = searchParams.get("range") || "today";

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "yesterday":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case "last7days":
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get warehouse assignments for this brand
    const warehouseAssignments = await prisma.brandWarehouseAssignment.findMany({
      where: { brandId, isActive: true },
      include: { location: true },
    });

    const assignedLocationIds = warehouseAssignments.map(w => w.locationId);

    // Get fulfillment stats
    const [
      pendingPicklist,
      pickedOrders,
      packedOrders,
      shippedToday,
      receivingOrders,
      ordersByLocation,
    ] = await Promise.all([
      // Pending picklist
      prisma.unifiedOrder.count({
        where: {
          brandId,
          status: { in: ["CONFIRMED", "PROCESSING"] },
        },
      }),
      // Picked orders
      prisma.unifiedOrder.count({
        where: {
          brandId,
          status: "PICKED",
        },
      }),
      // Packed orders
      prisma.unifiedOrder.count({
        where: {
          brandId,
          status: { in: ["PACKED", "READY_TO_SHIP"] },
        },
      }),
      // Shipped today
      prisma.unifiedOrder.count({
        where: {
          brandId,
          status: { in: ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"] },
          updatedAt: { gte: startDate },
        },
      }),
      // Pending receiving orders
      prisma.receivingOrder.findMany({
        where: {
          brandId,
          status: { in: ["PENDING", "IN_PROGRESS"] },
          locationId: locationId ? locationId : { in: assignedLocationIds },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          receivingNumber: true,
          type: true,
          status: true,
          location: {
            select: { name: true },
          },
          createdAt: true,
        },
      }),
      // Orders by location (for brands using multiple warehouses)
      prisma.brandWarehouseAssignment.findMany({
        where: {
          brandId,
          isActive: true,
        },
        include: {
          location: true,
        },
      }),
    ]);

    // Calculate total in process
    const totalInProcess = pendingPicklist + pickedOrders + packedOrders;

    // Get fulfillment performance metrics
    const deliveredOrders = await prisma.unifiedOrder.count({
      where: {
        brandId,
        status: "DELIVERED",
        deliveredAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const totalOrders30d = await prisma.unifiedOrder.count({
      where: {
        brandId,
        createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const onTimeRate = totalOrders30d > 0
      ? Math.round((deliveredOrders / totalOrders30d) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalInProcess,
          pendingPicklist,
          picked: pickedOrders,
          packed: packedOrders,
          shippedToday,
          onTimeRate,
        },
        pendingReceiving: receivingOrders,
        warehouses: ordersByLocation.map(w => ({
          id: w.locationId,
          name: w.location.name,
          isPrimary: w.isPrimary,
          allocatedCapacity: w.allocatedCapacityCbm,
          slaPickingHours: w.slaPickingHours,
          slaPackingHours: w.slaPackingHours,
        })),
        period: {
          range,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Fulfillment Dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch fulfillment data" },
      { status: 500 }
    );
  }
}
