import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/reports/dashboard - Get comprehensive dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get("dateRange") || "last7days";

    const queryParams = new URLSearchParams({ dateRange });

    const response = await fetch(
      `${OMS_BASE_URL}/api/reports/dashboard?${queryParams}`,
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
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoDashboardData(),
    });
  }
}

function getDemoDashboardData() {
  return {
    kpis: {
      totalRevenue: 4856000,
      totalOrders: 5842,
      avgOrderValue: 831,
      totalCustomers: 3256,
      newCustomers: 412,
      repeatRate: 42.5,
    },
    revenueByChannel: [
      { channel: "Amazon", revenue: 2185200, orders: 2628 },
      { channel: "Flipkart", revenue: 1456800, orders: 1753 },
      { channel: "Shopify", revenue: 728400, orders: 876 },
      { channel: "Manual", revenue: 485600, orders: 585 },
    ],
    ordersByStatus: [
      { status: "Completed", count: 5234 },
      { status: "Processing", count: 324 },
      { status: "Pending", count: 156 },
      { status: "On Hold", count: 78 },
      { status: "Cancelled", count: 50 },
    ],
    topProducts: [
      { sku: "SKU-001", name: "Wireless Mouse - Black", quantity: 456, revenue: 182400 },
      { sku: "SKU-015", name: "USB-C Hub 7-in-1", quantity: 324, revenue: 194400 },
      { sku: "SKU-023", name: "Bluetooth Speaker", quantity: 289, revenue: 144500 },
      { sku: "SKU-042", name: "Phone Stand Adjustable", quantity: 267, revenue: 53400 },
      { sku: "SKU-056", name: "Laptop Sleeve 15 inch", quantity: 234, revenue: 70200 },
    ],
    dailyTrend: [
      { date: "Jan 2", orders: 812, revenue: 675180 },
      { date: "Jan 3", orders: 845, revenue: 702495 },
      { date: "Jan 4", orders: 798, revenue: 663538 },
      { date: "Jan 5", orders: 867, revenue: 720477 },
      { date: "Jan 6", orders: 834, revenue: 693054 },
      { date: "Jan 7", orders: 891, revenue: 740421 },
      { date: "Jan 8", orders: 795, revenue: 660835 },
    ],
  };
}
