import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// POST - Raise a complaint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      awbNumber,
      phone,
      email,
      complaintType,
      description,
      preferredContact,
    } = body;

    // Validate required fields
    if (!awbNumber || !complaintType || !description) {
      return NextResponse.json(
        { success: false, error: "AWB, complaint type, and description are required" },
        { status: 400 }
      );
    }

    if (!phone && !email) {
      return NextResponse.json(
        { success: false, error: "Phone or email is required for follow-up" },
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
    if (phone) {
      const last4 = phone.slice(-4);
      const shipmentLast4 = shipment.consigneePhone?.slice(-4);
      if (last4 !== shipmentLast4) {
        return NextResponse.json(
          { success: false, error: "Phone number does not match shipment records" },
          { status: 403 }
        );
      }
    }

    // Generate complaint number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const complaintNumber = `CMP${dateStr}${randomNum}`;

    // Create complaint (using ShipmentEvent as a simple storage)
    const complaint = await prisma.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        eventType: "COMPLAINT_RAISED",
        status: shipment.status,
        statusText: `Complaint raised: ${complaintType}`,
        eventTime: new Date(),
        source: "CUSTOMER_PORTAL",
        remarks: `Complaint: ${complaintNumber}, Type: ${complaintType}, Description: ${description}, Contact: ${phone || email}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        complaintNumber,
        message: "Complaint registered successfully. Our team will contact you within 24 hours.",
      },
    });
  } catch (error) {
    console.error("Complaint Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register complaint" },
      { status: 500 }
    );
  }
}

// GET - Get complaint types
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      complaintTypes: [
        { code: "DELIVERY_DELAY", label: "Delivery is delayed" },
        { code: "WRONG_DELIVERY", label: "Wrong item delivered" },
        { code: "DAMAGED_PACKAGE", label: "Package was damaged" },
        { code: "MISSING_ITEM", label: "Items missing from package" },
        { code: "RUDE_BEHAVIOR", label: "Rude behavior by delivery agent" },
        { code: "WRONG_ADDRESS", label: "Delivery to wrong address" },
        { code: "COD_ISSUE", label: "COD amount issue" },
        { code: "TRACKING_ISSUE", label: "Tracking not updating" },
        { code: "RESCHEDULE_REQUEST", label: "Need to reschedule delivery" },
        { code: "OTHER", label: "Other issue" },
      ],
    },
  });
}
