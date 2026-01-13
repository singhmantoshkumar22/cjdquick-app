import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import { allocateOrderInventory } from "@/lib/unified-wms-service";

// POST: Allocate inventory for an order
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
    const { orderId, locationId, allocationStrategy = "FIFO" } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: "locationId is required" },
        { status: 400 }
      );
    }

    const result = await allocateOrderInventory({
      orderId,
      locationId,
      allocationStrategy,
    });

    return NextResponse.json({
      success: result.success,
      data: result,
      message: result.success
        ? "Inventory allocated successfully"
        : `Partial allocation - ${result.shortfall.length} items short`,
    });
  } catch (error: any) {
    console.error("Allocation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to allocate inventory" },
      { status: 400 }
    );
  }
}

// POST bulk allocation
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
    const { orderIds, locationId, allocationStrategy = "FIFO" } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "orderIds array is required" },
        { status: 400 }
      );
    }

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: "locationId is required" },
        { status: 400 }
      );
    }

    // Process in batches to avoid timeouts
    const results: any[] = [];
    const errors: any[] = [];

    for (const orderId of orderIds.slice(0, 50)) {
      try {
        const result = await allocateOrderInventory({
          orderId,
          locationId,
          allocationStrategy,
        });
        results.push(result);
      } catch (err: any) {
        errors.push({ orderId, error: err.message });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      data: {
        processed: results.length,
        successful: results.filter((r) => r.success).length,
        partial: results.filter((r) => !r.success).length,
        failed: errors.length,
        results,
        errors,
      },
    });
  } catch (error: any) {
    console.error("Bulk allocation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to allocate inventory" },
      { status: 500 }
    );
  }
}
