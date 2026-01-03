import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// Warehouse Robotics Integration API - AGV, AMR, Sorting Systems

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const robotId = searchParams.get("robotId");
    const status = searchParams.get("status");
    const warehouseId = searchParams.get("warehouseId");
    const robotType = searchParams.get("robotType");

    if (type === "tasks") {
      const where: any = {};
      if (robotId) where.robotId = robotId;
      if (status) where.status = status;

      const tasks = await prisma.robotTask.findMany({
        where,
        include: {
          robot: { select: { robotId: true, robotType: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return NextResponse.json({
        success: true,
        data: { items: tasks },
      });
    }

    if (type === "zones") {
      const where: any = {};
      if (warehouseId) where.warehouseId = warehouseId;

      const zones = await prisma.robotZone.findMany({
        where,
        orderBy: { zoneName: "asc" },
      });

      return NextResponse.json({
        success: true,
        data: { items: zones },
      });
    }

    if (type === "maintenance") {
      const where: any = {};
      if (robotId) where.robotId = robotId;
      if (status) where.status = status;

      const maintenance = await prisma.robotMaintenance.findMany({
        where,
        include: {
          robot: { select: { robotId: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({
        success: true,
        data: { items: maintenance },
      });
    }

    // Default: Get robots
    const where: any = {};
    if (robotType) where.robotType = robotType;
    if (status) where.status = status;
    if (warehouseId) where.warehouseId = warehouseId;

    const robots = await prisma.warehouseRobot.findMany({
      where,
      include: {
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Calculate fleet summary
    const summary = {
      total: robots.length,
      active: robots.filter((r) => r.status === "WORKING").length,
      idle: robots.filter((r) => r.status === "IDLE").length,
      charging: robots.filter((r) => r.status === "CHARGING").length,
      maintenance: robots.filter((r) => r.status === "MAINTENANCE").length,
      error: robots.filter((r) => r.status === "ERROR").length,
      avgBattery: robots.length > 0
        ? robots.reduce((sum, r) => sum + (r.batteryLevel || 0), 0) / robots.length
        : 0,
      byType: {
        agv: robots.filter((r) => r.robotType === "AGV").length,
        amr: robots.filter((r) => r.robotType === "AMR").length,
        sortingArm: robots.filter((r) => r.robotType === "PICKING_ARM").length,
        pickingRobot: robots.filter((r) => r.robotType === "SORTING_ROBOT").length,
      },
    };

    return NextResponse.json({
      success: true,
      data: { items: robots, summary },
    });
  } catch (error) {
    console.error("Robotics GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch robotics data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "REGISTER_ROBOT": {
        const robot = await prisma.warehouseRobot.create({
          data: {
            robotId: body.robotId,
            warehouseId: body.warehouseId,
            robotType: body.robotType,
            manufacturer: body.manufacturer,
            model: body.model,
            serialNumber: body.serialNumber,
            maxPayloadKg: body.maxPayloadKg,
            maxSpeedMps: body.maxSpeedMps,
            navigationTechnology: body.navigationTechnology,
            canPickItems: body.canPickItems || false,
            canPlaceItems: body.canPlaceItems || false,
            canTransportPallets: body.canTransportPallets || false,
            canSortPackages: body.canSortPackages || false,
            status: "IDLE",
            batteryLevel: 100,
          },
        });

        return NextResponse.json({ success: true, data: robot });
      }

      case "ASSIGN_TASK": {
        const { robotId, taskDetails } = body;

        // Verify robot is available
        const robot = await prisma.warehouseRobot.findUnique({
          where: { robotId },
        });

        if (!robot || !["IDLE", "WORKING"].includes(robot.status)) {
          return NextResponse.json(
            { success: false, error: "Robot not available" },
            { status: 400 }
          );
        }

        const task = await prisma.robotTask.create({
          data: {
            robotId: robot.id,
            warehouseId: robot.warehouseId,
            taskType: taskDetails.taskType,
            priority: taskDetails.priority || 5,
            sourceZoneId: taskDetails.sourceZoneId,
            sourceLocation: taskDetails.sourceLocation,
            destinationZoneId: taskDetails.destinationZoneId,
            destinationLocation: taskDetails.destinationLocation,
            itemId: taskDetails.itemId,
            itemSku: taskDetails.itemSku,
            itemQuantity: taskDetails.itemQuantity,
            containerType: taskDetails.containerType,
            containerId: taskDetails.containerId,
            pickListId: taskDetails.pickListId,
            orderId: taskDetails.orderId,
            scheduledAt: taskDetails.scheduledAt ? new Date(taskDetails.scheduledAt) : null,
            estimatedDurationSec: taskDetails.estimatedDurationSec,
            status: "ASSIGNED",
          },
        });

        // Update robot status
        await prisma.warehouseRobot.update({
          where: { id: robot.id },
          data: {
            status: "WORKING",
            currentTaskId: task.id,
          },
        });

        return NextResponse.json({ success: true, data: task });
      }

      case "UPDATE_TASK_STATUS": {
        const { taskId, status } = body;

        const task = await prisma.robotTask.update({
          where: { id: taskId },
          data: {
            status,
            startedAt: status === "IN_PROGRESS" ? new Date() : undefined,
            completedAt: status === "COMPLETED" ? new Date() : undefined,
            failureReason: body.failureReason,
          },
        });

        // If task completed, update robot
        if (status === "COMPLETED" || status === "FAILED") {
          await prisma.warehouseRobot.update({
            where: { id: task.robotId },
            data: {
              status: "IDLE",
              currentTaskId: null,
              totalTasksCompleted: status === "COMPLETED" ? { increment: 1 } : undefined,
            },
          });
        }

        return NextResponse.json({ success: true, data: task });
      }

      case "UPDATE_ROBOT_STATUS": {
        const { robotId, status, location, batteryLevel } = body;

        const robot = await prisma.warehouseRobot.update({
          where: { robotId },
          data: {
            status,
            positionX: location?.x,
            positionY: location?.y,
            positionZ: location?.z,
            batteryLevel,
          },
        });

        return NextResponse.json({ success: true, data: robot });
      }

      case "CREATE_ZONE": {
        const zone = await prisma.robotZone.create({
          data: {
            warehouseId: body.warehouseId,
            zoneName: body.zoneName,
            zoneCode: body.zoneCode,
            zoneType: body.zoneType,
            minX: body.minX || 0,
            maxX: body.maxX || 10,
            minY: body.minY || 0,
            maxY: body.maxY || 10,
            maxRobots: body.maxRobots || 5,
            speedLimitMps: body.speedLimitMps,
            isRestrictedAccess: body.isRestrictedAccess || false,
          },
        });

        return NextResponse.json({ success: true, data: zone });
      }

      case "SCHEDULE_MAINTENANCE": {
        const { robotId } = body;

        const robot = await prisma.warehouseRobot.findUnique({
          where: { robotId },
        });

        if (!robot) {
          return NextResponse.json(
            { success: false, error: "Robot not found" },
            { status: 404 }
          );
        }

        const maintenance = await prisma.robotMaintenance.create({
          data: {
            robotId: robot.id,
            maintenanceType: body.maintenanceType,
            description: body.description,
            technicianName: body.technicianName,
            technicianId: body.technicianId,
            scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
            startedAt: new Date(),
            status: "SCHEDULED",
          },
        });

        return NextResponse.json({ success: true, data: maintenance });
      }

      case "COMPLETE_MAINTENANCE": {
        const { maintenanceId, notes, partsReplaced, laborCost, partsCost } = body;

        const maintenance = await prisma.robotMaintenance.update({
          where: { id: maintenanceId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            notes,
            partsReplaced,
            laborCost,
            partsCost,
            totalCost: (laborCost || 0) + (partsCost || 0),
          },
        });

        // Update robot status
        await prisma.warehouseRobot.update({
          where: { id: maintenance.robotId },
          data: {
            status: "IDLE",
            lastMaintenanceAt: new Date(),
          },
        });

        return NextResponse.json({ success: true, data: maintenance });
      }

      case "SEND_TO_CHARGING": {
        const { robotId } = body;

        const robot = await prisma.warehouseRobot.update({
          where: { robotId },
          data: {
            status: "CHARGING",
            isCharging: true,
          },
        });

        return NextResponse.json({ success: true, data: robot });
      }

      case "EMERGENCY_STOP": {
        const { robotId } = body;

        const robot = await prisma.warehouseRobot.update({
          where: { robotId },
          data: {
            status: "ERROR",
            errorCount: { increment: 1 },
          },
        });

        // Cancel current task
        if (robot.currentTaskId) {
          await prisma.robotTask.update({
            where: { id: robot.currentTaskId },
            data: {
              status: "FAILED",
              failureReason: "Emergency stop activated",
            },
          });
        }

        return NextResponse.json({ success: true, data: robot });
      }

      case "RESUME_ROBOT": {
        const { robotId } = body;

        const robot = await prisma.warehouseRobot.update({
          where: { robotId },
          data: {
            status: "IDLE",
          },
        });

        return NextResponse.json({ success: true, data: robot });
      }

      case "GET_FLEET_METRICS": {
        const { warehouseId } = body;

        const robots = await prisma.warehouseRobot.findMany({
          where: warehouseId ? { warehouseId } : undefined,
        });

        const tasks = await prisma.robotTask.findMany({
          where: {
            status: { in: ["COMPLETED", "FAILED"] },
            completedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });

        const metrics = {
          fleetSize: robots.length,
          activeRobots: robots.filter((r) => r.status === "WORKING").length,
          utilizationPercent: robots.length > 0
            ? (robots.filter((r) => r.status === "WORKING").length / robots.length) * 100
            : 0,
          avgBatteryLevel: robots.length > 0
            ? robots.reduce((sum, r) => sum + (r.batteryLevel || 0), 0) / robots.length
            : 0,
          tasksLast24h: tasks.length,
          tasksCompleted: tasks.filter((t) => t.status === "COMPLETED").length,
          tasksFailed: tasks.filter((t) => t.status === "FAILED").length,
          successRate: tasks.length > 0
            ? (tasks.filter((t) => t.status === "COMPLETED").length / tasks.length) * 100
            : 0,
          totalDistanceM: robots.reduce((sum, r) => sum + (r.totalDistanceMeters || 0), 0),
          totalTasksCompleted: robots.reduce((sum, r) => sum + (r.totalTasksCompleted || 0), 0),
        };

        return NextResponse.json({ success: true, data: metrics });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Robotics POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process robotics request" },
      { status: 500 }
    );
  }
}
