import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// POST - Request redelivery/reschedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      awbNumber,
      phone,
      preferredDate,
      preferredTimeSlot,
      alternateAddress,
      alternatePincode,
      alternatePhone,
      instructions,
    } = body;

    // Validate required fields
    if (!awbNumber || !phone || !preferredDate) {
      return NextResponse.json(
        { success: false, error: "AWB, phone, and preferred date are required" },
        { status: 400 }
      );
    }

    // Verify shipment exists
    const shipment = await prisma.shipment.findUnique({
      where: { awbNumber },
      select: {
        id: true,
        clientId: true,
        consigneePhone: true,
        status: true,
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Verify phone matches (last 4 digits)
    const last4 = phone.slice(-4);
    const shipmentLast4 = shipment.consigneePhone?.slice(-4);
    if (last4 !== shipmentLast4) {
      return NextResponse.json(
        { success: false, error: "Phone number does not match shipment records" },
        { status: 403 }
      );
    }

    // Check if reschedule is allowed
    const allowedStatuses = ["DELIVERY_FAILED", "NDR", "OUT_FOR_DELIVERY"];
    if (!allowedStatuses.includes(shipment.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Reschedule not available for current status: ${shipment.status}`,
        },
        { status: 400 }
      );
    }

    // Validate preferred date (must be future, within 7 days)
    const prefDate = new Date(preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);

    if (prefDate < today) {
      return NextResponse.json(
        { success: false, error: "Preferred date must be in the future" },
        { status: 400 }
      );
    }

    if (prefDate > maxDate) {
      return NextResponse.json(
        { success: false, error: "Preferred date must be within 7 days" },
        { status: 400 }
      );
    }

    // Create reschedule event
    await prisma.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        eventType: "RESCHEDULE_REQUESTED",
        status: shipment.status,
        statusText: `Reschedule requested for ${preferredDate}`,
        eventTime: new Date(),
        source: "CUSTOMER_PORTAL",
        remarks: `Preferred: ${preferredDate} ${preferredTimeSlot || "ANY"}${alternateAddress ? `, Alt Address: ${alternateAddress}` : ""}${instructions ? `, Notes: ${instructions}` : ""}`,
      },
    });

    // Update shipment expected delivery
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        expectedDeliveryDate: prefDate,
      },
    });

    // If there's an NDR, update it
    const ndr = await prisma.nDRReport.findFirst({
      where: {
        shipmentId: shipment.id,
        isResolved: false,
      },
    });

    if (ndr) {
      await prisma.nDRReport.update({
        where: { id: ndr.id },
        data: {
          rescheduledDate: prefDate,
          preferredTimeSlot: preferredTimeSlot || null,
          customerResponse: "RESCHEDULE_REQUESTED",
          customerResponseAt: new Date(),
          ...(alternateAddress && { correctedAddress: alternateAddress }),
          ...(alternatePincode && { correctedPincode: alternatePincode }),
          ...(alternatePhone && { correctedPhone: alternatePhone }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "Redelivery scheduled successfully",
        scheduledDate: preferredDate,
        timeSlot: preferredTimeSlot || "Standard Delivery Hours",
      },
    });
  } catch (error) {
    console.error("Reschedule Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to schedule redelivery" },
      { status: 500 }
    );
  }
}

// GET - Get available time slots
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      timeSlots: [
        { code: "MORNING", label: "Morning (9 AM - 12 PM)" },
        { code: "AFTERNOON", label: "Afternoon (12 PM - 4 PM)" },
        { code: "EVENING", label: "Evening (4 PM - 8 PM)" },
        { code: "ANY", label: "Anytime" },
      ],
    },
  });
}
