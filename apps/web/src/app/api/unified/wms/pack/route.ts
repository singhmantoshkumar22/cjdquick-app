import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import { startPacking, confirmPacking } from "@/lib/unified-wms-service";

// POST: Start packing or confirm packed items
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
    const { action, orderId, packerId, packedItems, packageDetails } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "action is required (start, confirm)" },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "start": {
        if (!packerId) {
          return NextResponse.json(
            { success: false, error: "packerId is required" },
            { status: 400 }
          );
        }

        const order = await startPacking(orderId, packerId);
        return NextResponse.json({
          success: true,
          data: order,
          message: "Packing started",
        });
      }

      case "confirm": {
        if (!packedItems || !Array.isArray(packedItems) || packedItems.length === 0) {
          return NextResponse.json(
            { success: false, error: "packedItems array is required" },
            { status: 400 }
          );
        }

        const order = await confirmPacking(orderId, packedItems, packageDetails);
        return NextResponse.json({
          success: true,
          data: order,
          message: "Packing confirmed",
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Use: start, confirm" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Packing error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Packing operation failed" },
      { status: 400 }
    );
  }
}

// PUT: Quick pack (start + confirm in one call)
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
    const { orderId, packerId, packageDetails } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    // Start packing
    const order = await startPacking(orderId, packerId || "system");

    // Auto-confirm all items as fully packed
    const packedItems = order.items.map((item) => ({
      itemId: item.id,
      packedQty: item.pickedQty || item.quantity,
    }));

    const result = await confirmPacking(orderId, packedItems, packageDetails);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Order packed successfully",
    });
  } catch (error: any) {
    console.error("Quick pack error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Quick pack failed" },
      { status: 400 }
    );
  }
}
