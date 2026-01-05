import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";
import { getClientFromRequest } from "@/lib/client-auth";

export async function GET(request: NextRequest) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const status = searchParams.get("status");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const where: any = {
      clientId: clientContext.id,
    };

    if (status) {
      where.status = status;
    }

    if (fromDate) {
      where.periodStart = { ...where.periodStart, gte: new Date(fromDate) };
    }

    if (toDate) {
      where.periodEnd = { ...where.periodEnd, lte: new Date(toDate) };
    }

    const [remittances, total] = await Promise.all([
      prisma.cODRemittance.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.cODRemittance.count({ where }),
    ]);

    // Get summary stats
    const stats = await prisma.cODRemittance.aggregate({
      where: { clientId: clientContext.id },
      _sum: {
        grossCodCollected: true,
        netRemittance: true,
        deductions: true,
      },
      _count: true,
    });

    const pendingRemittances = await prisma.cODRemittance.count({
      where: {
        clientId: clientContext.id,
        status: { in: ["PENDING", "APPROVED", "PROCESSING"] },
      },
    });

    const paidRemittances = await prisma.cODRemittance.aggregate({
      where: {
        clientId: clientContext.id,
        status: "PAID",
      },
      _sum: {
        netRemittance: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: remittances.map((r) => ({
          id: r.id,
          remittanceNumber: r.remittanceNumber,
          periodStart: r.periodStart.toISOString(),
          periodEnd: r.periodEnd.toISOString(),
          grossCodCollected: r.grossCodCollected,
          deductions: r.deductions,
          netRemittance: r.netRemittance,
          shipmentCount: r.shipmentCount,
          deliveredCount: r.deliveredCount,
          rtoCount: r.rtoCount,
          status: r.status,
          paymentMode: r.paymentMode,
          paymentRef: r.paymentRef,
          paidAt: r.paidAt?.toISOString(),
          createdAt: r.createdAt.toISOString(),
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        stats: {
          totalRemittances: stats._count,
          grossCollected: stats._sum.grossCodCollected || 0,
          totalDeductions: stats._sum.deductions || 0,
          netRemittance: stats._sum.netRemittance || 0,
          pendingRemittances,
          paidAmount: paidRemittances._sum.netRemittance || 0,
        },
      },
    });
  } catch (error) {
    console.error("Client COD remittance error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
