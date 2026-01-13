import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import { getWMSDashboardStats, getOrdersPendingWMS } from "@/lib/unified-wms-service";

// GET: WMS Dashboard stats and pending orders
export async function GET(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId") || undefined;
    const view = searchParams.get("view") || "stats"; // stats | orders
    const wmsStatus = searchParams.get("wmsStatus") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    if (view === "orders") {
      const orders = await getOrdersPendingWMS(locationId, wmsStatus, page, pageSize);
      return NextResponse.json({
        success: true,
        data: orders,
      });
    }

    // Default: stats view
    const stats = await getWMSDashboardStats(locationId);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        locationId,
      },
    });
  } catch (error) {
    console.error("WMS dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch WMS dashboard" },
      { status: 500 }
    );
  }
}
