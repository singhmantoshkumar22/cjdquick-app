import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - Get single NDR report details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ndrId: string }> }
) {
  try {
    const { ndrId } = await params;

    const ndrReport = await prisma.nDRReport.findUnique({
      where: { id: ndrId },
      include: {
        callLogs: {
          orderBy: { callTime: "desc" },
        },
        actions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!ndrReport) {
      return NextResponse.json(
        { success: false, error: "NDR report not found" },
        { status: 404 }
      );
    }

    // Get shipment details
    const shipment = await prisma.shipment.findUnique({
      where: { id: ndrReport.shipmentId },
      select: {
        id: true,
        awbNumber: true,
        consigneeName: true,
        consigneePhone: true,
        consigneeAddress: true,
        consigneeCity: true,
        consigneePincode: true,
        clientId: true,
        paymentMode: true,
        codAmount: true,
        actualWeightKg: true,
        serviceType: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...ndrReport,
        shipment,
      },
    });
  } catch (error) {
    console.error("NDR Report GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch NDR report" },
      { status: 500 }
    );
  }
}

// PATCH - Update NDR report status/resolution
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ndrId: string }> }
) {
  try {
    const { ndrId } = await params;
    const body = await request.json();

    const {
      status,
      customerResponse,
      correctedAddress,
      correctedPincode,
      correctedPhone,
      correctedLandmark,
      rescheduledDate,
      preferredTimeSlot,
      priority,
      actionTaken,
      actionDetails,
      updatedById,
      updatedByName,
    } = body;

    const existingNDR = await prisma.nDRReport.findUnique({
      where: { id: ndrId },
    });

    if (!existingNDR) {
      return NextResponse.json(
        { success: false, error: "NDR report not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (status) updateData.status = status;
    if (customerResponse !== undefined) {
      updateData.customerResponse = customerResponse;
      updateData.customerResponseAt = new Date();
    }
    if (correctedAddress !== undefined) updateData.correctedAddress = correctedAddress;
    if (correctedPincode !== undefined) updateData.correctedPincode = correctedPincode;
    if (correctedPhone !== undefined) updateData.correctedPhone = correctedPhone;
    if (correctedLandmark !== undefined) updateData.correctedLandmark = correctedLandmark;
    if (rescheduledDate) {
      updateData.rescheduledDate = new Date(rescheduledDate);
    }
    if (preferredTimeSlot) updateData.preferredTimeSlot = preferredTimeSlot;
    if (priority) updateData.priority = priority;
    if (actionTaken) {
      updateData.actionTaken = actionTaken;
      updateData.actionTakenAt = new Date();
      updateData.actionTakenBy = updatedById;
    }
    if (actionDetails) updateData.actionDetails = actionDetails;

    // Check if resolving
    const resolvingStatuses = ["DELIVERED", "CLOSED"];
    if (status && resolvingStatuses.includes(status)) {
      updateData.isResolved = true;
      updateData.resolvedAt = new Date();
      updateData.resolutionType = status === "DELIVERED" ? "DELIVERED" : "CANCELLED";
    }

    const updatedNDR = await prisma.nDRReport.update({
      where: { id: ndrId },
      data: updateData,
    });

    // Create action record if status changed
    if (status && status !== existingNDR.status) {
      await prisma.nDRAction.create({
        data: {
          ndrReportId: ndrId,
          actionType: "STATUS_UPDATE",
          performedById: updatedById || "SYSTEM",
          performedByName: updatedByName || "System",
          performedByType: "AGENT",
          previousStatus: existingNDR.status,
          newStatus: status,
          remarks: actionDetails || `Status changed from ${existingNDR.status} to ${status}`,
          actionTime: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedNDR,
    });
  } catch (error) {
    console.error("NDR Report PATCH Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update NDR report" },
      { status: 500 }
    );
  }
}
