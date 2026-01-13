import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import { updateOrderStatus, ORDER_STATUS_FLOW } from "@/lib/unified-order-service";
import { prisma } from "@cjdquick/database";

// POST: Update order status
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

    const { status, statusText, location, remarks } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

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

    // Verify access - brand users can only update certain statuses
    if (auth.type === "brand") {
      if (existing.brandId !== auth.context.brandId) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }

      // Brand users can only confirm or cancel orders
      const brandAllowedStatuses = ["CONFIRMED", "CANCELLED"];
      if (!brandAllowedStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: "Brand users can only confirm or cancel orders" },
          { status: 403 }
        );
      }
    }

    // Validate status transition
    const allowedStatuses = ORDER_STATUS_FLOW[existing.status] || [];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot transition from ${existing.status} to ${status}`,
          allowedStatuses,
        },
        { status: 400 }
      );
    }

    const order = await updateOrderStatus({
      orderId: id,
      status,
      statusText: statusText || `Status changed to ${status}`,
      location,
      remarks,
      source: auth.type === "brand" ? "BRAND" : "ADMIN",
      sourceRef: auth.type === "brand" ? auth.context.userEmail : auth.context.userEmail,
    });

    return NextResponse.json({
      success: true,
      data: order,
      message: `Order status updated to ${status}`,
    });
  } catch (error: any) {
    console.error("Update order status error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update order status" },
      { status: 500 }
    );
  }
}

// GET: Get allowed status transitions
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

    const order = await prisma.unifiedOrder.findUnique({
      where: { id },
      select: { id: true, status: true, brandId: true },
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

    const allowedStatuses = ORDER_STATUS_FLOW[order.status] || [];

    // Filter for brand users
    let filteredStatuses = allowedStatuses;
    if (auth.type === "brand") {
      filteredStatuses = allowedStatuses.filter((s) =>
        ["CONFIRMED", "CANCELLED"].includes(s)
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        currentStatus: order.status,
        allowedTransitions: filteredStatuses,
        allStatusFlow: ORDER_STATUS_FLOW,
      },
    });
  } catch (error) {
    console.error("Get status transitions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get status transitions" },
      { status: 500 }
    );
  }
}
