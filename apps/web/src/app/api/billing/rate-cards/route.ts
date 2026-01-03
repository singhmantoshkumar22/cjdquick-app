import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - List rate cards
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const clientId = searchParams.get("clientId");
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};

    if (clientId) where.clientId = clientId;
    if (isActive !== null) where.isActive = isActive === "true";

    const [rateCards, total] = await Promise.all([
      prisma.rateCard.findMany({
        where,
        include: {
          zoneRates: true,
          weightSlabs: {
            orderBy: { fromWeight: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.rateCard.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        rateCards,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Rate Cards GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rate cards" },
      { status: 500 }
    );
  }
}

// POST - Create rate card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientId,
      clientName,
      name,
      description,
      effectiveFrom,
      effectiveTo,
      baseFreightPerKg,
      minFreight,
      codChargePercent,
      codMinCharge,
      fuelSurchargePercent,
      handlingChargePerShipment,
      packagingCharge,
      insurancePercent,
      rtoChargePercent,
      gstPercent,
      billingCycle,
      paymentTermsDays,
      zoneRates,
      weightSlabs,
    } = body;

    // Validate required fields
    if (!clientId || !clientName || !name || !effectiveFrom) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Deactivate existing active rate cards for this client
    await prisma.rateCard.updateMany({
      where: { clientId, isActive: true },
      data: { isActive: false },
    });

    // Create new rate card
    const rateCard = await prisma.rateCard.create({
      data: {
        clientId,
        clientName,
        name,
        description,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        baseFreightPerKg: baseFreightPerKg || 0,
        minFreight: minFreight || 0,
        codChargePercent: codChargePercent || 0,
        codMinCharge: codMinCharge || 0,
        fuelSurchargePercent: fuelSurchargePercent || 0,
        handlingChargePerShipment: handlingChargePerShipment || 0,
        packagingCharge: packagingCharge || 0,
        insurancePercent: insurancePercent || 0,
        rtoChargePercent: rtoChargePercent ?? 100,
        gstPercent: gstPercent ?? 18,
        billingCycle: billingCycle || "WEEKLY",
        paymentTermsDays: paymentTermsDays || 7,
        isActive: true,
        zoneRates: zoneRates?.length
          ? {
              create: zoneRates.map((zr: any) => ({
                zoneName: zr.zoneName,
                zoneCode: zr.zoneCode,
                baseRatePerKg: zr.baseRatePerKg,
                additionalPerKg: zr.additionalPerKg,
                minWeight: zr.minWeight || 0.5,
                expectedTatDays: zr.expectedTatDays,
              })),
            }
          : undefined,
        weightSlabs: weightSlabs?.length
          ? {
              create: weightSlabs.map((ws: any) => ({
                fromWeight: ws.fromWeight,
                toWeight: ws.toWeight,
                ratePerKg: ws.ratePerKg,
                flatRate: ws.flatRate,
              })),
            }
          : undefined,
      },
      include: {
        zoneRates: true,
        weightSlabs: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: rateCard,
    });
  } catch (error) {
    console.error("Rate Card POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create rate card" },
      { status: 500 }
    );
  }
}
