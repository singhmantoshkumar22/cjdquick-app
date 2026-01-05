import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";
import { getClientFromRequest } from "@/lib/client-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        clientId: clientContext.id,
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            contactName: true,
            contactPhone: true,
          },
        },
        partner: {
          select: {
            id: true,
            name: true,
            displayName: true,
            code: true,
          },
        },
        events: {
          orderBy: { eventTime: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check order exists and belongs to client
    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        clientId: clientContext.id,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Only allow updates for orders in CREATED status
    if (existingOrder.status !== "CREATED") {
      return NextResponse.json(
        { success: false, error: "Cannot update order after it has been processed" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      deliveryPincode,
      deliveryCity,
      deliveryState,
      weightKg,
      lengthCm,
      widthCm,
      heightCm,
      itemDescription,
      itemValue,
      itemQuantity,
      itemSku,
      paymentMode,
      codAmount,
      notes,
    } = body;

    const updateData: any = {};
    if (customerName) updateData.customerName = customerName;
    if (customerPhone) updateData.customerPhone = customerPhone;
    if (customerEmail !== undefined) updateData.customerEmail = customerEmail;
    if (deliveryAddress) updateData.deliveryAddress = deliveryAddress;
    if (deliveryPincode) updateData.deliveryPincode = deliveryPincode;
    if (deliveryCity) updateData.deliveryCity = deliveryCity;
    if (deliveryState) updateData.deliveryState = deliveryState;
    if (weightKg) updateData.weightKg = weightKg;
    if (lengthCm !== undefined) updateData.lengthCm = lengthCm;
    if (widthCm !== undefined) updateData.widthCm = widthCm;
    if (heightCm !== undefined) updateData.heightCm = heightCm;
    if (itemDescription) updateData.itemDescription = itemDescription;
    if (itemValue !== undefined) updateData.itemValue = itemValue;
    if (itemQuantity) updateData.itemQuantity = itemQuantity;
    if (itemSku !== undefined) updateData.itemSku = itemSku;
    if (paymentMode) updateData.paymentMode = paymentMode;
    if (codAmount !== undefined) updateData.codAmount = codAmount;
    if (notes !== undefined) updateData.notes = notes;

    // Recalculate volumetric weight if dimensions changed
    const length = lengthCm ?? existingOrder.lengthCm;
    const width = widthCm ?? existingOrder.widthCm;
    const height = heightCm ?? existingOrder.heightCm;
    const weight = weightKg ?? existingOrder.weightKg;

    if (length && width && height) {
      updateData.volumetricWeight = (length * width * height) / 5000;
      updateData.chargeableWeight = Math.max(weight, updateData.volumetricWeight);
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        warehouse: {
          select: { id: true, name: true, code: true },
        },
        partner: {
          select: { id: true, name: true, displayName: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check order exists and belongs to client
    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        clientId: clientContext.id,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Only allow cancellation for orders in CREATED or MANIFESTED status
    if (!["CREATED", "MANIFESTED"].includes(existingOrder.status)) {
      return NextResponse.json(
        { success: false, error: "Cannot cancel order after it has been picked up" },
        { status: 400 }
      );
    }

    // Update status to CANCELLED
    await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // Create cancellation event
    await prisma.orderEvent.create({
      data: {
        orderId: id,
        status: "CANCELLED",
        statusText: "Order cancelled by client",
        source: "CLIENT_PORTAL",
        eventTime: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
