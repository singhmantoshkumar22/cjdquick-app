import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// IoT Device Management API

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const deviceId = searchParams.get("deviceId");
    const deviceType = searchParams.get("deviceType");
    const status = searchParams.get("status");
    const vehicleId = searchParams.get("vehicleId");
    const warehouseId = searchParams.get("warehouseId");

    if (type === "readings") {
      const limit = parseInt(searchParams.get("limit") || "100");
      const shipmentId = searchParams.get("shipmentId");

      const where: any = {};
      if (deviceId) where.deviceId = deviceId;
      if (shipmentId) where.shipmentId = shipmentId;

      const readings = await prisma.ioTReading.findMany({
        where,
        orderBy: { recordedAt: "desc" },
        take: limit,
        include: {
          device: { select: { deviceId: true, deviceType: true } },
        },
      });

      // Calculate stats
      const temps = readings.filter((r) => r.temperature !== null).map((r) => r.temperature as number);
      const stats = temps.length > 0 ? {
        minTemp: Math.min(...temps),
        maxTemp: Math.max(...temps),
        avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
        readingCount: readings.length,
        anomalyCount: readings.filter((r) => r.isAnomaly).length,
      } : null;

      return NextResponse.json({
        success: true,
        data: { items: readings, stats },
      });
    }

    if (type === "alerts") {
      const alertStatus = searchParams.get("alertStatus") || "ACTIVE";

      const alerts = await prisma.coldChainAlert.findMany({
        where: {
          deviceId: deviceId || undefined,
          status: alertStatus,
        },
        include: {
          device: { select: { deviceId: true, deviceType: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({
        success: true,
        data: { items: alerts },
      });
    }

    // Default: Get devices
    const where: any = {};
    if (deviceType) where.deviceType = deviceType;
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;
    if (warehouseId) where.warehouseId = warehouseId;

    const devices = await prisma.ioTDevice.findMany({
      where,
      include: {
        _count: { select: { readings: true, alerts: true } },
      },
      orderBy: { lastSeenAt: "desc" },
    });

    // Summary
    const summary = {
      total: devices.length,
      active: devices.filter((d) => d.status === "ACTIVE").length,
      inactive: devices.filter((d) => d.status === "INACTIVE").length,
      maintenance: devices.filter((d) => d.status === "MAINTENANCE").length,
      lowBattery: devices.filter((d) => d.batteryLevel && d.batteryLevel < 20).length,
    };

    return NextResponse.json({
      success: true,
      data: { items: devices, summary },
    });
  } catch (error) {
    console.error("IoT GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch IoT data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "REGISTER_DEVICE": {
        const device = await prisma.ioTDevice.create({
          data: {
            deviceId: body.deviceId,
            deviceType: body.deviceType,
            manufacturer: body.manufacturer,
            model: body.model,
            serialNumber: body.serialNumber,
            firmwareVersion: body.firmwareVersion,
            assignmentType: body.assignmentType,
            vehicleId: body.vehicleId,
            containerId: body.containerId,
            warehouseId: body.warehouseId,
            zoneId: body.zoneId,
            reportingIntervalSec: body.reportingIntervalSec || 300,
            tempMinThreshold: body.tempMinThreshold,
            tempMaxThreshold: body.tempMaxThreshold,
            humidityMinThreshold: body.humidityMinThreshold,
            humidityMaxThreshold: body.humidityMaxThreshold,
            status: "ACTIVE",
          },
        });

        return NextResponse.json({ success: true, data: device });
      }

      case "RECORD_READING": {
        // Support both 'deviceId' (string identifier) and 'iotDeviceId' (database id)
        const deviceIdString = body.deviceId;
        const iotDeviceId = body.iotDeviceId;

        // Get device configuration - try by database id first, then by deviceId string
        let device = null;
        if (iotDeviceId) {
          device = await prisma.ioTDevice.findUnique({
            where: { id: iotDeviceId },
          });
        }
        if (!device && deviceIdString) {
          device = await prisma.ioTDevice.findFirst({
            where: { deviceId: deviceIdString },
          });
        }

        if (!device) {
          return NextResponse.json(
            { success: false, error: "Device not found" },
            { status: 404 }
          );
        }

        // Check for anomalies
        let isAnomaly = false;
        let anomalyType: string | null = null;

        if (body.temperature !== null && body.temperature !== undefined) {
          if (device.tempMaxThreshold && body.temperature > device.tempMaxThreshold) {
            isAnomaly = true;
            anomalyType = "TEMP_HIGH";
          } else if (device.tempMinThreshold && body.temperature < device.tempMinThreshold) {
            isAnomaly = true;
            anomalyType = "TEMP_LOW";
          }
        }

        if (body.shockLevel && body.shockLevel > 3) {
          isAnomaly = true;
          anomalyType = "SHOCK";
        }

        if (body.doorStatus === "OPEN") {
          isAnomaly = true;
          anomalyType = "DOOR_OPEN";
        }

        const reading = await prisma.ioTReading.create({
          data: {
            deviceId: device.id,
            temperature: body.temperature,
            humidity: body.humidity,
            pressure: body.pressure,
            lightLevel: body.lightLevel,
            shockLevel: body.shockLevel,
            doorStatus: body.doorStatus,
            latitude: body.latitude,
            longitude: body.longitude,
            altitude: body.altitude,
            speed: body.speed,
            batteryLevel: body.batteryLevel,
            signalStrength: body.signalStrength,
            shipmentId: body.shipmentId,
            tripId: body.tripId,
            isAnomaly,
            anomalyType,
            recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
          },
        });

        // Update device status
        await prisma.ioTDevice.update({
          where: { id: device.id },
          data: {
            lastSeenAt: new Date(),
            batteryLevel: body.batteryLevel,
            signalStrength: body.signalStrength,
            lastLatitude: body.latitude,
            lastLongitude: body.longitude,
          },
        });

        // Create alert if anomaly detected
        if (isAnomaly && anomalyType) {
          await prisma.coldChainAlert.create({
            data: {
              deviceId: device.id,
              shipmentId: body.shipmentId,
              alertType: anomalyType === "TEMP_HIGH" || anomalyType === "TEMP_LOW" ? "TEMP_BREACH" : anomalyType,
              severity: anomalyType === "SHOCK" ? "HIGH" : "MEDIUM",
              message: getAlertMessage(anomalyType, body),
              currentValue: body.temperature || body.shockLevel,
              thresholdValue: anomalyType === "TEMP_HIGH" ? device.tempMaxThreshold : device.tempMinThreshold,
              status: "ACTIVE",
            },
          });
        }

        return NextResponse.json({ success: true, data: reading });
      }

      case "BATCH_READINGS": {
        const { readings } = body;

        // Process multiple readings
        const results = [];
        for (const reading of readings) {
          const device = await prisma.ioTDevice.findUnique({
            where: { deviceId: reading.deviceId },
          });

          if (device) {
            const created = await prisma.ioTReading.create({
              data: {
                deviceId: device.id,
                temperature: reading.temperature,
                humidity: reading.humidity,
                latitude: reading.latitude,
                longitude: reading.longitude,
                batteryLevel: reading.batteryLevel,
                recordedAt: new Date(reading.recordedAt),
              },
            });
            results.push(created);
          }
        }

        return NextResponse.json({
          success: true,
          data: { processed: results.length },
        });
      }

      case "UPDATE_DEVICE": {
        const { deviceId } = body;

        const device = await prisma.ioTDevice.update({
          where: { deviceId },
          data: {
            status: body.status,
            assignmentType: body.assignmentType,
            vehicleId: body.vehicleId,
            warehouseId: body.warehouseId,
            tempMinThreshold: body.tempMinThreshold,
            tempMaxThreshold: body.tempMaxThreshold,
            reportingIntervalSec: body.reportingIntervalSec,
          },
        });

        return NextResponse.json({ success: true, data: device });
      }

      case "ACKNOWLEDGE_ALERT": {
        const { alertId, acknowledgedBy } = body;

        const alert = await prisma.coldChainAlert.update({
          where: { id: alertId },
          data: {
            status: "ACKNOWLEDGED",
            acknowledgedBy,
            acknowledgedAt: new Date(),
          },
        });

        return NextResponse.json({ success: true, data: alert });
      }

      case "RESOLVE_ALERT": {
        const { alertId } = body;

        const alert = await prisma.coldChainAlert.update({
          where: { id: alertId },
          data: {
            status: "RESOLVED",
            resolvedAt: new Date(),
          },
        });

        return NextResponse.json({ success: true, data: alert });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("IoT POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process IoT request" },
      { status: 500 }
    );
  }
}

function getAlertMessage(anomalyType: string, reading: any): string {
  switch (anomalyType) {
    case "TEMP_HIGH":
      return `Temperature exceeded threshold: ${reading.temperature}°C`;
    case "TEMP_LOW":
      return `Temperature below threshold: ${reading.temperature}°C`;
    case "SHOCK":
      return `Shock event detected: ${reading.shockLevel}g`;
    case "DOOR_OPEN":
      return "Container door opened";
    default:
      return "Anomaly detected";
  }
}
