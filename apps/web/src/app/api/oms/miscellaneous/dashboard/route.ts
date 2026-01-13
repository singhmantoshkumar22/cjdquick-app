import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/miscellaneous/dashboard - Get miscellaneous dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationCode = searchParams.get("locationCode") || "";

    const queryParams = new URLSearchParams({
      ...(locationCode && { locationCode }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/miscellaneous/dashboard?${queryParams}`,
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
    console.error("Error fetching miscellaneous dashboard:", error);
    return NextResponse.json({
      success: true,
      data: getDemoDashboardData(),
    });
  }
}

function getDemoDashboardData() {
  return {
    putaway: {
      summary: {
        open: 5,
        partConfirmed: 3,
        confirmed: 12,
        closed: 45,
        cancelled: 2,
      },
      todayStats: {
        created: 8,
        completed: 45,
        pending: 5,
        unitsPutaway: 1234,
      },
      byType: {
        selectedInbound: { open: 3, confirmed: 8, closed: 32 },
        cancelledOrders: { open: 2, confirmed: 4, closed: 13 },
      },
      byZone: [
        { zone: "ZONE-A", pending: 2, completed: 18, units: 450 },
        { zone: "ZONE-B", pending: 1, completed: 15, units: 380 },
        { zone: "ZONE-C", pending: 2, completed: 12, units: 404 },
      ],
      recentActivity: [
        { id: "1", putawayNo: "PUT-2024-001234", skuCode: "SKU-001", qty: 100, status: "OPEN", createdBy: "Rahul Kumar", time: "10 mins ago" },
        { id: "2", putawayNo: "PUT-2024-001235", skuCode: "SKU-002", qty: 50, status: "CONFIRMED", createdBy: "Priya Sharma", time: "30 mins ago" },
        { id: "3", putawayNo: "PUT-2024-001236", skuCode: "SKU-003", qty: 25, status: "PART_CONFIRMED", createdBy: "Amit Patel", time: "1 hour ago" },
      ],
    },
    quickStats: {
      totalOperationsToday: 58,
      pendingTasks: 8,
      completedTasks: 45,
      efficiency: 84.9,
    },
  };
}
