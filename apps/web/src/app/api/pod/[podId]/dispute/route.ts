import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// POST - Raise or resolve a dispute
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ podId: string }> }
) {
  try {
    const { podId } = await params;
    const body = await request.json();

    const { action, reason, resolution, raisedById, raisedByName, remarks } = body;

    if (!action || !["RAISE", "RESOLVE"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Use RAISE or RESOLVE" },
        { status: 400 }
      );
    }

    const pod = await prisma.pODCapture.findUnique({
      where: { id: podId },
    });

    if (!pod) {
      return NextResponse.json(
        { success: false, error: "POD not found" },
        { status: 404 }
      );
    }

    if (action === "RAISE") {
      if (!reason) {
        return NextResponse.json(
          { success: false, error: "Dispute reason required" },
          { status: 400 }
        );
      }

      if (pod.isDisputed) {
        return NextResponse.json(
          { success: false, error: "POD is already disputed" },
          { status: 400 }
        );
      }

      const previousStatus = pod.verificationStatus;

      const updatedPod = await prisma.pODCapture.update({
        where: { id: podId },
        data: {
          isDisputed: true,
          disputeReason: reason,
          disputeRaisedAt: new Date(),
          disputeRaisedBy: raisedById,
          verificationStatus: "DISPUTED",
        },
      });

      // Create audit trail
      await prisma.pODAudit.create({
        data: {
          podCaptureId: podId,
          action: "DISPUTED",
          previousStatus,
          newStatus: "DISPUTED",
          performedById: raisedById,
          performedByName: raisedByName || "Unknown",
          details: JSON.stringify({ reason }),
          remarks,
        },
      });

      return NextResponse.json({
        success: true,
        data: { pod: updatedPod },
        message: "Dispute raised successfully",
      });
    } else {
      // RESOLVE dispute
      if (!resolution) {
        return NextResponse.json(
          { success: false, error: "Resolution required" },
          { status: 400 }
        );
      }

      if (!pod.isDisputed) {
        return NextResponse.json(
          { success: false, error: "POD is not disputed" },
          { status: 400 }
        );
      }

      const previousStatus = pod.verificationStatus;
      const newStatus = resolution === "VALID" ? "VERIFIED" : "REJECTED";

      const updatedPod = await prisma.pODCapture.update({
        where: { id: podId },
        data: {
          isDisputed: false,
          disputeResolvedAt: new Date(),
          disputeResolution: resolution,
          verificationStatus: newStatus,
          verifiedAt: new Date(),
          verifiedBy: raisedById,
        },
      });

      // Create audit trail
      await prisma.pODAudit.create({
        data: {
          podCaptureId: podId,
          action: "RESOLVED",
          previousStatus,
          newStatus,
          performedById: raisedById,
          performedByName: raisedByName || "Unknown",
          details: JSON.stringify({ resolution }),
          remarks,
        },
      });

      return NextResponse.json({
        success: true,
        data: { pod: updatedPod },
        message: "Dispute resolved successfully",
      });
    }
  } catch (error) {
    console.error("POD Dispute Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process dispute" },
      { status: 500 }
    );
  }
}
