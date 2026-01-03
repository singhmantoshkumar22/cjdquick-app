import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - Comprehensive analytics overview
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const hubId = searchParams.get("hubId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const period = searchParams.get("period") || "last_30_days";

    // Calculate date range
    let startDate: Date;
    let endDate = new Date();

    switch (period) {
      case "today":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case "yesterday":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "last_7_days":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "last_30_days":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "last_90_days":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "this_month":
        startDate = new Date();
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "last_month":
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(1);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        break;
      case "custom":
        startDate = dateFrom ? new Date(dateFrom) : new Date();
        endDate = dateTo ? new Date(dateTo) : new Date();
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
    }

    // Build shipment filter
    const shipmentWhere: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (clientId) shipmentWhere.clientId = clientId;
    if (hubId) {
      shipmentWhere.OR = [
        { currentHubId: hubId },
        { originHubId: hubId },
        { destinationHubId: hubId },
      ];
    }

    // Get shipment counts by status
    const [
      totalShipments,
      deliveredShipments,
      inTransitShipments,
      pendingShipments,
      rtoShipments,
      ndrShipments,
    ] = await Promise.all([
      prisma.shipment.count({ where: shipmentWhere }),
      prisma.shipment.count({ where: { ...shipmentWhere, status: "DELIVERED" } }),
      prisma.shipment.count({ where: { ...shipmentWhere, status: "IN_TRANSIT" } }),
      prisma.shipment.count({
        where: { ...shipmentWhere, status: { in: ["PENDING", "BOOKED", "MANIFESTED"] } },
      }),
      prisma.shipment.count({ where: { ...shipmentWhere, status: "RTO" } }),
      prisma.shipment.count({
        where: { ...shipmentWhere, status: { in: ["NDR", "UNDELIVERED"] } },
      }),
    ]);

    // Get revenue metrics
    const revenueAgg = await prisma.shipment.aggregate({
      where: shipmentWhere,
      _sum: {
        codAmount: true,
        declaredValue: true,
        chargeableWeightKg: true,
      },
      _avg: {
        chargeableWeightKg: true,
      },
    });

    // Get COD metrics
    const codShipments = await prisma.shipment.aggregate({
      where: { ...shipmentWhere, paymentMode: "COD" },
      _count: true,
      _sum: { codAmount: true },
    });

    const codCollectedAgg = await prisma.cODCollection.aggregate({
      where: {
        collectionTime: { gte: startDate, lte: endDate },
      },
      _sum: { expectedAmount: true, collectedAmount: true },
    });

    // Get performance metrics - delivered shipments
    const deliveredShipmentsData = await prisma.shipment.findMany({
      where: { ...shipmentWhere, status: "DELIVERED", actualDeliveryDate: { not: null } },
      select: {
        createdAt: true,
        actualDeliveryDate: true,
        expectedDeliveryDate: true,
        deliveryAttempts: true,
      },
    });

    // Calculate performance metrics
    let onTimeDeliveries = 0;
    let firstAttemptDeliveries = 0;
    let totalDeliveryDays = 0;

    deliveredShipmentsData.forEach((shipment) => {
      if (shipment.actualDeliveryDate && shipment.expectedDeliveryDate) {
        if (shipment.actualDeliveryDate <= shipment.expectedDeliveryDate) {
          onTimeDeliveries++;
        }
      }
      if (shipment.deliveryAttempts === 1) {
        firstAttemptDeliveries++;
      }
      if (shipment.actualDeliveryDate) {
        const days = Math.ceil(
          (shipment.actualDeliveryDate.getTime() - shipment.createdAt.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        totalDeliveryDays += days;
      }
    });

    const deliveredCount = deliveredShipmentsData.length;
    const onTimeRate = deliveredCount > 0 ? (onTimeDeliveries / deliveredCount) * 100 : 0;
    const firstAttemptRate = deliveredCount > 0 ? (firstAttemptDeliveries / deliveredCount) * 100 : 0;
    const avgDeliveryDays = deliveredCount > 0 ? totalDeliveryDays / deliveredCount : 0;
    const rtoRate = totalShipments > 0 ? (rtoShipments / totalShipments) * 100 : 0;
    const ndrRate = totalShipments > 0 ? (ndrShipments / totalShipments) * 100 : 0;

    // Get daily trend data
    const dailyTrend = await getDailyTrend(startDate, endDate, clientId, hubId);

    // Get top performing hubs
    const topHubs = await prisma.shipment.groupBy({
      by: ["currentHubId"],
      where: { ...shipmentWhere, currentHubId: { not: null } },
      _count: true,
      orderBy: { _count: { currentHubId: "desc" } },
      take: 5,
    });

    // Get hub details
    const hubIds = topHubs.map((h) => h.currentHubId).filter(Boolean) as string[];
    const hubs = await prisma.hub.findMany({
      where: { id: { in: hubIds } },
      select: { id: true, name: true, code: true },
    });

    const topHubsWithDetails = topHubs.map((h) => ({
      ...h,
      hub: hubs.find((hub) => hub.id === h.currentHubId),
    }));

    // Get top lanes (origin-destination pairs)
    const topLanes = await prisma.shipment.groupBy({
      by: ["shipperCity", "consigneeCity"],
      where: shipmentWhere,
      _count: true,
      orderBy: { _count: { shipperCity: "desc" } },
      take: 10,
    });

    // Compare with previous period
    const prevStartDate = new Date(startDate);
    const periodLength = endDate.getTime() - startDate.getTime();
    prevStartDate.setTime(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate);

    const prevTotalShipments = await prisma.shipment.count({
      where: {
        ...shipmentWhere,
        createdAt: { gte: prevStartDate, lte: prevEndDate },
      },
    });

    const prevDeliveredShipments = await prisma.shipment.count({
      where: {
        ...shipmentWhere,
        createdAt: { gte: prevStartDate, lte: prevEndDate },
        status: "DELIVERED",
      },
    });

    const shipmentGrowth =
      prevTotalShipments > 0
        ? ((totalShipments - prevTotalShipments) / prevTotalShipments) * 100
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        period: {
          type: period,
          startDate,
          endDate,
        },
        volume: {
          total: totalShipments,
          delivered: deliveredShipments,
          inTransit: inTransitShipments,
          pending: pendingShipments,
          rto: rtoShipments,
          ndr: ndrShipments,
          deliveryRate: totalShipments > 0 ? (deliveredShipments / totalShipments) * 100 : 0,
        },
        revenue: {
          totalFreight: 0, // Freight charges calculated separately in billing
          avgFreight: 0,
          totalDeclaredValue: revenueAgg._sum?.declaredValue || 0,
          totalWeight: revenueAgg._sum?.chargeableWeightKg || 0,
          avgWeight: revenueAgg._avg?.chargeableWeightKg || 0,
        },
        cod: {
          totalShipments: codShipments._count,
          totalAmount: codShipments._sum?.codAmount || 0,
          collected: codCollectedAgg._sum?.collectedAmount || 0,
          pending: (codShipments._sum?.codAmount || 0) - (codCollectedAgg._sum?.collectedAmount || 0),
        },
        performance: {
          onTimeDeliveryRate: Math.round(onTimeRate * 10) / 10,
          firstAttemptRate: Math.round(firstAttemptRate * 10) / 10,
          avgDeliveryDays: Math.round(avgDeliveryDays * 10) / 10,
          rtoRate: Math.round(rtoRate * 10) / 10,
          ndrRate: Math.round(ndrRate * 10) / 10,
        },
        comparison: {
          previousPeriod: {
            shipments: prevTotalShipments,
            delivered: prevDeliveredShipments,
          },
          growth: {
            shipments: Math.round(shipmentGrowth * 10) / 10,
          },
        },
        trends: {
          daily: dailyTrend,
        },
        topHubs: topHubsWithDetails,
        topLanes,
      },
    });
  } catch (error) {
    console.error("Analytics Overview Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

async function getDailyTrend(
  startDate: Date,
  endDate: Date,
  clientId?: string | null,
  hubId?: string | null
) {
  const days: any[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayStart = new Date(current);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(current);
    dayEnd.setHours(23, 59, 59, 999);

    const where: any = {
      createdAt: { gte: dayStart, lte: dayEnd },
    };
    if (clientId) where.clientId = clientId;

    const [created, delivered] = await Promise.all([
      prisma.shipment.count({ where }),
      prisma.shipment.count({ where: { ...where, status: "DELIVERED" } }),
    ]);

    days.push({
      date: dayStart.toISOString().split("T")[0],
      created,
      delivered,
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
}
