import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// Cold Chain Shipment Management API - Pharma/Temperature Sensitive Logistics

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const shipmentId = searchParams.get("shipmentId");
    const status = searchParams.get("status");

    if (type === "excursions") {
      const coldChainShipmentId = searchParams.get("coldChainShipmentId");
      const where: any = {};
      if (coldChainShipmentId) where.coldChainShipmentId = coldChainShipmentId;
      if (status) where.status = status;

      const excursions = await prisma.coldChainExcursion.findMany({
        where,
        orderBy: { startTime: "desc" },
        take: 100,
      });

      return NextResponse.json({
        success: true,
        data: { items: excursions },
      });
    }

    if (type === "certificates") {
      const where: any = {};
      if (shipmentId) where.coldChainShipmentId = shipmentId;
      if (status) where.status = status;

      const certificates = await prisma.coldChainCertificate.findMany({
        where,
        orderBy: { issuedAt: "desc" },
        take: 50,
      });

      return NextResponse.json({
        success: true,
        data: { items: certificates },
      });
    }

    // Default: Get cold chain shipments
    const where: any = {};
    if (shipmentId) where.shipmentId = shipmentId;
    if (status) where.monitoringStatus = status;

    const shipments = await prisma.coldChainShipment.findMany({
      where,
      include: {
        _count: { select: { excursions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Calculate compliance summary
    const summary = {
      total: shipments.length,
      active: shipments.filter((s) => s.monitoringStatus === "ACTIVE").length,
      breach: shipments.filter((s) => s.monitoringStatus === "BREACH").length,
      completed: shipments.filter((s) => s.monitoringStatus === "COMPLETED").length,
      totalExcursions: shipments.reduce((sum, s) => sum + s.totalExcursions, 0),
    };

    return NextResponse.json({
      success: true,
      data: { items: shipments, summary },
    });
  } catch (error) {
    console.error("Cold Chain GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cold chain data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "CREATE_SHIPMENT": {
        const shipment = await prisma.coldChainShipment.create({
          data: {
            shipmentId: body.shipmentId,
            tempCategory: body.tempCategory || "CHILLED",
            tempMinRequired: body.tempMinRequired,
            tempMaxRequired: body.tempMaxRequired,
            tempTolerance: body.tempTolerance || 2,
            humidityMinRequired: body.humidityMinRequired,
            humidityMaxRequired: body.humidityMaxRequired,
            lightSensitive: body.lightSensitive || false,
            shockSensitive: body.shockSensitive || false,
            maxShockG: body.maxShockG,
            requiresDataLogger: body.requiresDataLogger ?? true,
            requiresGDPCompliance: body.requiresGDPCompliance || false,
            requiresHACCP: body.requiresHACCP || false,
            productType: body.productType,
            batchNumbers: body.batchNumbers,
            expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
            monitoringStatus: "ACTIVE",
          },
        });

        return NextResponse.json({ success: true, data: shipment });
      }

      case "RECORD_EXCURSION": {
        const { coldChainShipmentId } = body;

        const deviation = Math.abs(body.actualValue - body.thresholdValue);
        const severity = calculateExcursionSeverity(deviation, body.durationMinutes);

        const excursion = await prisma.coldChainExcursion.create({
          data: {
            coldChainShipmentId,
            deviceId: body.deviceId,
            excursionType: body.excursionType,
            thresholdValue: body.thresholdValue,
            actualValue: body.actualValue,
            deviationAmount: deviation,
            startTime: new Date(body.startTime),
            endTime: body.endTime ? new Date(body.endTime) : null,
            durationMinutes: body.durationMinutes,
            latitude: body.latitude,
            longitude: body.longitude,
            locationDescription: body.locationDescription,
            severity,
            status: "ACTIVE",
          },
        });

        // Update shipment excursion count
        await prisma.coldChainShipment.update({
          where: { id: coldChainShipmentId },
          data: {
            totalExcursions: { increment: 1 },
            maxExcursionDuration: {
              set: body.durationMinutes || 0,
            },
          },
        });

        return NextResponse.json({ success: true, data: excursion });
      }

      case "RESOLVE_EXCURSION": {
        const { excursionId, resolution, productImpact } = body;

        const excursion = await prisma.coldChainExcursion.update({
          where: { id: excursionId },
          data: {
            status: "RESOLVED",
            resolvedAt: new Date(),
            resolutionNotes: resolution,
            productImpact: productImpact,
          },
        });

        return NextResponse.json({ success: true, data: excursion });
      }

      case "ISSUE_CERTIFICATE": {
        const certificateNumber = `CC${Date.now()}`;

        const certificate = await prisma.coldChainCertificate.create({
          data: {
            coldChainShipmentId: body.coldChainShipmentId,
            certificateNumber,
            certificateType: body.certificateType || "TEMPERATURE_LOG",
            issuedAt: new Date(),
            validUntil: body.validUntil ? new Date(body.validUntil) : null,
            minTempRecorded: body.minTempRecorded,
            maxTempRecorded: body.maxTempRecorded,
            avgTempRecorded: body.avgTempRecorded,
            totalReadings: body.totalReadings,
            excursionCount: body.excursionCount || 0,
            complianceStatus: body.isCompliant ? "COMPLIANT" : "NON_COMPLIANT",
            remarks: body.remarks,
          },
        });

        return NextResponse.json({ success: true, data: certificate });
      }

      case "UPDATE_STATUS": {
        const { shipmentId, monitoringStatus } = body;

        const shipment = await prisma.coldChainShipment.update({
          where: { id: shipmentId },
          data: { monitoringStatus },
        });

        return NextResponse.json({ success: true, data: shipment });
      }

      case "GET_COMPLIANCE_REPORT": {
        const { shipmentId } = body;

        const shipment = await prisma.coldChainShipment.findUnique({
          where: { id: shipmentId },
          include: {
            excursions: {
              orderBy: { startTime: "asc" },
            },
            certificates: true,
          },
        });

        if (!shipment) {
          return NextResponse.json(
            { success: false, error: "Shipment not found" },
            { status: 404 }
          );
        }

        const report = {
          shipment,
          totalExcursions: shipment.excursions.length,
          activeExcursions: shipment.excursions.filter((e) => e.status === "ACTIVE").length,
          totalExcursionMinutes: shipment.excursions.reduce(
            (sum, e) => sum + (e.durationMinutes || 0),
            0
          ),
          severityBreakdown: {
            critical: shipment.excursions.filter((e) => e.severity === "CRITICAL").length,
            high: shipment.excursions.filter((e) => e.severity === "HIGH").length,
            medium: shipment.excursions.filter((e) => e.severity === "MEDIUM").length,
            low: shipment.excursions.filter((e) => e.severity === "LOW").length,
          },
          certificates: shipment.certificates,
        };

        return NextResponse.json({ success: true, data: report });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Cold Chain POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process cold chain request" },
      { status: 500 }
    );
  }
}

function calculateExcursionSeverity(deviation: number, duration?: number): string {
  const durationVal = duration || 0;

  if (deviation > 10 || durationVal > 60) return "CRITICAL";
  if (deviation > 5 || durationVal > 30) return "HIGH";
  if (deviation > 2 || durationVal > 15) return "MEDIUM";
  return "LOW";
}
