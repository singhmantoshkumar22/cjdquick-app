import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - Billing Dashboard Summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const clientId = searchParams.get("clientId");

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const baseFilter: any = {};
    if (clientId) baseFilter.clientId = clientId;

    // Parallel queries
    const [
      // Total outstanding
      outstandingStats,
      // Overdue invoices
      overdueStats,
      // This month billing
      thisMonthStats,
      // Last month billing
      lastMonthStats,
      // This month collections
      thisMonthPayments,
      // Recent invoices
      recentInvoices,
      // Top clients by outstanding
      topClientsOutstanding,
      // Aging buckets
      aging0to30,
      aging31to60,
      aging61to90,
      aging90plus,
    ] = await Promise.all([
      // Total outstanding
      prisma.invoice.aggregate({
        where: {
          ...baseFilter,
          status: { in: ["PENDING", "SENT", "PARTIALLY_PAID", "OVERDUE"] },
        },
        _sum: { balanceDue: true },
        _count: true,
      }),

      // Overdue stats
      prisma.invoice.aggregate({
        where: {
          ...baseFilter,
          status: { in: ["PENDING", "SENT", "PARTIALLY_PAID"] },
          dueDate: { lt: now },
        },
        _sum: { balanceDue: true },
        _count: true,
      }),

      // This month invoiced
      prisma.invoice.aggregate({
        where: {
          ...baseFilter,
          invoiceDate: { gte: thisMonth },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Last month invoiced
      prisma.invoice.aggregate({
        where: {
          ...baseFilter,
          invoiceDate: { gte: lastMonth, lte: lastMonthEnd },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // This month payments
      prisma.payment.aggregate({
        where: {
          ...(clientId && { clientId }),
          paymentDate: { gte: thisMonth },
          status: "CONFIRMED",
        },
        _sum: { amount: true },
        _count: true,
      }),

      // Recent invoices
      prisma.invoice.findMany({
        where: baseFilter,
        select: {
          id: true,
          invoiceNumber: true,
          clientName: true,
          invoiceDate: true,
          dueDate: true,
          totalAmount: true,
          balanceDue: true,
          status: true,
        },
        orderBy: { invoiceDate: "desc" },
        take: 10,
      }),

      // Top clients by outstanding
      prisma.invoice.groupBy({
        by: ["clientId", "clientName"],
        where: {
          status: { in: ["PENDING", "SENT", "PARTIALLY_PAID", "OVERDUE"] },
        },
        _sum: { balanceDue: true },
        orderBy: { _sum: { balanceDue: "desc" } },
        take: 5,
      }),

      // Aging: 0-30 days
      prisma.invoice.aggregate({
        where: {
          ...baseFilter,
          status: { in: ["PENDING", "SENT", "PARTIALLY_PAID"] },
          dueDate: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
        _sum: { balanceDue: true },
        _count: true,
      }),

      // Aging: 31-60 days
      prisma.invoice.aggregate({
        where: {
          ...baseFilter,
          status: { in: ["PENDING", "SENT", "PARTIALLY_PAID"] },
          dueDate: {
            gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
            lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { balanceDue: true },
        _count: true,
      }),

      // Aging: 61-90 days
      prisma.invoice.aggregate({
        where: {
          ...baseFilter,
          status: { in: ["PENDING", "SENT", "PARTIALLY_PAID"] },
          dueDate: {
            gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
            lt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { balanceDue: true },
        _count: true,
      }),

      // Aging: 90+ days
      prisma.invoice.aggregate({
        where: {
          ...baseFilter,
          status: { in: ["PENDING", "SENT", "PARTIALLY_PAID"] },
          dueDate: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
        },
        _sum: { balanceDue: true },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        // KPIs
        kpis: {
          totalOutstanding: outstandingStats._sum.balanceDue || 0,
          outstandingCount: outstandingStats._count,
          overdueAmount: overdueStats._sum.balanceDue || 0,
          overdueCount: overdueStats._count,
          thisMonthBilled: thisMonthStats._sum.totalAmount || 0,
          thisMonthInvoiceCount: thisMonthStats._count,
          lastMonthBilled: lastMonthStats._sum.totalAmount || 0,
          thisMonthCollected: thisMonthPayments._sum.amount || 0,
          thisMonthPaymentCount: thisMonthPayments._count,
        },

        // Aging breakdown
        aging: {
          current: {
            amount: aging0to30._sum.balanceDue || 0,
            count: aging0to30._count,
          },
          days31to60: {
            amount: aging31to60._sum.balanceDue || 0,
            count: aging31to60._count,
          },
          days61to90: {
            amount: aging61to90._sum.balanceDue || 0,
            count: aging61to90._count,
          },
          over90: {
            amount: aging90plus._sum.balanceDue || 0,
            count: aging90plus._count,
          },
        },

        // Top clients
        topClientsOutstanding: topClientsOutstanding.map((c) => ({
          clientId: c.clientId,
          clientName: c.clientName,
          outstanding: c._sum.balanceDue || 0,
        })),

        // Recent invoices
        recentInvoices,
      },
    });
  } catch (error) {
    console.error("Billing Summary GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch billing summary" },
      { status: 500 }
    );
  }
}
