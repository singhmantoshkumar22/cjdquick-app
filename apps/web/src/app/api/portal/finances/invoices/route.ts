import { NextRequest, NextResponse } from "next/server";
import { getPortalUserFromRequest } from "@/lib/portal-auth";
import { listInvoices, getFinanceDashboardStats } from "@/lib/unified-finance-service";

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

    // Get invoices for this brand
    const result = await listInvoices({
      brandId: user.brandId,
      status,
      page,
      pageSize,
    });

    // Get stats for the summary cards
    const stats = await getFinanceDashboardStats(user.brandId);

    // Transform to expected format
    const invoices = result.items.map((item) => ({
      id: item.id,
      invoiceNumber: item.invoiceNumber,
      amount: item.totalAmount,
      dueDate: item.dueDate?.toISOString() || new Date().toISOString(),
      status: item.status,
      paidAt: item.status === "PAID" ? item.updatedAt?.toISOString() : null,
      createdAt: item.createdAt?.toISOString() || new Date().toISOString(),
      periodStart: item.periodStart?.toISOString(),
      periodEnd: item.periodEnd?.toISOString(),
      totalShipments: item.totalShipments,
      freightCharges: item.freightCharges,
      codCharges: item.codCharges,
      taxAmount: item.taxAmount,
    }));

    return NextResponse.json({
      success: true,
      data: {
        invoices,
        total: result.pagination.total,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalPages: result.pagination.totalPages,
        stats: {
          outstanding: stats.invoices.pendingAmount,
          dueThisWeek: stats.invoices.pendingCount,
          paid30d: stats.invoices.thisMonthBilled,
        },
      },
    });
  } catch (error) {
    console.error("Invoices error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch invoices" }, { status: 500 });
  }
}
