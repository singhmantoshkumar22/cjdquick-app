import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import { getOrderDetails, cancelOrder } from "@/lib/unified-order-service";
import { prisma } from "@cjdquick/database";

// GET: Get single order details
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
    const order = await getOrderDetails(id);

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

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PATCH: Update order details (before shipping)
export async function PATCH(
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

    // Only allow updates for orders in certain statuses
    const editableStatuses = ["CREATED", "CONFIRMED", "ALLOCATED"];
    if (!editableStatuses.includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot edit order in ${existing.status} status` },
        { status: 400 }
      );
    }

    // Allowed fields for update
    const allowedFields = [
      "customerName",
      "customerEmail",
      "customerPhone",
      "shippingAddress",
      "shippingCity",
      "shippingState",
      "shippingPincode",
      "billingAddress",
      "paymentMode",
      "codAmount",
      "remarks",
      "priority",
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // If payment mode changed to PREPAID, clear COD amount
    if (updateData.paymentMode === "PREPAID") {
      updateData.codAmount = 0;
    }

    const order = await prisma.unifiedOrder.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        brand: { select: { code: true, name: true } },
        location: { select: { code: true, name: true } },
        transporter: { select: { code: true, name: true } },
        events: {
          orderBy: { eventTime: "desc" },
          take: 10,
        },
      },
    });

    // Log the update event
    await prisma.unifiedOrderEvent.create({
      data: {
        orderId: id,
        status: order.status,
        statusText: `Order details updated: ${Object.keys(updateData).join(", ")}`,
        source: auth.type === "brand" ? "BRAND" : "ADMIN",
        sourceRef: auth.type === "brand" ? auth.context.userEmail : auth.context.userEmail,
        eventTime: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE: Cancel order
export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get("reason") || "Cancelled by user";

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

    const actor = auth.type === "brand" ? auth.context.userEmail : auth.context.userEmail;
    const order = await cancelOrder(id, reason, actor);

    return NextResponse.json({
      success: true,
      data: order,
      message: "Order cancelled successfully",
    });
  } catch (error: any) {
    console.error("Cancel order error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel order" },
      { status: 500 }
    );
  }
}
