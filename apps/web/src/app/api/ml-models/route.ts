import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// ML Model Registry and Training API - Demand Forecasting, Route Optimization

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const modelId = searchParams.get("modelId");
    const status = searchParams.get("status");
    const modelType = searchParams.get("modelType");

    if (type === "training-jobs") {
      const where: any = {};
      if (modelId) where.modelId = modelId;
      if (status) where.status = status;

      const jobs = await prisma.mLTrainingJob.findMany({
        where,
        include: {
          model: { select: { modelName: true, modelType: true, version: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({
        success: true,
        data: { items: jobs },
      });
    }

    if (type === "forecasts") {
      const forecastType = searchParams.get("forecastType");

      const where: any = {};
      if (forecastType) where.forecastType = forecastType;

      const forecasts = await prisma.demandForecast.findMany({
        where,
        orderBy: { forecastDate: "desc" },
        take: 100,
      });

      return NextResponse.json({
        success: true,
        data: { items: forecasts },
      });
    }

    // Default: Get models
    const where: any = {};
    if (modelType) where.modelType = modelType;
    if (status) where.status = status;

    const models = await prisma.mLModel.findMany({
      where,
      include: {
        _count: { select: { trainingJobs: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const summary = {
      total: models.length,
      active: models.filter((m) => m.isActive).length,
      training: models.filter((m) => m.status === "TRAINING").length,
      byType: {
        demandForecast: models.filter((m) => m.modelType === "DEMAND_FORECAST").length,
        routeOptimization: models.filter((m) => m.modelType === "ROUTE_OPTIMIZATION").length,
        etaPrediction: models.filter((m) => m.modelType === "ETA_PREDICTION").length,
        delayRisk: models.filter((m) => m.modelType === "DELAY_RISK").length,
      },
    };

    return NextResponse.json({
      success: true,
      data: { items: models, summary },
    });
  } catch (error) {
    console.error("ML Models GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ML data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "REGISTER_MODEL": {
        const model = await prisma.mLModel.create({
          data: {
            modelName: body.modelName,
            modelType: body.modelType,
            version: body.version || "1.0.0",
            algorithm: body.algorithm,
            features: body.features,
            hyperparameters: body.hyperparameters,
            trainingDataStart: body.trainingDataStart ? new Date(body.trainingDataStart) : null,
            trainingDataEnd: body.trainingDataEnd ? new Date(body.trainingDataEnd) : null,
            sampleCount: body.sampleCount,
            status: "TRAINING",
            isActive: false,
          },
        });

        return NextResponse.json({ success: true, data: model });
      }

      case "START_TRAINING": {
        const { modelId, config } = body;

        // Create training job
        const job = await prisma.mLTrainingJob.create({
          data: {
            modelId,
            modelType: config.modelType || "DEMAND_FORECAST",
            jobName: `Training_${Date.now()}`,
            trainingConfig: JSON.stringify(config.hyperparameters || {}),
            datasetConfig: JSON.stringify(config.datasetConfig || {}),
            status: "RUNNING",
          },
        });

        return NextResponse.json({ success: true, data: job });
      }

      case "COMPLETE_TRAINING": {
        const { jobId, modelId, metrics } = body;

        const job = await prisma.mLTrainingJob.update({
          where: { id: jobId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        await prisma.mLModel.update({
          where: { id: modelId },
          data: {
            status: "VALIDATED",
            isActive: true,
            deployedAt: new Date(),
            trainingAccuracy: metrics.trainingAccuracy,
            validationAccuracy: metrics.validationAccuracy,
            mape: metrics.mape,
            rmse: metrics.rmse,
          },
        });

        return NextResponse.json({ success: true, data: job });
      }

      case "GENERATE_FORECAST": {
        const { modelId, forecastConfig } = body;

        const model = await prisma.mLModel.findUnique({
          where: { id: modelId },
        });

        if (!model || !model.isActive) {
          return NextResponse.json(
            { success: false, error: "Model not active" },
            { status: 400 }
          );
        }

        // Generate forecasts (simplified - in production would use actual ML inference)
        const forecasts = [];
        const forecastDays = forecastConfig.days || 7;

        for (let i = 0; i < forecastDays; i++) {
          const forecastDate = new Date();
          forecastDate.setDate(forecastDate.getDate() + i);

          const forecast = await prisma.demandForecast.create({
            data: {
              forecastType: forecastConfig.type || "OVERALL",
              forecastDate,
              periodType: "DAILY",
              predictedShipments: Math.floor(Math.random() * 500) + 100,
              predictedWeightKg: Math.floor(Math.random() * 5000) + 1000,
              predictedRevenue: Math.floor(Math.random() * 100000) + 10000,
              confidenceLevel: 0.85 + Math.random() * 0.1,
              predictionLow: Math.floor(Math.random() * 50) + 50,
              predictionHigh: Math.floor(Math.random() * 100) + 150,
              modelVersion: model.version,
            },
          });
          forecasts.push(forecast);
        }

        return NextResponse.json({
          success: true,
          data: { forecasts, count: forecasts.length },
        });
      }

      case "UPDATE_MODEL": {
        const { modelId } = body;

        const model = await prisma.mLModel.update({
          where: { id: modelId },
          data: {
            modelName: body.modelName,
            status: body.status,
            version: body.version,
            isActive: body.isActive,
          },
        });

        return NextResponse.json({ success: true, data: model });
      }

      case "ARCHIVE_MODEL": {
        const { modelId } = body;

        const model = await prisma.mLModel.update({
          where: { id: modelId },
          data: { status: "DEPRECATED", isActive: false },
        });

        return NextResponse.json({ success: true, data: model });
      }

      case "COMPARE_MODELS": {
        const { modelIds } = body;

        const models = await prisma.mLModel.findMany({
          where: { id: { in: modelIds } },
          include: {
            trainingJobs: {
              where: { status: "COMPLETED" },
              orderBy: { completedAt: "desc" },
              take: 1,
            },
          },
        });

        const comparison = models.map((m) => ({
          id: m.id,
          modelName: m.modelName,
          version: m.version,
          trainingAccuracy: m.trainingAccuracy,
          validationAccuracy: m.validationAccuracy,
          mape: m.mape,
          latestTraining: m.trainingJobs[0] || null,
        }));

        return NextResponse.json({ success: true, data: comparison });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("ML Models POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process ML request" },
      { status: 500 }
    );
  }
}
