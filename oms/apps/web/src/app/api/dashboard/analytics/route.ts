import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyticsService } from "@/lib/services/analytics-service";

// GET /api/dashboard/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") || undefined;
    const locationId = searchParams.get("locationId") || undefined;
    const days = parseInt(searchParams.get("days") || "30");

    // Get all analytics data in parallel
    const [metrics, trends, slaMetrics] = await Promise.all([
      analyticsService.getDashboardMetrics(companyId, locationId),
      analyticsService.getOrderTrends(days, companyId),
      analyticsService.getSLAMetrics(companyId),
    ]);

    return NextResponse.json({
      metrics,
      trends,
      slaMetrics,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
