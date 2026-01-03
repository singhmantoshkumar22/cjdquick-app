import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - Analytics Dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const period = searchParams.get("period") || "30"; // days
    const clientId = searchParams.get("clientId");
    const hubId = searchParams.get("hubId");

    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const now = new Date();

    // Build filters
    const shipmentFilter: any = {
      bookedAt: { gte: startDate },
    };
    if (clientId) shipmentFilter.clientId = clientId;
    if (hubId) shipmentFilter.originHubId = hubId;

    // Parallel queries
    const [
      // Shipment volume by status
      shipmentsByStatus,
      // Delivery performance
      deliveryStats,
      // Top clients by volume
      clientStats,
      // Hub performance
      hubStats,
      // COD collection
      codStats,
      // NDR count
      ndrStats,
      // RTO count
      rtoStats,
      // Weight stats
      weightStats,
      // Total shipments
      totalCount,
    ] = await Promise.all([
      // Shipments by status
      prisma.shipment.groupBy({
        by: ["status"],
        where: shipmentFilter,
        _count: true,
      }),

      // Delivery stats
      prisma.shipment.count({
        where: {
          ...shipmentFilter,
          status: "DELIVERED",
        },
      }),

      // Top clients by volume
      prisma.shipment.groupBy({
        by: ["clientId"],
        where: shipmentFilter,
        _count: true,
        orderBy: { _count: { clientId: "desc" } },
        take: 10,
      }),

      // Hub performance
      prisma.shipment.groupBy({
        by: ["originHubId"],
        where: {
          ...shipmentFilter,
          originHubId: { not: null },
        },
        _count: true,
        orderBy: { _count: { originHubId: "desc" } },
        take: 10,
      }),

      // COD stats
      prisma.shipment.aggregate({
        where: {
          ...shipmentFilter,
          paymentMode: "COD",
        },
        _count: true,
        _sum: { codAmount: true },
      }),

      // NDR count
      prisma.nDRReport.count({
        where: {
          createdAt: { gte: startDate },
          ...(clientId && { clientId }),
        },
      }),

      // RTO count
      prisma.rTOShipment.count({
        where: {
          createdAt: { gte: startDate },
          ...(clientId && { clientId }),
        },
      }),

      // Weight stats
      prisma.shipment.aggregate({
        where: shipmentFilter,
        _avg: { actualWeightKg: true },
        _sum: { actualWeightKg: true },
      }),

      // Total shipments
      prisma.shipment.count({ where: shipmentFilter }),
    ]);

    // Calculate totals
    const totalShipments = totalCount;
    const deliveredCount = deliveryStats;
    const deliveryRate = totalShipments > 0 ? (deliveredCount / totalShipments) * 100 : 0;
    const ndrRate = totalShipments > 0 ? (ndrStats / totalShipments) * 100 : 0;
    const rtoRate = totalShipments > 0 ? (rtoStats / totalShipments) * 100 : 0;

    // Status breakdown
    const statusMap = new Map(shipmentsByStatus.map((s) => [s.status, s._count]));

    // Get client names
    const clientIds = clientStats.map((c) => c.clientId);
    const clients = clientIds.length > 0
      ? await prisma.client.findMany({
          where: { id: { in: clientIds } },
          select: { id: true, companyName: true },
        })
      : [];
    const clientMap = new Map(clients.map((c) => [c.id, c.companyName]));

    // Get hub names
    const hubIds = hubStats.map((h) => h.originHubId).filter(Boolean);
    const hubs = hubIds.length > 0
      ? await prisma.hub.findMany({
          where: { id: { in: hubIds as string[] } },
          select: { id: true, name: true, code: true },
        })
      : [];
    const hubMap = new Map(hubs.map((h) => [h.id, h]));

    return NextResponse.json({
      success: true,
      data: {
        // Overview KPIs
        overview: {
          totalShipments,
          deliveredCount,
          deliveryRate: deliveryRate.toFixed(1),
          inTransit: statusMap.get("IN_TRANSIT") || 0,
          pending: statusMap.get("PENDING") || 0,
          outForDelivery: statusMap.get("OUT_FOR_DELIVERY") || 0,
        },

        // Performance metrics
        performance: {
          slaCompliance: (100 - ndrRate - rtoRate).toFixed(1),
          slaBreachCount: 0,
          ndrRate: ndrRate.toFixed(1),
          ndrCount: ndrStats,
          rtoRate: rtoRate.toFixed(1),
          rtoCount: rtoStats,
          avgWeight: weightStats._avg.actualWeightKg?.toFixed(2) || 0,
          totalWeight: weightStats._sum.actualWeightKg || 0,
        },

        // COD metrics
        cod: {
          shipmentCount: codStats._count,
          totalAmount: codStats._sum.codAmount || 0,
          percentage: totalShipments > 0 ? ((codStats._count / totalShipments) * 100).toFixed(1) : 0,
        },

        // Status distribution
        statusBreakdown: {
          delivered: statusMap.get("DELIVERED") || 0,
          inTransit: statusMap.get("IN_TRANSIT") || 0,
          inHub: statusMap.get("IN_HUB") || 0,
          outForDelivery: statusMap.get("OUT_FOR_DELIVERY") || 0,
          ndr: statusMap.get("NDR") || 0,
          rto: (statusMap.get("RTO_INITIATED") || 0) + (statusMap.get("RTO_IN_TRANSIT") || 0),
          pending: statusMap.get("PENDING") || 0,
        },

        // Top clients
        topClients: clientStats.map((c) => ({
          clientId: c.clientId,
          clientName: clientMap.get(c.clientId) || "Unknown",
          shipmentCount: c._count,
          percentage: totalShipments > 0 ? ((c._count / totalShipments) * 100).toFixed(1) : 0,
        })),

        // Hub performance
        hubPerformance: hubStats.map((h) => ({
          hubId: h.originHubId,
          hubName: hubMap.get(h.originHubId || "")?.name || "Unknown",
          hubCode: hubMap.get(h.originHubId || "")?.code || "",
          shipmentCount: h._count,
        })),

        // Period
        period: {
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
          days: daysAgo,
        },
      },
    });
  } catch (error) {
    console.error("Analytics GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
