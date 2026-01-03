import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - Get POD details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ podId: string }> }
) {
  try {
    const { podId } = await params;

    const pod = await prisma.pODCapture.findUnique({
      where: { id: podId },
    });

    if (!pod) {
      return NextResponse.json(
        { success: false, error: "POD not found" },
        { status: 404 }
      );
    }

    // Get shipment details
    const shipment = await prisma.shipment.findUnique({
      where: { id: pod.shipmentId },
      select: {
        id: true,
        awbNumber: true,
        status: true,
        consigneeName: true,
        consigneePhone: true,
        consigneeAddress: true,
        consigneePincode: true,
        consigneeCity: true,
        deliveredAt: true,
      },
    });

    // Get client
    const client = await prisma.client.findUnique({
      where: { id: pod.clientId },
      select: { id: true, companyName: true },
    });

    // Get audit trail
    const audits = await prisma.pODAudit.findMany({
      where: { podCaptureId: podId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: {
        pod: {
          ...pod,
          qualityFlags: pod.qualityFlags ? JSON.parse(pod.qualityFlags) : [],
        },
        shipment,
        client,
        audits,
      },
    });
  } catch (error) {
    console.error("POD Get Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch POD" },
      { status: 500 }
    );
  }
}

// PATCH - Update POD (limited fields)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ podId: string }> }
) {
  try {
    const { podId } = await params;
    const body = await request.json();

    const pod = await prisma.pODCapture.findUnique({
      where: { id: podId },
    });

    if (!pod) {
      return NextResponse.json(
        { success: false, error: "POD not found" },
        { status: 404 }
      );
    }

    // Only allow updating certain fields
    const allowedUpdates: any = {};

    if (body.deliveryNotes !== undefined) {
      allowedUpdates.deliveryNotes = body.deliveryNotes;
    }
    if (body.customerFeedback !== undefined) {
      allowedUpdates.customerFeedback = body.customerFeedback;
    }
    // Allow adding photos if missing
    if (body.deliveryPhotoUrl && !pod.deliveryPhotoUrl) {
      allowedUpdates.deliveryPhotoUrl = body.deliveryPhotoUrl;
    }
    if (body.signatureUrl && !pod.signatureUrl) {
      allowedUpdates.signatureUrl = body.signatureUrl;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid updates provided" },
        { status: 400 }
      );
    }

    const updatedPod = await prisma.pODCapture.update({
      where: { id: podId },
      data: allowedUpdates,
    });

    // Create audit
    await prisma.pODAudit.create({
      data: {
        podCaptureId: podId,
        action: "UPDATED",
        performedById: body.performedById || "SYSTEM",
        performedByName: body.performedByName || "System",
        details: JSON.stringify(allowedUpdates),
      },
    });

    return NextResponse.json({
      success: true,
      data: { pod: updatedPod },
    });
  } catch (error) {
    console.error("POD Update Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update POD" },
      { status: 500 }
    );
  }
}
