import { NextRequest, NextResponse } from "next/server";
import { omsRequest } from "@/lib/oms-client";

// GET /api/oms/dashboard - Get OMS dashboard stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "eretail";
    const dateRange = searchParams.get("dateRange") || "7";

    // Proxy to OMS backend with internal API key
    const result = await omsRequest(`/api/dashboard?type=${type}&dateRange=${dateRange}`);

    if (!result.success) {
      // Return demo data if OMS backend is not available
      console.log("OMS not available, returning demo dashboard data");
      return NextResponse.json({
        success: true,
        data: getDemoDashboardData(type),
      });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error fetching OMS dashboard:", error);
    // Return demo data on error
    return NextResponse.json({
      success: true,
      data: getDemoDashboardData("eretail"),
    });
  }
}

function getDemoDashboardData(type: string) {
  return {
    stats: {
      totalOrders: 3693,
      totalOrderLines: 8051,
      totalOrderQuantity: 73102,
      distinctSkuSold: 3296,
      avgLinesPerOrder: 2.18,
      totalOrderAmount: 70250074,
      avgOrderAmount: 19022,
      codOrdersPercent: 8.45,
      totalDiscount: 442497,
      orderQtyPendingStock: 1897,
      totalPendingOrder: 815,
      unfulfillableLineLevelOrder: 48,
      totalUnfulfillableOrder: 32,
      totalSlaBreachedOrder: 423,
      totalFailedOrder: 116,
    },
    orderCountData: [
      { date: "Jan 1", value: 450 },
      { date: "Jan 2", value: 520 },
      { date: "Jan 3", value: 610 },
      { date: "Jan 4", value: 590 },
      { date: "Jan 5", value: 680 },
      { date: "Jan 6", value: 720 },
      { date: "Jan 7", value: 480 },
    ],
    orderLineData: [
      { date: "Jan 1", value: 980 },
      { date: "Jan 2", value: 1150 },
      { date: "Jan 3", value: 1420 },
      { date: "Jan 4", value: 1380 },
      { date: "Jan 5", value: 1650 },
      { date: "Jan 6", value: 1840 },
      { date: "Jan 7", value: 1100 },
    ],
  };
}
