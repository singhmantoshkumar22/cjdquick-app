import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - NDR Dashboard Summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const clientId = searchParams.get("clientId");

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Aging thresholds
    const h24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const h48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const h72Ago = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    // Build base filter
    const baseFilter: any = {
      isResolved: false,
    };
    if (clientId) baseFilter.clientId = clientId;

    // Parallel queries for dashboard
    const [
      statusCounts,
      priorityCounts,
      reasonCounts,
      todayNDRs,
      // Aging buckets
      age0to24,
      age24to48,
      age48to72,
      age72plus,
      recentNDRs,
      rtoStats,
      resolutionStats,
    ] = await Promise.all([
      // Status counts
      prisma.nDRReport.groupBy({
        by: ["status"],
        where: baseFilter,
        _count: true,
      }),

      // Priority counts
      prisma.nDRReport.groupBy({
        by: ["priority"],
        where: baseFilter,
        _count: true,
      }),

      // Failure reason counts
      prisma.nDRReport.groupBy({
        by: ["failureReason"],
        where: baseFilter,
        _count: true,
        orderBy: {
          _count: {
            failureReason: "desc",
          },
        },
        take: 10,
      }),

      // Today's NDRs
      prisma.nDRReport.count({
        where: {
          attemptDate: { gte: today },
        },
      }),

      // Aging: 0-24h
      prisma.nDRReport.count({
        where: {
          ...baseFilter,
          attemptDate: { gte: h24Ago },
        },
      }),

      // Aging: 24-48h
      prisma.nDRReport.count({
        where: {
          ...baseFilter,
          attemptDate: { gte: h48Ago, lt: h24Ago },
        },
      }),

      // Aging: 48-72h
      prisma.nDRReport.count({
        where: {
          ...baseFilter,
          attemptDate: { gte: h72Ago, lt: h48Ago },
        },
      }),

      // Aging: 72h+
      prisma.nDRReport.count({
        where: {
          ...baseFilter,
          attemptDate: { lt: h72Ago },
        },
      }),

      // Recent NDRs requiring immediate action
      prisma.nDRReport.findMany({
        where: {
          isResolved: false,
          priority: { in: ["HIGH", "CRITICAL"] },
        },
        orderBy: [{ priority: "asc" }, { attemptDate: "asc" }],
        take: 10,
      }),

      // RTO stats
      prisma.rTOShipment.groupBy({
        by: ["currentStatus"],
        _count: true,
      }),

      // Resolution stats (last 7 days)
      prisma.nDRReport.aggregate({
        where: {
          resolvedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        _count: true,
      }),
    ]);

    // Process status counts
    const statusMap = new Map(statusCounts.map((s) => [s.status, s._count]));
    const priorityMap = new Map(priorityCounts.map((p) => [p.priority, p._count]));

    // Calculate total open NDRs
    const totalOpenNDRs = statusCounts.reduce((sum, s) => sum + s._count, 0);

    // Calculate customer not contacted count
    const notContactedCount = await prisma.nDRReport.count({
      where: {
        ...baseFilter,
        customerContacted: false,
      },
    });

    // Get shipment details for recent NDRs
    const shipmentIds = recentNDRs.map((n) => n.shipmentId);
    const shipments = shipmentIds.length > 0
      ? await prisma.shipment.findMany({
          where: { id: { in: shipmentIds } },
          select: {
            id: true,
            consigneeName: true,
            consigneePhone: true,
            consigneeCity: true,
            clientId: true,
            paymentMode: true,
            codAmount: true,
          },
        })
      : [];
    const shipmentMap = new Map(shipments.map((s) => [s.id, s]));

    // Enrich recent NDRs with shipment data
    const enrichedNDRs = recentNDRs.map((ndr) => ({
      ...ndr,
      shipment: shipmentMap.get(ndr.shipmentId) || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        // KPIs
        kpis: {
          totalOpenNDRs,
          todayNDRs,
          criticalCount: priorityMap.get("CRITICAL") || 0,
          highPriorityCount: priorityMap.get("HIGH") || 0,
          notContactedCount,
          resolvedLast7Days: resolutionStats._count,
        },

        // Status breakdown
        statusBreakdown: {
          open: statusMap.get("OPEN") || 0,
          customerContacted: statusMap.get("CUSTOMER_CONTACTED") || 0,
          actionTaken: statusMap.get("ACTION_TAKEN") || 0,
          reattemptScheduled: statusMap.get("REATTEMPT_SCHEDULED") || 0,
          rtoInitiated: statusMap.get("RTO_INITIATED") || 0,
        },

        // Priority breakdown
        priorityBreakdown: {
          critical: priorityMap.get("CRITICAL") || 0,
          high: priorityMap.get("HIGH") || 0,
          medium: priorityMap.get("MEDIUM") || 0,
          low: priorityMap.get("LOW") || 0,
        },

        // Failure reasons
        failureReasons: reasonCounts.map((r) => ({
          reason: r.failureReason,
          count: r._count,
        })),

        // Aging
        aging: [
          { age_bucket: "0-24h", count: age0to24 },
          { age_bucket: "24-48h", count: age24to48 },
          { age_bucket: "48-72h", count: age48to72 },
          { age_bucket: "72h+", count: age72plus },
        ],

        // RTO stats
        rtoStats: {
          initiated: (rtoStats.find((r) => r.currentStatus === "INITIATED")?._count) || 0,
          inTransit: (rtoStats.find((r) => r.currentStatus === "IN_TRANSIT")?._count) || 0,
          delivered: (rtoStats.find((r) => r.currentStatus === "DELIVERED_TO_CLIENT")?._count) || 0,
        },

        // Recent critical NDRs
        recentNDRs: enrichedNDRs,
      },
    });
  } catch (error) {
    console.error("NDR Summary GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch NDR summary" },
      { status: 500 }
    );
  }
}
