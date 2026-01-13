import { NextRequest, NextResponse } from "next/server";
import { getPortalUserFromRequest } from "@/lib/portal-auth";
import { listRemittances, getFinanceDashboardStats } from "@/lib/unified-finance-service";

export async function GET(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status") || undefined;

    // Get remittances for this brand
    const result = await listRemittances({
      brandId: user.brandId,
      status,
      page,
      pageSize,
    });

    // Get stats for the summary cards
    const stats = await getFinanceDashboardStats(user.brandId);

    // Transform to expected format
    const remittances = result.items.map((item) => ({
      id: item.id,
      remittanceNumber: item.remittanceNumber,
      amount: item.netRemittance,
      orderCount: item.shipmentCount,
      cycleStart: item.periodStart.toISOString(),
      cycleEnd: item.periodEnd.toISOString(),
      status: item.status,
      paidAt: item.paidAt?.toISOString() || null,
      createdAt: item.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        remittances,
        total: result.pagination.total,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalPages: result.pagination.totalPages,
        stats: {
          totalRemitted30d: stats.remittances.paidThisMonth,
          pendingSettlement: stats.remittances.pendingAmount,
          settlementsCount: stats.remittances.pendingCount,
        },
      },
    });
  } catch (error) {
    console.error("Remittances error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch remittances" }, { status: 500 });
  }
}
