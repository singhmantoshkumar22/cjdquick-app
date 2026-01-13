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
        error: "Returns dashboard is only available for brands with Fulfillment service model",
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

    // Get returns stats - using UnifiedReturn model (filter through order relation)
    const [
      totalReturns,
      returnsByStatus,
      returnsByType,
      recentReturns,
      totalOrders,
    ] = await Promise.all([
      // Total returns in period
      prisma.unifiedReturn.count({
        where: {
          order: { brandId },
          createdAt: { gte: startDate },
        },
      }).catch(() => 0),
      // Returns by status
      prisma.unifiedReturn.groupBy({
        by: ["status"],
        where: {
          order: { brandId },
          createdAt: { gte: startDate },
        },
        _count: {
          id: true,
        },
      }).catch(() => []),
      // Returns by type (RTO, Customer Return, etc.)
      prisma.unifiedReturn.groupBy({
        by: ["type"],
        where: {
          order: { brandId },
          createdAt: { gte: startDate },
        },
        _count: {
          id: true,
        },
      }).catch(() => []),
      // Recent returns
      prisma.unifiedReturn.findMany({
        where: {
          order: { brandId },
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          returnNumber: true,
          type: true,
          status: true,
          reason: true,
          createdAt: true,
          order: {
            select: {
              orderNumber: true,
              customerName: true,
            },
          },
        },
      }).catch(() => []),
      // Total orders for return rate calculation
      prisma.unifiedOrder.count({
        where: {
          brandId,
          status: "DELIVERED",
          deliveredAt: { gte: startDate },
        },
      }),
    ]);

    // Calculate return rate
    const returnRate = totalOrders > 0
      ? Math.round((totalReturns / totalOrders) * 100 * 10) / 10
      : 0;

    // Map status counts
    const statusCounts = (returnsByStatus as Array<{ status: string; _count: { id: number } }>).reduce((acc, s) => {
      acc[s.status] = s._count?.id || 0;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalReturns,
          returnRate,
          pendingReturns: (statusCounts["INITIATED"] || 0) + (statusCounts["IN_TRANSIT"] || 0),
          receivedReturns: statusCounts["RECEIVED"] || 0,
          processedReturns: (statusCounts["QC_PASSED"] || 0) + (statusCounts["RESTOCKED"] || 0) + (statusCounts["COMPLETED"] || 0),
        },
        returnsByStatus: (returnsByStatus as Array<{ status: string; _count: { id: number } }>).map(s => ({
          status: s.status,
          count: s._count?.id || 0,
        })),
        returnsByType: (returnsByType as Array<{ type: string; _count: { id: number } }>).map(t => ({
          type: t.type,
          count: t._count?.id || 0,
        })),
        recentReturns,
        period: {
          range,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Returns Dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch returns data" },
      { status: 500 }
    );
  }
}
