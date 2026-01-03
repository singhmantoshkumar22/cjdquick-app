import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - Notifications Dashboard Summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7"; // days

    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Parallel queries
    const [
      // Template counts
      activeTemplates,
      // Queue stats
      queuePending,
      queueFailed,
      // Log stats
      totalSent,
      deliveredCount,
      failedCount,
      // Channel breakdown
      channelStats,
      // Recent logs
      recentLogs,
      // Hourly volume (last 24 hours)
      last24Hours,
    ] = await Promise.all([
      // Active templates
      prisma.notificationTemplate.count({
        where: { isActive: true },
      }),

      // Pending in queue
      prisma.notificationQueue.count({
        where: { status: "PENDING" },
      }),

      // Failed in queue
      prisma.notificationQueue.count({
        where: { status: "FAILED" },
      }),

      // Total sent
      prisma.notificationLog.count({
        where: { sentAt: { gte: startDate } },
      }),

      // Delivered
      prisma.notificationLog.count({
        where: {
          sentAt: { gte: startDate },
          status: { in: ["SENT", "DELIVERED", "READ"] },
        },
      }),

      // Failed
      prisma.notificationLog.count({
        where: {
          sentAt: { gte: startDate },
          status: "FAILED",
        },
      }),

      // By channel
      prisma.notificationLog.groupBy({
        by: ["channel"],
        where: { sentAt: { gte: startDate } },
        _count: true,
      }),

      // Recent logs
      prisma.notificationLog.findMany({
        where: { sentAt: { gte: startDate } },
        orderBy: { sentAt: "desc" },
        take: 10,
        select: {
          id: true,
          channel: true,
          templateCode: true,
          recipientPhone: true,
          recipientEmail: true,
          awbNumber: true,
          status: true,
          sentAt: true,
        },
      }),

      // Last 24 hours for hourly breakdown
      prisma.notificationLog.findMany({
        where: {
          sentAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        select: { sentAt: true },
      }),
    ]);

    // Calculate hourly breakdown
    const hourlyVolume: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourlyVolume[i] = 0;
    last24Hours.forEach((log) => {
      const hour = new Date(log.sentAt).getHours();
      hourlyVolume[hour]++;
    });

    // Channel breakdown
    const channels = channelStats.map((c) => ({
      channel: c.channel,
      count: c._count,
    }));

    // Cost estimate (simulated)
    const totalCost = channels.reduce((sum, c) => {
      const rate = c.channel === "SMS" ? 0.25 : c.channel === "WHATSAPP" ? 0.5 : 0;
      return sum + c.count * rate;
    }, 0);

    // Delivery rate
    const deliveryRate = totalSent > 0 ? ((deliveredCount / totalSent) * 100).toFixed(1) : 0;

    return NextResponse.json({
      success: true,
      data: {
        // KPIs
        kpis: {
          activeTemplates,
          queuePending,
          queueFailed,
          totalSent,
          deliveredCount,
          failedCount,
          deliveryRate,
          estimatedCost: totalCost.toFixed(2),
        },

        // Channel breakdown
        channels,

        // Hourly volume
        hourlyVolume: Object.entries(hourlyVolume).map(([hour, count]) => ({
          hour: parseInt(hour),
          count,
        })),

        // Recent logs
        recentLogs,

        // Period
        period: {
          days: daysAgo,
          startDate: startDate.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Notifications Summary Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications summary" },
      { status: 500 }
    );
  }
}
