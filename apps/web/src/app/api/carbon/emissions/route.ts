import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// Emission factors (kg CO2 per km) by vehicle type and fuel
const EMISSION_FACTORS: Record<string, Record<string, number>> = {
  BIKE: { PETROL: 0.05, ELECTRIC: 0 },
  THREE_WHEELER: { PETROL: 0.08, CNG: 0.05, ELECTRIC: 0 },
  TEMPO: { DIESEL: 0.18, CNG: 0.12 },
  PICKUP: { DIESEL: 0.22, CNG: 0.15 },
  TRUCK: { DIESEL: 0.35, CNG: 0.25 },
  TRUCK_LARGE: { DIESEL: 0.55, CNG: 0.4 },
};

// GET - Get carbon emissions summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "last_30_days";
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    // Calculate date range
    let startDate = new Date();
    const endDate = new Date();

    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "last_7_days":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "last_30_days":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "last_90_days":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "this_year":
        startDate = new Date(startDate.getFullYear(), 0, 1);
        break;
    }

    const where: any = {
      emissionDate: { gte: startDate, lte: endDate },
    };

    if (entityType) where.referenceType = entityType;
    if (entityId) where.referenceId = entityId;

    // Get emissions
    const emissions = await prisma.carbonEmission.aggregate({
      where,
      _sum: {
        co2EmissionKg: true,
        distanceKm: true,
        loadWeightKg: true,
      },
      _count: true,
      _avg: {
        co2PerKmKg: true,
        co2PerKgCargo: true,
      },
    });

    // Get emissions by fuel type
    const byFuelType = await prisma.carbonEmission.groupBy({
      by: ["fuelType"],
      where,
      _sum: { co2EmissionKg: true, distanceKm: true },
      _count: true,
    });

    // Get emissions by vehicle type
    const byVehicleType = await prisma.carbonEmission.groupBy({
      by: ["vehicleType"],
      where,
      _sum: { co2EmissionKg: true, distanceKm: true },
      _count: true,
    });

    // Get daily trend
    const dailyEmissions = await prisma.carbonDailySummary.findMany({
      where: {
        summaryDate: { gte: startDate, lte: endDate },
        entityType: entityType || "OVERALL",
        entityId: entityId || null,
      },
      orderBy: { summaryDate: "asc" },
      take: 30,
    });

    // Get green initiatives
    const initiatives = await prisma.greenInitiative.findMany({
      where: { status: { in: ["PLANNED", "IN_PROGRESS"] } },
      take: 5,
    });

    // Calculate comparisons
    const previousStartDate = new Date(startDate);
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    previousStartDate.setDate(previousStartDate.getDate() - daysDiff);

    const previousEmissions = await prisma.carbonEmission.aggregate({
      where: {
        emissionDate: { gte: previousStartDate, lt: startDate },
      },
      _sum: { co2EmissionKg: true },
    });

    const currentCo2 = emissions._sum.co2EmissionKg || 0;
    const previousCo2 = previousEmissions._sum.co2EmissionKg || 0;
    const changePercent =
      previousCo2 > 0
        ? ((currentCo2 - previousCo2) / previousCo2) * 100
        : 0;

    // Convert to tons for better readability
    const co2Tons = currentCo2 / 1000;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCo2Kg: currentCo2,
          totalCo2Tons: Math.round(co2Tons * 100) / 100,
          totalDistanceKm: emissions._sum.distanceKm || 0,
          totalTrips: emissions._count,
          avgCo2PerKm: emissions._avg.co2PerKmKg || 0,
          avgCo2PerKgCargo: emissions._avg.co2PerKgCargo || 0,
          treesEquivalent: Math.round(currentCo2 / 21), // 1 tree absorbs ~21kg CO2/year
        },
        comparison: {
          previousPeriodCo2Kg: previousCo2,
          changePercent: Math.round(changePercent * 10) / 10,
          isReduction: changePercent < 0,
        },
        byFuelType: byFuelType.map((f) => ({
          fuelType: f.fuelType,
          co2Kg: f._sum.co2EmissionKg || 0,
          distanceKm: f._sum.distanceKm || 0,
          trips: f._count,
        })),
        byVehicleType: byVehicleType.map((v) => ({
          vehicleType: v.vehicleType,
          co2Kg: v._sum.co2EmissionKg || 0,
          distanceKm: v._sum.distanceKm || 0,
          trips: v._count,
        })),
        dailyTrend: dailyEmissions,
        greenInitiatives: initiatives,
      },
    });
  } catch (error) {
    console.error("Get Emissions Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch emissions data" },
      { status: 500 }
    );
  }
}

// POST - Record carbon emission for a trip
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      emissionType,
      referenceId,
      referenceType,
      vehicleId,
      vehicleType,
      fuelType,
      distanceKm,
      loadWeightKg,
      loadUtilization,
    } = body;

    if (!referenceId || !referenceType || !distanceKm) {
      return NextResponse.json(
        { success: false, error: "Reference ID, type, and distance are required" },
        { status: 400 }
      );
    }

    // Get emission factor
    const factor =
      EMISSION_FACTORS[vehicleType]?.[fuelType] ||
      EMISSION_FACTORS.TEMPO?.DIESEL ||
      0.18;

    // Calculate CO2 emissions
    const co2EmissionKg = distanceKm * factor;
    const co2PerKmKg = factor;
    const co2PerKgCargo = loadWeightKg ? co2EmissionKg / loadWeightKg : null;

    const emission = await prisma.carbonEmission.create({
      data: {
        emissionType: emissionType || "TRIP",
        referenceId,
        referenceType,
        emissionDate: new Date(),
        vehicleId,
        vehicleType,
        fuelType,
        distanceKm,
        loadWeightKg,
        loadUtilization,
        co2EmissionKg,
        co2PerKmKg,
        co2PerKgCargo,
        emissionFactorValue: factor,
        calculationMethod: "DISTANCE_BASED",
      },
    });

    // Update daily summary
    await updateDailySummary(emission);

    return NextResponse.json({
      success: true,
      data: emission,
      message: `Recorded ${co2EmissionKg.toFixed(2)} kg CO2 emissions`,
    });
  } catch (error) {
    console.error("Record Emission Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record emission" },
      { status: 500 }
    );
  }
}

async function updateDailySummary(emission: any) {
  const summaryDate = new Date(emission.emissionDate);
  summaryDate.setHours(0, 0, 0, 0);

  // Update or create overall summary
  await prisma.carbonDailySummary.upsert({
    where: {
      summaryDate_entityType_entityId: {
        summaryDate,
        entityType: "OVERALL",
        entityId: "",
      },
    },
    create: {
      summaryDate,
      entityType: "OVERALL",
      entityId: null,
      totalDistanceKm: emission.distanceKm,
      totalCo2Kg: emission.co2EmissionKg,
      totalShipments: 1,
      totalWeightKg: emission.loadWeightKg || 0,
      avgCo2PerShipment: emission.co2EmissionKg,
      avgCo2PerKm: emission.co2PerKmKg,
    },
    update: {
      totalDistanceKm: { increment: emission.distanceKm },
      totalCo2Kg: { increment: emission.co2EmissionKg },
      totalShipments: { increment: 1 },
      totalWeightKg: { increment: emission.loadWeightKg || 0 },
    },
  });
}
