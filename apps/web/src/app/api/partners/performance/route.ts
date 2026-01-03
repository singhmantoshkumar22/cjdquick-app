import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - Partner Performance Dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days
    const partnerId = searchParams.get("partnerId");

    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get all active partners
    const partners = await prisma.partner.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        displayName: true,
        supportsCod: true,
        supportsReverse: true,
      },
    });

    // Get shipments handed over to partners in period
    const handedOverFilter: any = {
      handedOverToPartner: true,
      partnerHandoverAt: { gte: startDate },
    };
    if (partnerId) handedOverFilter.partnerId = partnerId;

    const [
      totalHandedOver,
      deliveredByPartner,
      ndrByPartner,
      rtoByPartner,
      handovers,
      codShipments,
    ] = await Promise.all([
      // Total handed over
      prisma.shipment.count({
        where: handedOverFilter,
      }),

      // Delivered by partners
      prisma.shipment.count({
        where: {
          ...handedOverFilter,
          status: "DELIVERED",
        },
      }),

      // NDR by partners
      prisma.shipment.count({
        where: {
          ...handedOverFilter,
          status: "NDR",
        },
      }),

      // RTO by partners
      prisma.shipment.count({
        where: {
          ...handedOverFilter,
          status: { in: ["RTO_INITIATED", "RTO_IN_TRANSIT", "RTO_DELIVERED"] },
        },
      }),

      // Handover count
      prisma.partnerHandover.count({
        where: {
          createdAt: { gte: startDate },
          ...(partnerId && { partnerId }),
        },
      }),

      // COD shipments with partners
      prisma.shipment.aggregate({
        where: {
          ...handedOverFilter,
          paymentMode: "COD",
        },
        _count: true,
        _sum: { codAmount: true },
      }),
    ]);

    // Partner-wise breakdown
    const partnerStats = await prisma.shipment.groupBy({
      by: ["partnerId"],
      where: {
        handedOverToPartner: true,
        partnerHandoverAt: { gte: startDate },
        partnerId: { not: null },
      },
      _count: true,
    });

    const partnerDelivered = await prisma.shipment.groupBy({
      by: ["partnerId"],
      where: {
        handedOverToPartner: true,
        partnerHandoverAt: { gte: startDate },
        partnerId: { not: null },
        status: "DELIVERED",
      },
      _count: true,
    });

    const partnerRto = await prisma.shipment.groupBy({
      by: ["partnerId"],
      where: {
        handedOverToPartner: true,
        partnerHandoverAt: { gte: startDate },
        partnerId: { not: null },
        status: { in: ["RTO_INITIATED", "RTO_IN_TRANSIT", "RTO_DELIVERED"] },
      },
      _count: true,
    });

    // Build partner performance map
    const statsMap = new Map(partnerStats.map((s) => [s.partnerId, s._count]));
    const deliveredMap = new Map(partnerDelivered.map((s) => [s.partnerId, s._count]));
    const rtoMap = new Map(partnerRto.map((s) => [s.partnerId, s._count]));

    const partnerPerformance = partners.map((partner) => {
      const total = statsMap.get(partner.id) || 0;
      const delivered = deliveredMap.get(partner.id) || 0;
      const rto = rtoMap.get(partner.id) || 0;

      return {
        partnerId: partner.id,
        partnerCode: partner.code,
        partnerName: partner.displayName || partner.name,
        totalShipments: total,
        deliveredCount: delivered,
        rtoCount: rto,
        deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(1) : "0",
        rtoRate: total > 0 ? ((rto / total) * 100).toFixed(1) : "0",
        supportsCod: partner.supportsCod,
        supportsReverse: partner.supportsReverse,
      };
    }).filter((p) => p.totalShipments > 0 || !partnerId);

    // Recent handovers
    const recentHandovers = await prisma.partnerHandover.findMany({
      where: {
        createdAt: { gte: startDate },
        ...(partnerId && { partnerId }),
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get partner names for handovers
    const handoverPartnerIds = [...new Set(recentHandovers.map((h) => h.partnerId))];
    const handoverPartners = await prisma.partner.findMany({
      where: { id: { in: handoverPartnerIds } },
      select: { id: true, code: true, name: true },
    });
    const partnerMap = new Map(handoverPartners.map((p) => [p.id, p]));

    // Calculate rates
    const deliveryRate = totalHandedOver > 0 ? (deliveredByPartner / totalHandedOver) * 100 : 0;
    const ndrRate = totalHandedOver > 0 ? (ndrByPartner / totalHandedOver) * 100 : 0;
    const rtoRate = totalHandedOver > 0 ? (rtoByPartner / totalHandedOver) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        // KPIs
        kpis: {
          totalHandedOver,
          deliveredByPartner,
          ndrByPartner,
          rtoByPartner,
          handoverCount: handovers,
          deliveryRate: deliveryRate.toFixed(1),
          ndrRate: ndrRate.toFixed(1),
          rtoRate: rtoRate.toFixed(1),
          codShipments: codShipments._count,
          codAmount: codShipments._sum.codAmount || 0,
        },

        // Partner breakdown
        partnerPerformance,

        // Recent handovers
        recentHandovers: recentHandovers.map((h) => ({
          id: h.id,
          handoverNumber: h.handoverNumber,
          partner: partnerMap.get(h.partnerId),
          shipmentCount: h.shipmentCount,
          status: h.status,
          createdAt: h.createdAt,
        })),

        // Period
        period: {
          days: daysAgo,
          startDate: startDate.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Partner Performance Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch partner performance" },
      { status: 500 }
    );
  }
}
