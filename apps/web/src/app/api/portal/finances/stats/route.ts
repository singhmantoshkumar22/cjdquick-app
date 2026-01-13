import { NextRequest, NextResponse } from "next/server";
import { getPortalUserFromRequest } from "@/lib/portal-auth";
import { getFinanceDashboardStats, getClaimsDashboardStats } from "@/lib/unified-finance-service";
import { prisma } from "@cjdquick/database";

export async function GET(request: NextRequest) {
  try {
    const user = await getPortalUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get finance stats
    const financeStats = await getFinanceDashboardStats(user.brandId);
    const claimsStats = await getClaimsDashboardStats(user.brandId);

    // Get recent transactions
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get recent remittances
    const recentRemittances = await prisma.cODRemittance.findMany({
      where: {
        clientId: user.brandId,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    // Get recent invoices
    const recentInvoices = await prisma.invoiceNew.findMany({
      where: {
        brandId: user.brandId,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    // Build recent transactions list
    const transactions = [
      ...recentRemittances.map((r) => ({
        type: "COD Remittance",
        amount: r.netRemittance,
        date: r.paidAt || r.createdAt,
        status: r.status === "PAID" ? "Credited" : "Pending",
      })),
      ...recentInvoices.map((i) => ({
        type: "Invoice Payment",
        amount: -i.totalAmount,
        date: i.invoiceDate || i.createdAt,
        status: i.status === "PAID" ? "Paid" : "Due",
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          codCollected30d: financeStats.cod.collectedAmount,
          codPending: financeStats.cod.pendingAmount,
          outstandingInvoices: financeStats.invoices.pendingAmount,
          pendingInvoiceCount: financeStats.invoices.pendingCount,
          claimsUnderReview: claimsStats.underReview.amount,
          claimsCount: claimsStats.underReview.count,
        },
        remittances: financeStats.remittances,
        invoices: financeStats.invoices,
        cod: financeStats.cod,
        claims: claimsStats,
        recentTransactions: transactions,
      },
    });
  } catch (error) {
    console.error("Finance stats error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
