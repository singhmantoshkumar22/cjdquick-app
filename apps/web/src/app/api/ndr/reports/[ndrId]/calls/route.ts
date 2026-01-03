import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - Get call logs for NDR
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ndrId: string }> }
) {
  try {
    const { ndrId } = await params;

    const callLogs = await prisma.nDRCallLog.findMany({
      where: { ndrReportId: ndrId },
      orderBy: { callTime: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: callLogs,
    });
  } catch (error) {
    console.error("NDR Call Logs GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch call logs" },
      { status: 500 }
    );
  }
}

// POST - Log a customer call/contact
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ndrId: string }> }
) {
  try {
    const { ndrId } = await params;
    const body = await request.json();

    const {
      callType, // OUTBOUND, INBOUND, SMS, WHATSAPP, IVR
      contactNumber,
      contactName,
      callStatus, // CONNECTED, NO_ANSWER, BUSY, SWITCHED_OFF, WRONG_NUMBER
      callDuration,
      callOutcome, // REATTEMPT_REQUESTED, ADDRESS_UPDATED, RESCHEDULED, CANCEL_REQUESTED, NO_ACTION
      customerResponse,
      newAddress,
      newPhone,
      preferredDate,
      preferredSlot,
      calledById,
      calledByName,
      calledByType,
      remarks,
    } = body;

    // Validate required fields
    if (!callType || !callStatus || !contactNumber) {
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

    // Create call log
    const callLog = await prisma.nDRCallLog.create({
      data: {
        ndrReportId: ndrId,
        callType,
        callTime: new Date(),
        callDuration: callDuration || 0,
        calledById: calledById || "SYSTEM",
        calledByName: calledByName || "System",
        calledByType: calledByType || "AGENT",
        contactNumber,
        contactName,
        callStatus,
        callOutcome,
        customerResponse,
        newAddress,
        newPhone,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        preferredSlot,
        remarks,
      },
    });

    // Update NDR report based on call outcome
    const updateData: any = {
      customerContacted: true,
    };

    if (callStatus === "CONNECTED") {
      updateData.status = "CUSTOMER_CONTACTED";
      updateData.customerResponseAt = new Date();

      if (customerResponse) {
        updateData.customerResponse = customerResponse;
      }

      if (newAddress) {
        updateData.correctedAddress = newAddress;
      }

      if (newPhone) {
        updateData.correctedPhone = newPhone;
      }

      if (preferredDate) {
        updateData.rescheduledDate = new Date(preferredDate);
        updateData.status = "REATTEMPT_SCHEDULED";
      }

      if (preferredSlot) {
        updateData.preferredTimeSlot = preferredSlot;
      }

      if (callOutcome === "CANCEL_REQUESTED") {
        updateData.status = "RTO_INITIATED";
      }
    }

    await prisma.nDRReport.update({
      where: { id: ndrId },
      data: updateData,
    });

    // Create action record for successful contact
    if (callStatus === "CONNECTED") {
      await prisma.nDRAction.create({
        data: {
          ndrReportId: ndrId,
          actionType: "CUSTOMER_CONTACTED",
          performedById: calledById || "SYSTEM",
          performedByName: calledByName || "System",
          performedByType: calledByType || "AGENT",
          previousStatus: ndrReport.status,
          newStatus: updateData.status || "CUSTOMER_CONTACTED",
          remarks: `Customer contacted via ${callType}. Outcome: ${callOutcome || "N/A"}`,
          actionTime: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: callLog,
    });
  } catch (error) {
    console.error("NDR Call Log POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to log call" },
      { status: 500 }
    );
  }
}
