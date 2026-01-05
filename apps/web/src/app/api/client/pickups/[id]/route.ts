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

    const pickup = await prisma.pickupRequest.findFirst({
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
      },
    });

    if (!pickup) {
      return NextResponse.json(
        { success: false, error: "Pickup not found" },
        { status: 404 }
      );
    }

    // Get orders associated with this pickup (orders created around the pickup time from the same warehouse)
    const associatedOrders = await prisma.order.findMany({
      where: {
        clientId: clientContext.id,
        warehouseId: pickup.warehouseId,
        createdAt: {
          gte: new Date(pickup.createdAt.getTime() - 24 * 60 * 60 * 1000),
          lte: pickup.pickedAt || new Date(),
        },
      },
      select: {
        id: true,
        orderNumber: true,
        awbNumber: true,
        status: true,
        customerName: true,
        deliveryCity: true,
      },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...pickup,
        orders: associatedOrders,
      },
    });
  } catch (error) {
    console.error("Get pickup error:", error);
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

    const existingPickup = await prisma.pickupRequest.findFirst({
      where: {
        id,
        clientId: clientContext.id,
      },
    });

    if (!existingPickup) {
      return NextResponse.json(
        { success: false, error: "Pickup not found" },
        { status: 404 }
      );
    }

    // Only allow updates for scheduled pickups
    if (existingPickup.status !== "SCHEDULED") {
      return NextResponse.json(
        { success: false, error: "Cannot update pickup after it has been processed" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      requestedDate,
      timeSlotStart,
      timeSlotEnd,
      expectedAwbs,
      expectedWeight,
      contactName,
      contactPhone,
      notes,
    } = body;

    const updateData: any = {};
    if (requestedDate) updateData.requestedDate = new Date(requestedDate);
    if (timeSlotStart !== undefined) updateData.timeSlotStart = timeSlotStart;
    if (timeSlotEnd !== undefined) updateData.timeSlotEnd = timeSlotEnd;
    if (expectedAwbs !== undefined) updateData.expectedAwbs = expectedAwbs;
    if (expectedWeight !== undefined) updateData.expectedWeight = expectedWeight;
    if (contactName !== undefined) updateData.contactName = contactName;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (notes !== undefined) updateData.notes = notes;

    const pickup = await prisma.pickupRequest.update({
      where: { id },
      data: updateData,
      include: {
        warehouse: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: pickup,
    });
  } catch (error) {
    console.error("Update pickup error:", error);
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

    const existingPickup = await prisma.pickupRequest.findFirst({
      where: {
        id,
        clientId: clientContext.id,
      },
    });

    if (!existingPickup) {
      return NextResponse.json(
        { success: false, error: "Pickup not found" },
        { status: 404 }
      );
    }

    // Only allow cancellation for scheduled pickups
    if (existingPickup.status !== "SCHEDULED") {
      return NextResponse.json(
        { success: false, error: "Cannot cancel pickup after it has been processed" },
        { status: 400 }
      );
    }

    await prisma.pickupRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      success: true,
      message: "Pickup cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel pickup error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
