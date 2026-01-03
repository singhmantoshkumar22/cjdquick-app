import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - POD Dashboard Summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days
    const clientId = searchParams.get("clientId");

    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Build filter
    const baseFilter: any = {
      capturedAt: { gte: startDate },
    };
    if (clientId) baseFilter.clientId = clientId;

    // Parallel queries
    const [
      totalPods,
      pendingCount,
      verifiedCount,
      disputedCount,
      rejectedCount,
      avgQualityScore,
      topAgents,
      qualityDistribution,
      recentDisputes,
    ] = await Promise.all([
      // Total PODs
      prisma.pODCapture.count({ where: baseFilter }),

      // Pending verification
      prisma.pODCapture.count({
        where: { ...baseFilter, verificationStatus: "PENDING" },
      }),

      // Verified
      prisma.pODCapture.count({
        where: { ...baseFilter, verificationStatus: "VERIFIED" },
      }),

      // Disputed
      prisma.pODCapture.count({
        where: { ...baseFilter, isDisputed: true },
      }),

      // Rejected
      prisma.pODCapture.count({
        where: { ...baseFilter, verificationStatus: "REJECTED" },
      }),

      // Average quality score
      prisma.pODCapture.aggregate({
        where: baseFilter,
        _avg: { qualityScore: true },
      }),

      // Top agents by POD count
      prisma.pODCapture.groupBy({
        by: ["deliveredById", "deliveredByName"],
        where: baseFilter,
        _count: true,
        _avg: { qualityScore: true },
        orderBy: { _count: { deliveredById: "desc" } },
        take: 10,
      }),

      // Quality score distribution
      prisma.pODCapture.findMany({
        where: baseFilter,
        select: { qualityScore: true },
      }),

      // Recent disputes
      prisma.pODCapture.findMany({
        where: { ...baseFilter, isDisputed: true },
        select: {
          id: true,
          awbNumber: true,
          clientId: true,
          disputeReason: true,
          disputeRaisedAt: true,
          verificationStatus: true,
        },
        orderBy: { disputeRaisedAt: "desc" },
        take: 5,
      }),
    ]);

    // Calculate quality distribution buckets
    const qualityBuckets = {
      excellent: 0, // 80-100
      good: 0, // 60-79
      fair: 0, // 40-59
      poor: 0, // 0-39
    };

    qualityDistribution.forEach((pod) => {
      if (pod.qualityScore >= 80) qualityBuckets.excellent++;
      else if (pod.qualityScore >= 60) qualityBuckets.good++;
      else if (pod.qualityScore >= 40) qualityBuckets.fair++;
      else qualityBuckets.poor++;
    });

    // Get capture methods breakdown
    const captureMethodsRaw = await prisma.pODCapture.groupBy({
      by: ["captureMethod"],
      where: baseFilter,
      _count: true,
    });
    const captureMethods = captureMethodsRaw.map((m) => ({
      method: m.captureMethod,
      count: m._count,
    }));

    // OTP verification rate
    const otpVerifiedCount = await prisma.pODCapture.count({
      where: { ...baseFilter, otpVerified: true },
    });
    const otpVerificationRate = totalPods > 0 ? (otpVerifiedCount / totalPods) * 100 : 0;

    // GPS capture rate
    const gpsCount = await prisma.pODCapture.count({
      where: {
        ...baseFilter,
        deliveryLatitude: { not: null },
        deliveryLongitude: { not: null },
      },
    });
    const gpsCaptureRate = totalPods > 0 ? (gpsCount / totalPods) * 100 : 0;

    // Get client names for disputes
    const disputeClientIds = [...new Set(recentDisputes.map((d) => d.clientId))];
    const clients = await prisma.client.findMany({
      where: { id: { in: disputeClientIds } },
      select: { id: true, companyName: true },
    });
    const clientMap = new Map(clients.map((c) => [c.id, c.companyName]));

    return NextResponse.json({
      success: true,
      data: {
        // KPIs
        kpis: {
          totalPods,
          pendingCount,
          verifiedCount,
          disputedCount,
          rejectedCount,
          avgQualityScore: avgQualityScore._avg.qualityScore?.toFixed(1) || 0,
          verificationRate: totalPods > 0
            ? ((verifiedCount / totalPods) * 100).toFixed(1)
            : 0,
          disputeRate: totalPods > 0
            ? ((disputedCount / totalPods) * 100).toFixed(1)
            : 0,
        },

        // Quality metrics
        quality: {
          distribution: qualityBuckets,
          otpVerificationRate: otpVerificationRate.toFixed(1),
          gpsCaptureRate: gpsCaptureRate.toFixed(1),
        },

        // Capture methods
        captureMethods,

        // Top agents
        topAgents: topAgents.map((a) => ({
          agentId: a.deliveredById,
          agentName: a.deliveredByName,
          podCount: a._count,
          avgQuality: a._avg.qualityScore?.toFixed(1) || 0,
        })),

        // Recent disputes
        recentDisputes: recentDisputes.map((d) => ({
          ...d,
          clientName: clientMap.get(d.clientId) || "Unknown",
        })),

        // Period info
        period: {
          days: daysAgo,
          startDate: startDate.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("POD Summary Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch POD summary" },
      { status: 500 }
    );
  }
}
