import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - Get NDR actions/history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ndrId: string }> }
) {
  try {
    const { ndrId } = await params;

    const actions = await prisma.nDRAction.findMany({
      where: { ndrReportId: ndrId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: actions,
    });
  } catch (error) {
    console.error("NDR Actions GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch NDR actions" },
      { status: 500 }
    );
  }
}

// POST - Take action on NDR
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ndrId: string }> }
) {
  try {
    const { ndrId } = await params;
    const body = await request.json();

    const {
      actionType, // REATTEMPT_SCHEDULED, ADDRESS_UPDATED, RTO_INITIATED, ESCALATED, CUSTOMER_CONTACTED
      performedById,
      performedByName,
      performedByType,
      remarks,
      rescheduledDate,
      preferredTimeSlot,
      correctedAddress,
      correctedPincode,
      correctedPhone,
      newStatus,
    } = body;

    // Validate required fields
    if (!actionType || !performedById) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const ndrReport = await prisma.nDRReport.findUnique({
      where: { id: ndrId },
    });

    if (!ndrReport) {
      return NextResponse.json(
        { success: false, error: "NDR report not found" },
        { status: 404 }
      );
    }

    // Determine new status based on action type
    let statusToSet = newStatus;
    if (!statusToSet) {
      switch (actionType) {
        case "REATTEMPT_SCHEDULED":
          statusToSet = "REATTEMPT_SCHEDULED";
          break;
        case "ADDRESS_UPDATED":
        case "PHONE_UPDATED":
          statusToSet = "ACTION_TAKEN";
          break;
        case "RTO_INITIATED":
          statusToSet = "RTO_INITIATED";
          break;
        case "ESCALATED":
          statusToSet = "ACTION_TAKEN";
          break;
        case "CUSTOMER_CONTACTED":
          statusToSet = "CUSTOMER_CONTACTED";
          break;
        case "DELIVERED":
          statusToSet = "DELIVERED";
          break;
        case "CLOSED":
          statusToSet = "CLOSED";
          break;
        default:
          statusToSet = ndrReport.status;
      }
    }

    // Create action record
    const action = await prisma.nDRAction.create({
      data: {
        ndrReportId: ndrId,
        actionType,
        performedById,
        performedByName: performedByName || "User",
        performedByType: performedByType || "AGENT",
        previousStatus: ndrReport.status,
        newStatus: statusToSet,
        remarks,
        changesJson: JSON.stringify({
          rescheduledDate,
          preferredTimeSlot,
          correctedAddress,
          correctedPincode,
          correctedPhone,
        }),
        actionTime: new Date(),
      },
    });

    // Update NDR report
    const updateData: any = {
      status: statusToSet,
      actionTaken: actionType,
      actionDetails: remarks,
      actionTakenAt: new Date(),
      actionTakenBy: performedById,
    };

    if (rescheduledDate) {
      updateData.rescheduledDate = new Date(rescheduledDate);
    }
    if (preferredTimeSlot) {
      updateData.preferredTimeSlot = preferredTimeSlot;
    }
    if (correctedAddress) {
      updateData.correctedAddress = correctedAddress;
    }
    if (correctedPincode) {
      updateData.correctedPincode = correctedPincode;
    }
    if (correctedPhone) {
      updateData.correctedPhone = correctedPhone;
    }

    // Check if resolving
    if (statusToSet === "DELIVERED" || statusToSet === "CLOSED") {
      updateData.isResolved = true;
      updateData.resolvedAt = new Date();
      updateData.resolutionType = statusToSet === "DELIVERED" ? "DELIVERED" : "CANCELLED";
    }

    await prisma.nDRReport.update({
      where: { id: ndrId },
      data: updateData,
    });

    // If RTO initiated, create RTO shipment record
    if (actionType === "RTO_INITIATED") {
      await createRTOShipment(ndrReport, performedById, performedByName);
    }

    // If reattempt scheduled, update shipment status
    if (actionType === "REATTEMPT_SCHEDULED") {
      await prisma.shipment.update({
        where: { id: ndrReport.shipmentId },
        data: {
          status: "OUT_FOR_DELIVERY",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: action,
    });
  } catch (error) {
    console.error("NDR Action POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to take action on NDR" },
      { status: 500 }
    );
  }
}

// Helper to create RTO shipment
async function createRTOShipment(
  ndrReport: any,
  initiatedById: string,
  initiatedByName?: string
) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: ndrReport.shipmentId },
  });

  if (!shipment) return;

  // Generate RTO number
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const rtoNumber = `RTO${dateStr}${random}`;

  await prisma.rTOShipment.create({
    data: {
      rtoNumber,
      shipmentId: ndrReport.shipmentId,
      awbNumber: ndrReport.awbNumber,
      clientId: ndrReport.clientId,
      ndrReportId: ndrReport.id,
      rtoReason: ndrReport.failureReason,
      rtoRemarks: ndrReport.failureRemarks,
      currentStatus: "INITIATED",
      initiatedAt: new Date(),
      initiatedBy: initiatedById,
      initiatedFromHub: "HUB", // Default, should be passed from context
    },
  });

  // Update shipment status
  await prisma.shipment.update({
    where: { id: ndrReport.shipmentId },
    data: {
      status: "RTO_INITIATED",
    },
  });
}
