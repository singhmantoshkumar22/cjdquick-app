import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { auth } from "@/lib/auth";

// POST /api/orders/bulk - Bulk actions on orders
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, orderIds } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "Order IDs are required" },
        { status: 400 }
      );
    }

    const results: Array<{ orderId: string; success: boolean; message?: string }> = [];

    switch (action) {
      case "confirm": {
        // Confirm orders (CREATED -> CONFIRMED)
        for (const orderId of orderIds) {
          try {
            const order = await prisma.order.findUnique({
              where: { id: orderId },
            });

            if (!order) {
              results.push({ orderId, success: false, message: "Order not found" });
              continue;
            }

            if (order.status !== "CREATED") {
              results.push({
                orderId,
                success: false,
                message: `Cannot confirm order in ${order.status} status`,
              });
              continue;
            }

            await prisma.order.update({
              where: { id: orderId },
              data: { status: "CONFIRMED" },
            });

            results.push({ orderId, success: true });
          } catch {
            results.push({ orderId, success: false, message: "Failed to confirm" });
          }
        }
        break;
      }

      case "allocate": {
        // Allocate inventory to orders
        for (const orderId of orderIds) {
          try {
            // Call the allocate endpoint logic here
            const response = await fetch(
              `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/orders/${orderId}/allocate`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Cookie: request.headers.get("cookie") || "",
                },
              }
            );

            if (response.ok) {
              results.push({ orderId, success: true });
            } else {
              const error = await response.json();
              results.push({ orderId, success: false, message: error.error });
            }
          } catch {
            results.push({ orderId, success: false, message: "Failed to allocate" });
          }
        }
        break;
      }

      case "hold": {
        // Put orders on hold
        for (const orderId of orderIds) {
          try {
            const order = await prisma.order.findUnique({
              where: { id: orderId },
            });

            if (!order) {
              results.push({ orderId, success: false, message: "Order not found" });
              continue;
            }

            const nonHoldableStatuses = [
              "SHIPPED",
              "IN_TRANSIT",
              "OUT_FOR_DELIVERY",
              "DELIVERED",
              "CANCELLED",
              "ON_HOLD",
            ];

            if (nonHoldableStatuses.includes(order.status)) {
              results.push({
                orderId,
                success: false,
                message: `Cannot hold order in ${order.status} status`,
              });
              continue;
            }

            await prisma.order.update({
              where: { id: orderId },
              data: { status: "ON_HOLD" },
            });

            results.push({ orderId, success: true });
          } catch {
            results.push({ orderId, success: false, message: "Failed to hold" });
          }
        }
        break;
      }

      case "cancel": {
        // Cancel orders
        if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role || "")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        for (const orderId of orderIds) {
          try {
            const order = await prisma.order.findUnique({
              where: { id: orderId },
            });

            if (!order) {
              results.push({ orderId, success: false, message: "Order not found" });
              continue;
            }

            const nonCancellableStatuses = [
              "SHIPPED",
              "IN_TRANSIT",
              "OUT_FOR_DELIVERY",
              "DELIVERED",
              "CANCELLED",
            ];

            if (nonCancellableStatuses.includes(order.status)) {
              results.push({
                orderId,
                success: false,
                message: `Cannot cancel order in ${order.status} status`,
              });
              continue;
            }

            await prisma.order.update({
              where: { id: orderId },
              data: { status: "CANCELLED" },
            });

            await prisma.orderItem.updateMany({
              where: { orderId },
              data: { status: "CANCELLED" },
            });

            results.push({ orderId, success: true });
          } catch {
            results.push({ orderId, success: false, message: "Failed to cancel" });
          }
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failureCount === 0,
      message: `${successCount} orders processed successfully, ${failureCount} failed`,
      results,
    });
  } catch (error) {
    console.error("Error processing bulk action:", error);
    return NextResponse.json(
      { error: "Failed to process bulk action" },
      { status: 500 }
    );
  }
}
