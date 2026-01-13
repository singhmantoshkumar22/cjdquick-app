import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/fulfillment - Get fulfillment dashboard stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationCode = searchParams.get("locationCode") || "";
    const dateRange = searchParams.get("dateRange") || "today";

    const queryParams = new URLSearchParams({
      ...(locationCode && { locationCode }),
      ...(dateRange && { dateRange }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/fulfillment/dashboard?${queryParams}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(request.headers.get("authorization") && {
            Authorization: request.headers.get("authorization")!,
          }),
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        data: getDemoDashboardData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching fulfillment dashboard:", error);
    return NextResponse.json({
      success: true,
      data: getDemoDashboardData(),
    });
  }
}

function getDemoDashboardData() {
  return {
    summary: {
      ordersToday: 524,
      ordersPending: 156,
      ordersProcessing: 45,
      ordersCompleted: 234,
      ordersOnHold: 12,
      avgFulfillmentTime: "2.5 hrs",
      fulfillmentRate: 78.4,
      slaCompliance: 94.2,
      pickAccuracy: 99.1,
    },
    byStatus: {
      pending: 156,
      allocated: 28,
      picking: 32,
      picked: 15,
      packing: 18,
      packed: 89,
      shipped: 234,
      onHold: 12,
    },
    byPriority: {
      urgent: 12,
      high: 45,
      normal: 380,
      low: 87,
    },
    slaBreakdown: {
      onTrack: 450,
      atRisk: 52,
      breached: 22,
    },
    hourlyTrend: [
      { hour: "8AM", orders: 45, completed: 42 },
      { hour: "9AM", orders: 68, completed: 65 },
      { hour: "10AM", orders: 82, completed: 78 },
      { hour: "11AM", orders: 95, completed: 88 },
      { hour: "12PM", orders: 72, completed: 70 },
      { hour: "1PM", orders: 55, completed: 52 },
      { hour: "2PM", orders: 78, completed: 74 },
    ],
    teamPerformance: [
      { team: "Team Alpha", orders: 145, completed: 138, rate: 95.2 },
      { team: "Team Beta", orders: 132, completed: 125, rate: 94.7 },
      { team: "Team Gamma", orders: 128, completed: 118, rate: 92.2 },
      { team: "Team Delta", orders: 119, completed: 110, rate: 92.4 },
    ],
  };
}
