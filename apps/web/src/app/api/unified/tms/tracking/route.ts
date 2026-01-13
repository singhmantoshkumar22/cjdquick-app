import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import { updateTracking, getTrackingHistory } from "@/lib/unified-tms-service";

// GET: Get tracking history
export async function GET(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    const events = await getTrackingHistory(orderId);

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Get tracking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tracking history" },
      { status: 500 }
    );
  }
}

// POST: Update tracking (for webhook or manual updates)
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
    const {
      orderId,
      awbNumber,
      status,
      statusText,
      location,
      timestamp,
      rawEvent,
    } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "status is required" },
        { status: 400 }
      );
    }

    if (!orderId && !awbNumber) {
      return NextResponse.json(
        { success: false, error: "orderId or awbNumber is required" },
        { status: 400 }
      );
    }

    const order = await updateTracking({
      orderId,
      awbNumber,
      status,
      statusText,
      location,
      timestamp: timestamp ? new Date(timestamp) : undefined,
      rawEvent,
    });

    return NextResponse.json({
      success: true,
      data: { orderId: order.id, status: order.status },
      message: "Tracking updated",
    });
  } catch (error: any) {
    console.error("Update tracking error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update tracking" },
      { status: 400 }
    );
  }
}

// PATCH: Bulk tracking updates
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "updates array is required" },
        { status: 400 }
      );
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const update of updates.slice(0, 100)) {
      try {
        const order = await updateTracking({
          orderId: update.orderId,
          awbNumber: update.awbNumber,
          status: update.status,
          statusText: update.statusText,
          location: update.location,
          timestamp: update.timestamp ? new Date(update.timestamp) : undefined,
          rawEvent: update.rawEvent,
        });
        results.push({ orderId: order.id, status: order.status });
      } catch (err: any) {
        errors.push({
          orderId: update.orderId,
          awbNumber: update.awbNumber,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      data: {
        updated: results.length,
        failed: errors.length,
        results,
        errors,
      },
    });
  } catch (error: any) {
    console.error("Bulk tracking update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update tracking" },
      { status: 500 }
    );
  }
}
