import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import { assignAwb, bulkAssignAwbs } from "@/lib/unified-tms-service";

// POST: Assign AWB to order
export async function POST(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, awbNumber, trackingUrl, labelUrl } = body;

    if (!orderId || !awbNumber) {
      return NextResponse.json(
        { success: false, error: "orderId and awbNumber are required" },
        { status: 400 }
      );
    }

    const order = await assignAwb({
      orderId,
      awbNumber,
      trackingUrl,
      labelUrl,
    });

    return NextResponse.json({
      success: true,
      data: order,
      message: `AWB ${awbNumber} assigned`,
    });
  } catch (error: any) {
    console.error("Assign AWB error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to assign AWB" },
      { status: 400 }
    );
  }
}

// PUT: Bulk assign AWBs
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { assignments } = body;

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { success: false, error: "assignments array is required" },
        { status: 400 }
      );
    }

    // Validate each assignment
    for (const assignment of assignments) {
      if (!assignment.orderId || !assignment.awbNumber) {
        return NextResponse.json(
          { success: false, error: "Each assignment requires orderId and awbNumber" },
          { status: 400 }
        );
      }
    }

    const result = await bulkAssignAwbs(assignments);

    return NextResponse.json({
      success: result.success,
      data: result,
      message: `${result.assigned} AWBs assigned, ${result.failed} failed`,
    });
  } catch (error: any) {
    console.error("Bulk assign AWB error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to assign AWBs" },
      { status: 500 }
    );
  }
}
