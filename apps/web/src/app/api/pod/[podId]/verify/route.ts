import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// POST - Verify or reject POD
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ podId: string }> }
) {
  try {
    const { podId } = await params;
    const body = await request.json();

    const { action, verifiedById, verifiedByName, remarks } = body;

    if (!action || !["VERIFY", "REJECT"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Use VERIFY or REJECT" },
        { status: 400 }
      );
    }

    if (!verifiedById || !verifiedByName) {
      return NextResponse.json(
        { success: false, error: "Verifier details required" },
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

    if (pod.verificationStatus === "VERIFIED") {
      return NextResponse.json(
        { success: false, error: "POD is already verified" },
        { status: 400 }
      );
    }

    const newStatus = action === "VERIFY" ? "VERIFIED" : "REJECTED";
    const previousStatus = pod.verificationStatus;

    const updatedPod = await prisma.pODCapture.update({
      where: { id: podId },
      data: {
        verificationStatus: newStatus,
        verifiedAt: new Date(),
        verifiedBy: verifiedById,
      },
    });

    // Create audit trail
    await prisma.pODAudit.create({
      data: {
        podCaptureId: podId,
        action: action === "VERIFY" ? "VERIFIED" : "REJECTED",
        previousStatus,
        newStatus,
        performedById: verifiedById,
        performedByName: verifiedByName,
        remarks,
      },
    });

    return NextResponse.json({
      success: true,
      data: { pod: updatedPod },
      message: `POD ${action === "VERIFY" ? "verified" : "rejected"} successfully`,
    });
  } catch (error) {
    console.error("POD Verify Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify POD" },
      { status: 500 }
    );
  }
}
