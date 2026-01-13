import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import {
  markDelivered,
  markDeliveryAttempted,
  initiateRto,
} from "@/lib/unified-tms-service";

// POST: Delivery actions
export async function POST(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, orderId } = body;

    if (!action || !orderId) {
      return NextResponse.json(
        { success: false, error: "action and orderId are required" },
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      case "delivered": {
        const { deliveredAt, podImage, receiverName } = body;
        result = await markDelivered(
          orderId,
          deliveredAt ? new Date(deliveredAt) : undefined,
          podImage,
          receiverName
        );
        return NextResponse.json({
          success: true,
          data: result,
          message: "Order marked as delivered",
        });
      }

      case "attempted": {
        const { reason, remarks, ndrImage } = body;
        if (!reason) {
          return NextResponse.json(
            { success: false, error: "reason is required for delivery attempt" },
            { status: 400 }
          );
        }
        result = await markDeliveryAttempted(orderId, reason, remarks, ndrImage);
        return NextResponse.json({
          success: true,
          data: result,
          message: "Delivery attempt recorded",
        });
      }

      case "rto": {
        const { reason, initiatedBy } = body;
        if (!reason) {
          return NextResponse.json(
            { success: false, error: "reason is required for RTO" },
            { status: 400 }
          );
        }
        result = await initiateRto(
          orderId,
          reason,
          initiatedBy || (auth.type === "admin" ? auth.context.userEmail : "system")
        );
        return NextResponse.json({
          success: true,
          data: result,
          message: "RTO initiated",
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Use: delivered, attempted, rto" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Delivery action error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process delivery action" },
      { status: 400 }
    );
  }
}

// PUT: Bulk delivery updates
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { deliveries } = body;

    if (!deliveries || !Array.isArray(deliveries) || deliveries.length === 0) {
      return NextResponse.json(
        { success: false, error: "deliveries array is required" },
        { status: 400 }
      );
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const delivery of deliveries.slice(0, 100)) {
      try {
        let result;
        switch (delivery.action) {
          case "delivered":
            result = await markDelivered(
              delivery.orderId,
              delivery.deliveredAt ? new Date(delivery.deliveredAt) : undefined,
              delivery.podImage,
              delivery.receiverName
            );
            break;
          case "attempted":
            result = await markDeliveryAttempted(
              delivery.orderId,
              delivery.reason,
              delivery.remarks
            );
            break;
          case "rto":
            result = await initiateRto(
              delivery.orderId,
              delivery.reason,
              auth.type === "admin" ? auth.context.userEmail : "system"
            );
            break;
          default:
            throw new Error("Invalid action");
        }
        results.push({ orderId: delivery.orderId, status: result?.status });
      } catch (err: any) {
        errors.push({ orderId: delivery.orderId, error: err.message });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      data: {
        processed: results.length + errors.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors,
      },
    });
  } catch (error: any) {
    console.error("Bulk delivery update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process deliveries" },
      { status: 500 }
    );
  }
}
