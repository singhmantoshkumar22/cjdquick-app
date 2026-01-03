import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - COD Dashboard Summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const hubId = searchParams.get("hubId");
    const clientId = searchParams.get("clientId");
    const driverId = searchParams.get("driverId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    } else {
      dateFilter.gte = startOfWeek;
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }

    // Parallel queries for dashboard
    const [
      // Today's collections
      todayCollections,
      // Pending deposits (collected but not deposited)
      pendingDeposits,
      // Pending remittances
      pendingRemittances,
      // Total COD by status
      collectionsByStatus,
      // Top drivers by collection
      topDrivers,
      // Recent collections
      recentCollections,
      // Discrepancies
      discrepancies,
    ] = await Promise.all([
      // Today's collections
      prisma.cODCollection.aggregate({
        where: {
          collectionTime: {
            gte: today,
          },
          ...(driverId && { collectedById: driverId }),
        },
        _sum: {
          collectedAmount: true,
          expectedAmount: true,
        },
        _count: true,
      }),

      // Pending deposits
      prisma.cODCollection.aggregate({
        where: {
          status: "COLLECTED",
          ...(driverId && { collectedById: driverId }),
          ...(hubId && {
            deposit: {
              hubId,
            },
          }),
        },
        _sum: {
          collectedAmount: true,
        },
        _count: true,
      }),

      // Pending remittances
      prisma.cODRemittance.aggregate({
        where: {
          status: { in: ["PENDING", "APPROVED"] },
          ...(clientId && { clientId }),
        },
        _sum: {
          netRemittance: true,
        },
        _count: true,
      }),

      // Collections by status
      prisma.cODCollection.groupBy({
        by: ["status"],
        where: {
          collectionTime: dateFilter,
        },
        _sum: {
          collectedAmount: true,
        },
        _count: true,
      }),

      // Top drivers
      prisma.cODCollection.groupBy({
        by: ["collectedById", "collectedByName"],
        where: {
          collectionTime: dateFilter,
        },
        _sum: {
          collectedAmount: true,
        },
        _count: true,
        orderBy: {
          _sum: {
            collectedAmount: "desc",
          },
        },
        take: 10,
      }),

      // Recent collections
      prisma.cODCollection.findMany({
        where: {
          ...(driverId && { collectedById: driverId }),
        },
        orderBy: { collectionTime: "desc" },
        take: 10,
        select: {
          id: true,
          awbNumber: true,
          collectedAmount: true,
          paymentMode: true,
          collectedByName: true,
          status: true,
          collectionTime: true,
        },
      }),

      // Discrepancies
      prisma.cODDeposit.findMany({
        where: {
          status: "DISCREPANCY",
          ...(hubId && { hubId }),
        },
        orderBy: { depositTime: "desc" },
        take: 10,
        select: {
          id: true,
          depositNumber: true,
          depositedByName: true,
          expectedAmount: true,
          depositedAmount: true,
          shortageAmount: true,
          depositTime: true,
        },
      }),
    ]);

    // Calculate summary stats
    const statusMap = new Map(
      collectionsByStatus.map((s) => [
        s.status,
        { count: s._count, amount: s._sum.collectedAmount || 0 },
      ])
    );

    return NextResponse.json({
      success: true,
      data: {
        // KPIs
        kpis: {
          todayCollected: todayCollections._sum.collectedAmount || 0,
          todayCount: todayCollections._count,
          pendingDepositAmount: pendingDeposits._sum.collectedAmount || 0,
          pendingDepositCount: pendingDeposits._count,
          pendingRemittanceAmount: pendingRemittances._sum.netRemittance || 0,
          pendingRemittanceCount: pendingRemittances._count,
        },

        // Status breakdown
        statusBreakdown: {
          collected: statusMap.get("COLLECTED") || { count: 0, amount: 0 },
          deposited: statusMap.get("DEPOSITED") || { count: 0, amount: 0 },
          reconciled: statusMap.get("RECONCILED") || { count: 0, amount: 0 },
          disputed: statusMap.get("DISPUTED") || { count: 0, amount: 0 },
        },

        // Top performers
        topDrivers: topDrivers.map((d) => ({
          id: d.collectedById,
          name: d.collectedByName,
          collectionCount: d._count,
          totalCollected: d._sum.collectedAmount || 0,
        })),

        // Recent activity
        recentCollections,

        // Issues
        discrepancies,
      },
    });
  } catch (error) {
    console.error("COD Summary GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch COD summary" },
      { status: 500 }
    );
  }
}
