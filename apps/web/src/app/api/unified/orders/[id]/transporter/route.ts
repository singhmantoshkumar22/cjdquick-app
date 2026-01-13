import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import { assignTransporter, selectTransporter } from "@/lib/unified-order-service";
import { prisma } from "@cjdquick/database";

// POST: Assign transporter to order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const { transporterId, awbNumber, autoSelect } = body;

    // Get existing order
    const existing = await prisma.unifiedOrder.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify access
    if (auth.type === "brand" && existing.brandId !== auth.context.brandId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Only allow assignment for orders in certain statuses
    const assignableStatuses = ["CREATED", "CONFIRMED", "ALLOCATED", "PACKED", "READY_TO_SHIP"];
    if (!assignableStatuses.includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot assign transporter for order in ${existing.status} status` },
        { status: 400 }
      );
    }

    let selectedTransporterId = transporterId;
    let transporterInfo = null;

    // Auto-select transporter if requested
    if (autoSelect && !transporterId) {
      const transporterResult = await selectTransporter({
        originPincode: existing.originPincode || "",
        destinationPincode: existing.shippingPincode,
        weightKg: existing.chargeableWeight || existing.totalWeight,
        isCod: existing.paymentMode === "COD",
        codAmount: existing.codAmount || 0,
      });

      if (!transporterResult.recommended) {
        return NextResponse.json(
          { success: false, error: "No serviceable transporter found for this pincode" },
          { status: 400 }
        );
      }

      selectedTransporterId = transporterResult.recommended.transporterId;
      transporterInfo = transporterResult.recommended;
    }

    if (!selectedTransporterId) {
      return NextResponse.json(
        { success: false, error: "transporterId is required (or use autoSelect: true)" },
        { status: 400 }
      );
    }

    const order = await assignTransporter(id, selectedTransporterId, awbNumber);

    return NextResponse.json({
      success: true,
      data: order,
      ...(transporterInfo && {
        transporterSelection: {
          selected: transporterInfo,
          message: `Assigned ${transporterInfo.transporterCode} with estimated rate ₹${transporterInfo.rate}`,
        },
      }),
    });
  } catch (error: any) {
    console.error("Assign transporter error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to assign transporter" },
      { status: 500 }
    );
  }
}

// GET: Get available transporters for order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get order details
    const order = await prisma.unifiedOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify access
    if (auth.type === "brand" && order.brandId !== auth.context.brandId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Get available transporters
    const result = await selectTransporter({
      originPincode: order.originPincode || "",
      destinationPincode: order.shippingPincode,
      weightKg: order.chargeableWeight || order.totalWeight,
      isCod: order.paymentMode === "COD",
      codAmount: order.codAmount || 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        currentTransporter: order.transporterId
          ? {
              id: order.transporterId,
              awbNumber: order.awbNumber,
            }
          : null,
        recommended: result.recommended,
        alternatives: result.alternatives,
        orderDetails: {
          originPincode: order.originPincode,
          destinationPincode: order.shippingPincode,
          weight: order.chargeableWeight || order.totalWeight,
          paymentMode: order.paymentMode,
          codAmount: order.codAmount,
        },
      },
    });
  } catch (error) {
    console.error("Get transporters error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get available transporters" },
      { status: 500 }
    );
  }
}
