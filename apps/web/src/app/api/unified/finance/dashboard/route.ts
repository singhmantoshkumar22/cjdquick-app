import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import {
  getFinanceDashboardStats,
  getRevenueByTransporter,
} from "@/lib/unified-finance-service";

// GET: Finance Dashboard stats
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
    const brandId = searchParams.get("brandId") || undefined;
    const view = searchParams.get("view") || "stats"; // stats | revenue

    if (view === "revenue") {
      const fromDate = searchParams.get("fromDate");
      const toDate = searchParams.get("toDate");

      if (!fromDate || !toDate) {
        return NextResponse.json(
          { success: false, error: "fromDate and toDate are required for revenue view" },
          { status: 400 }
        );
      }

      const revenue = await getRevenueByTransporter(
        new Date(fromDate),
        new Date(toDate),
        brandId
      );

      return NextResponse.json({
        success: true,
        data: revenue,
      });
    }

    // Default: stats view
    const stats = await getFinanceDashboardStats(brandId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Finance dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch finance dashboard" },
      { status: 500 }
    );
  }
}
