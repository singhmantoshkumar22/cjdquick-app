import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { auth } from "@/lib/auth";

// GET /api/dashboard/sla - Get SLA metrics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    // Calculate date range
    const now = new Date();
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - days);

    // Get orders in period
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        expectedDeliveryDate: true,
        channel: true,
        shipments: {
          select: {
            createdAt: true,
            status: true,
            deliveredAt: true,
          },
        },
      },
    });

    // Calculate SLA metrics
    let totalOrders = orders.length;
    let onTimeDeliveries = 0;
    let lateDeliveries = 0;
    let pendingOrders = 0;
    let slaBreaches = 0;

    // Processing time metrics (in hours)
    const processingTimes: number[] = [];

    // Order to ship times (in hours)
    const orderToShipTimes: number[] = [];

    // Delivery times (in days)
    const deliveryTimes: number[] = [];

    for (const order of orders) {
      const orderDate = new Date(order.createdAt);
      const expectedDate = order.expectedDeliveryDate
        ? new Date(order.expectedDeliveryDate)
        : null;

      // Check if order has shipments
      if (order.shipments.length > 0) {
        const firstShipment = order.shipments[0];
        const shipmentDate = new Date(firstShipment.createdAt);

        // Order to ship time
        const orderToShip = (shipmentDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
        orderToShipTimes.push(orderToShip);

        // Check if delivered
        if (firstShipment.deliveredAt) {
          const deliveredDate = new Date(firstShipment.deliveredAt);
          const deliveryDays =
            (deliveredDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
          deliveryTimes.push(deliveryDays);

          // Check on-time vs late
          if (expectedDate) {
            if (deliveredDate <= expectedDate) {
              onTimeDeliveries++;
            } else {
              lateDeliveries++;
              slaBreaches++;
            }
          } else {
            // Default SLA: 5 days
            if (deliveryDays <= 5) {
              onTimeDeliveries++;
            } else {
              lateDeliveries++;
              slaBreaches++;
            }
          }
        } else {
          // Not yet delivered
          pendingOrders++;

          // Check if past expected date
          if (expectedDate && now > expectedDate) {
            slaBreaches++;
          }
        }
      } else {
        // No shipment yet
        pendingOrders++;

        // Check order aging for SLA breach
        const orderAge = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
        if (orderAge > 24) {
          // More than 24 hours without shipment
          slaBreaches++;
        }
      }
    }

    // Calculate averages
    const avgOrderToShip =
      orderToShipTimes.length > 0
        ? orderToShipTimes.reduce((a, b) => a + b, 0) / orderToShipTimes.length
        : 0;

    const avgDeliveryTime =
      deliveryTimes.length > 0
        ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
        : 0;

    // Channel-wise SLA
    const channelSLA = new Map<string, { total: number; onTime: number }>();
    for (const order of orders) {
      const channel = order.channel || "UNKNOWN";
      const current = channelSLA.get(channel) || { total: 0, onTime: 0 };
      current.total++;

      if (order.shipments.length > 0 && order.shipments[0].deliveredAt) {
        const deliveredDate = new Date(order.shipments[0].deliveredAt);
        const expectedDate = order.expectedDeliveryDate
          ? new Date(order.expectedDeliveryDate)
          : null;
        if (expectedDate && deliveredDate <= expectedDate) {
          current.onTime++;
        }
      }

      channelSLA.set(channel, current);
    }

    const channelMetrics = Array.from(channelSLA.entries()).map(([channel, data]) => ({
      channel,
      totalOrders: data.total,
      onTimeDeliveries: data.onTime,
      slaPercent: data.total > 0 ? Math.round((data.onTime / data.total) * 100) : 0,
    }));

    // Fill rate calculation
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: startDate },
        },
      },
      select: {
        quantity: true,
        allocatedQty: true,
      },
    });

    const totalItemsOrdered = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalItemsAllocated = orderItems.reduce(
      (sum, item) => sum + (item.allocatedQty || 0),
      0
    );
    const fillRate =
      totalItemsOrdered > 0
        ? Math.round((totalItemsAllocated / totalItemsOrdered) * 100)
        : 100;

    return NextResponse.json({
      period,
      summary: {
        totalOrders,
        onTimeDeliveries,
        lateDeliveries,
        pendingOrders,
        slaBreaches,
        onTimePercent:
          totalOrders - pendingOrders > 0
            ? Math.round(
                (onTimeDeliveries / (totalOrders - pendingOrders)) * 100
              )
            : 100,
      },
      performance: {
        avgOrderToShipHours: Math.round(avgOrderToShip * 10) / 10,
        avgDeliveryDays: Math.round(avgDeliveryTime * 10) / 10,
        fillRate,
      },
      channelMetrics,
      targets: {
        orderToShipTarget: 24, // hours
        deliveryTarget: 5, // days
        onTimeTarget: 95, // percent
        fillRateTarget: 98, // percent
      },
    });
  } catch (error) {
    console.error("Error fetching SLA metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch SLA metrics" },
      { status: 500 }
    );
  }
}
