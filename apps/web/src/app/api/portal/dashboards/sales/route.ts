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
        error: "Sales dashboard is only available for brands with Fulfillment service model",
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

    // Get sales stats
    const [
      totalOrders,
      totalRevenue,
      ordersByStatus,
      ordersByChannel,
      ordersByPaymentMode,
      recentOrders,
    ] = await Promise.all([
      // Total orders in period
      prisma.unifiedOrder.count({
        where: {
          brandId,
          createdAt: { gte: startDate },
        },
      }),
      // Total revenue
      prisma.unifiedOrder.aggregate({
        where: {
          brandId,
          status: "DELIVERED",
          deliveredAt: { gte: startDate },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      // Orders by status
      prisma.unifiedOrder.groupBy({
        by: ["status"],
        where: {
          brandId,
          createdAt: { gte: startDate },
        },
        _count: {
          id: true,
        },
      }),
      // Orders by channel
      prisma.unifiedOrder.groupBy({
        by: ["channel"],
        where: {
          brandId,
          createdAt: { gte: startDate },
        },
        _count: {
          id: true,
        },
        _sum: {
          totalAmount: true,
        },
      }),
      // Orders by payment mode
      prisma.unifiedOrder.groupBy({
        by: ["paymentMode"],
        where: {
          brandId,
          createdAt: { gte: startDate },
        },
        _count: {
          id: true,
        },
        _sum: {
          totalAmount: true,
        },
      }),
      // Recent orders
      prisma.unifiedOrder.findMany({
        where: {
          brandId,
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          shippingCity: true,
          totalAmount: true,
          paymentMode: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Calculate averages
    const avgOrderValue = totalOrders > 0
      ? Math.round((totalRevenue._sum?.totalAmount || 0) / totalOrders)
      : 0;

    // Map status counts
    const statusCounts = ordersByStatus.reduce((acc, s) => {
      acc[s.status] = s._count?.id || 0;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          totalRevenue: totalRevenue._sum?.totalAmount || 0,
          avgOrderValue,
          deliveredOrders: statusCounts["DELIVERED"] || 0,
          pendingOrders: (statusCounts["CREATED"] || 0) + (statusCounts["CONFIRMED"] || 0) + (statusCounts["PROCESSING"] || 0),
          inTransitOrders: (statusCounts["IN_TRANSIT"] || 0) + (statusCounts["OUT_FOR_DELIVERY"] || 0),
        },
        ordersByStatus: ordersByStatus.map(s => ({
          status: s.status,
          count: s._count?.id || 0,
        })),
        ordersByChannel: ordersByChannel.map(c => ({
          channel: c.channel || "UNKNOWN",
          count: c._count?.id || 0,
          revenue: c._sum?.totalAmount || 0,
        })),
        ordersByPaymentMode: ordersByPaymentMode.map(p => ({
          paymentMode: p.paymentMode || "UNKNOWN",
          count: p._count?.id || 0,
          amount: p._sum?.totalAmount || 0,
        })),
        recentOrders,
        period: {
          range,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Sales Dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sales data" },
      { status: 500 }
    );
  }
}
