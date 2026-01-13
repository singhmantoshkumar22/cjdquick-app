import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/reports/sales - Get sales report data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get("dateRange") || "last7days";
    const channel = searchParams.get("channel") || "all";

    const queryParams = new URLSearchParams({
      dateRange,
      ...(channel !== "all" && { channel }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/reports/sales?${queryParams}`,
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
        data: getDemoSalesData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching sales data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoSalesData(),
    });
  }
}

function getDemoSalesData() {
  return {
    summary: {
      totalRevenue: 4856000,
      totalOrders: 5842,
      avgOrderValue: 831,
      totalUnits: 12456,
      grossMargin: 32.5,
      discountGiven: 252512,
    },
    byChannel: [
      { channel: "Amazon", revenue: 2185200, orders: 2628, aov: 831, growth: 12.5 },
      { channel: "Flipkart", revenue: 1456800, orders: 1753, aov: 831, growth: 8.2 },
      { channel: "Shopify", revenue: 728400, orders: 876, aov: 831, growth: 15.3 },
      { channel: "Manual", revenue: 485600, orders: 585, aov: 830, growth: -2.1 },
    ],
    byPaymentMode: [
      { mode: "Prepaid (Card/UPI)", amount: 3399200, percentage: 70 },
      { mode: "COD", amount: 1213000, percentage: 25 },
      { mode: "Wallet", amount: 243800, percentage: 5 },
    ],
    byLocation: [
      { location: "WH-DELHI", revenue: 1942400, orders: 2337 },
      { location: "WH-MUMBAI", revenue: 1456800, orders: 1753 },
      { location: "WH-BANGALORE", revenue: 971200, orders: 1168 },
      { location: "WH-CHENNAI", revenue: 485600, orders: 584 },
    ],
    dailyData: [
      { date: "Jan 2", revenue: 675180, orders: 812 },
      { date: "Jan 3", revenue: 702495, orders: 845 },
      { date: "Jan 4", revenue: 663538, orders: 798 },
      { date: "Jan 5", revenue: 720477, orders: 867 },
      { date: "Jan 6", revenue: 693054, orders: 834 },
      { date: "Jan 7", revenue: 740421, orders: 891 },
      { date: "Jan 8", revenue: 660835, orders: 795 },
    ],
  };
}
