import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/reports - Get report summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get("dateRange") || "last7days";

    const queryParams = new URLSearchParams({ dateRange });

    const response = await fetch(
      `${OMS_BASE_URL}/api/reports/summary?${queryParams}`,
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
        data: getDemoSummary(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching report summary:", error);
    return NextResponse.json({
      success: true,
      data: getDemoSummary(),
    });
  }
}

function getDemoSummary() {
  return {
    totalOrders: 5842,
    totalRevenue: 4856000,
    avgOrderValue: 831,
    fulfillmentRate: 94.2,
    returnRate: 4.8,
    topChannel: "Amazon",
  };
}
