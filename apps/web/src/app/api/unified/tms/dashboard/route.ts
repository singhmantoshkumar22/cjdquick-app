import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import { getTMSDashboardStats, getOrdersInTransit } from "@/lib/unified-tms-service";

// GET: TMS Dashboard stats
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
    const transporterId = searchParams.get("transporterId") || undefined;
    const view = searchParams.get("view") || "stats"; // stats | orders
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    if (view === "orders") {
      const orders = await getOrdersInTransit({
        locationId,
        transporterId,
        status,
        page,
        pageSize,
      });

      return NextResponse.json({
        success: true,
        data: orders,
      });
    }

    // Default: stats view
    const stats = await getTMSDashboardStats(locationId, transporterId);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        locationId,
        transporterId,
      },
    });
  } catch (error) {
    console.error("TMS dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch TMS dashboard" },
      { status: 500 }
    );
  }
}
