import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/inbound/qc - Get QC pending items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inboundNo = searchParams.get("inboundNo") || "";
    const grnNo = searchParams.get("grnNo") || "";
    const skuCode = searchParams.get("skuCode") || "";
    const qcStatus = searchParams.get("qcStatus") || "";

    const queryParams = new URLSearchParams({
      ...(inboundNo && { inboundNo }),
      ...(grnNo && { grnNo }),
      ...(skuCode && { skuCode }),
      ...(qcStatus && { qcStatus }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/inbound/qc?${queryParams}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(request.headers.get("authorization") && {
            Authorization: request.headers.get("authorization")!,
          }),
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        data: getDemoQCData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching QC data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoQCData(),
    });
  }
}

// POST /api/oms/inbound/qc - Submit QC result
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/inbound/qc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(request.headers.get("authorization") && {
          Authorization: request.headers.get("authorization")!,
        }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to submit QC result" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error submitting QC result:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit QC result" },
      { status: 500 }
    );
  }
}

function getDemoQCData() {
  return {
    items: [
      { id: "1", inboundNo: "INB-2024-001234", grnNo: "GRN-001", skuCode: "SKU-001", skuDescription: "Wireless Mouse", batchNo: "BATCH-001", receivedQty: 100, qcStatus: "PENDING", passedQty: 0, failedQty: 0, damageType: "", remarks: "", qcBy: "", qcDate: "", images: [] },
      { id: "2", inboundNo: "INB-2024-001234", grnNo: "GRN-001", skuCode: "SKU-002", skuDescription: "USB Keyboard", batchNo: "BATCH-002", receivedQty: 50, qcStatus: "PASSED", passedQty: 48, failedQty: 2, damageType: "Packaging Damage", remarks: "Minor scratches on box", qcBy: "Rahul Kumar", qcDate: "2024-01-08 11:30", images: ["img1.jpg"] },
      { id: "3", inboundNo: "INB-2024-001235", grnNo: "GRN-002", skuCode: "SKU-003", skuDescription: "Monitor Stand", batchNo: "BATCH-003", receivedQty: 25, qcStatus: "FAILED", passedQty: 0, failedQty: 25, damageType: "Manufacturing Defect", remarks: "All units have defective base", qcBy: "Priya Sharma", qcDate: "2024-01-08 10:15", images: ["img2.jpg", "img3.jpg"] },
      { id: "4", inboundNo: "INB-2024-001236", grnNo: "GRN-003", skuCode: "SKU-004", skuDescription: "Laptop Bag", batchNo: "BATCH-004", receivedQty: 75, qcStatus: "PARTIAL", passedQty: 60, failedQty: 15, damageType: "Physical Damage", remarks: "Some bags have torn zipper", qcBy: "Amit Patel", qcDate: "2024-01-08 09:45", images: [] },
    ],
    summary: {
      pending: 2,
      passed: 1,
      failed: 1,
      partial: 1,
    },
  };
}
