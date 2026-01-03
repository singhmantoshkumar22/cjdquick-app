import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - Get demand forecasts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forecastType = searchParams.get("forecastType") || "OVERALL";
    const entityId = searchParams.get("entityId");
    const periodType = searchParams.get("periodType") || "DAILY";
    const days = parseInt(searchParams.get("days") || "14");

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const where: any = {
      forecastType,
      periodType,
      forecastDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (entityId) where.entityId = entityId;
    else where.entityId = null;

    const forecasts = await prisma.demandForecast.findMany({
      where,
      orderBy: { forecastDate: "asc" },
    });

    // If no forecasts, generate them
    if (forecasts.length === 0) {
      const generatedForecasts = await generateForecasts(
        forecastType,
        entityId,
        periodType,
        startDate,
        days
      );
      return NextResponse.json({
        success: true,
        data: generatedForecasts,
        generated: true,
      });
    }

    // Calculate summary
    const summary = {
      totalPredictedShipments: forecasts.reduce(
        (sum, f) => sum + f.predictedShipments,
        0
      ),
      totalPredictedWeight: forecasts.reduce(
        (sum, f) => sum + f.predictedWeightKg,
        0
      ),
      totalPredictedRevenue: forecasts.reduce(
        (sum, f) => sum + f.predictedRevenue,
        0
      ),
      avgConfidence:
        forecasts.reduce((sum, f) => sum + f.confidenceLevel, 0) /
        forecasts.length,
      peakDay: forecasts.reduce((max, f) =>
        f.predictedShipments > max.predictedShipments ? f : max
      ),
    };

    return NextResponse.json({
      success: true,
      data: { forecasts, summary },
    });
  } catch (error) {
    console.error("Get Forecasts Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch forecasts" },
      { status: 500 }
    );
  }
}

// POST - Generate new forecasts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      forecastType,
      entityId,
      periodType,
      startDate,
      days,
    } = body;

    const forecasts = await generateForecasts(
      forecastType || "OVERALL",
      entityId,
      periodType || "DAILY",
      new Date(startDate || Date.now()),
      days || 14
    );

    return NextResponse.json({
      success: true,
      data: forecasts,
      message: `Generated ${forecasts.length} forecasts`,
    });
  } catch (error) {
    console.error("Generate Forecasts Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate forecasts" },
      { status: 500 }
    );
  }
}

// Generate forecasts using historical data
async function generateForecasts(
  forecastType: string,
  entityId: string | null,
  periodType: string,
  startDate: Date,
  days: number
) {
  const forecasts: any[] = [];

  // Get historical data for the same period last year/month
  const historyDays = 90;
  const historyStart = new Date();
  historyStart.setDate(historyStart.getDate() - historyDays);

  const where: any = {
    createdAt: { gte: historyStart },
  };

  if (forecastType === "CLIENT" && entityId) where.clientId = entityId;
  if (forecastType === "HUB" && entityId) where.currentHubId = entityId;

  // Get historical shipments
  const historicalData = await prisma.shipment.findMany({
    where,
    select: {
      createdAt: true,
      chargeableWeightKg: true,
      declaredValue: true,
    },
  });

  // Calculate daily averages
  const dailyStats: Record<number, { count: number; weight: number; revenue: number }> = {};

  historicalData.forEach((shipment) => {
    const dayOfWeek = shipment.createdAt.getDay();
    if (!dailyStats[dayOfWeek]) {
      dailyStats[dayOfWeek] = { count: 0, weight: 0, revenue: 0 };
    }
    dailyStats[dayOfWeek].count++;
    dailyStats[dayOfWeek].weight += shipment.chargeableWeightKg || 0;
    dailyStats[dayOfWeek].revenue += shipment.declaredValue || 0;
  });

  // Calculate averages per day of week
  const weeksInHistory = historyDays / 7;
  Object.keys(dailyStats).forEach((day) => {
    const d = parseInt(day);
    dailyStats[d].count = Math.round(dailyStats[d].count / weeksInHistory);
    dailyStats[d].weight = dailyStats[d].weight / weeksInHistory;
    dailyStats[d].revenue = dailyStats[d].revenue / weeksInHistory;
  });

  // Generate forecasts
  const current = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const dayOfWeek = current.getDay();
    const stats = dailyStats[dayOfWeek] || { count: 50, weight: 500, revenue: 5000 };

    // Apply seasonality and trend factors
    const seasonalityFactor = getSeasonalityFactor(current);
    const trendFactor = 1.02; // 2% growth trend

    const predicted = Math.round(stats.count * seasonalityFactor * trendFactor);
    const variance = Math.round(predicted * 0.15); // 15% variance

    const forecast = await prisma.demandForecast.upsert({
      where: {
        forecastType_entityId_forecastDate_periodType: {
          forecastType,
          entityId: entityId || "",
          forecastDate: new Date(current),
          periodType,
        },
      },
      create: {
        forecastType,
        entityId,
        forecastDate: new Date(current),
        periodType,
        predictedShipments: predicted,
        predictedWeightKg: stats.weight * seasonalityFactor * trendFactor,
        predictedRevenue: stats.revenue * seasonalityFactor * trendFactor,
        confidenceLevel: 75 + Math.random() * 15,
        predictionLow: predicted - variance,
        predictionHigh: predicted + variance,
        seasonalityFactor,
        trendFactor,
        eventFactor: 1,
        modelVersion: "v1.0",
      },
      update: {
        predictedShipments: predicted,
        predictedWeightKg: stats.weight * seasonalityFactor * trendFactor,
        predictedRevenue: stats.revenue * seasonalityFactor * trendFactor,
      },
    });

    forecasts.push(forecast);
    current.setDate(current.getDate() + 1);
  }

  return forecasts;
}

// Get seasonality factor based on date
function getSeasonalityFactor(date: Date): number {
  const month = date.getMonth();
  const dayOfMonth = date.getDate();

  // Festival seasons (India-specific)
  // Diwali season (Oct-Nov)
  if (month === 9 || month === 10) return 1.4;
  // Holi (March)
  if (month === 2) return 1.2;
  // End of year sales (Dec)
  if (month === 11) return 1.3;
  // Summer lull (May-June)
  if (month === 4 || month === 5) return 0.85;

  // Weekend adjustments
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) return 0.7; // Sunday
  if (dayOfWeek === 6) return 0.9; // Saturday

  return 1.0;
}
