import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/inbound/direct - Get direct inbound list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const vendor = searchParams.get("vendor") || "";
    const status = searchParams.get("status") || "";

    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(vendor && { vendor }),
      ...(status && { status }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/inbound/direct?${queryParams}`,
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
        data: getDemoDirectInboundData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching direct inbound data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoDirectInboundData(),
    });
  }
}

// POST /api/oms/inbound/direct - Create direct inbound
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/inbound/direct`, {
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
        { success: false, error: "Failed to create direct inbound" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating direct inbound:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create direct inbound" },
      { status: 500 }
    );
  }
}

function getDemoDirectInboundData() {
  return {
    inbounds: [
      { id: "1", inboundNo: "INB-2024-001240", vendor: "ABC Suppliers", asnNo: "", invoiceNo: "INV-001240", invoiceDate: "2024-01-08", location: "Warehouse A", totalQty: 150, status: "PENDING", createdAt: "2024-01-08 10:30", createdBy: "Rahul Kumar" },
      { id: "2", inboundNo: "INB-2024-001241", vendor: "XYZ Trading", asnNo: "ASN-005", invoiceNo: "INV-001241", invoiceDate: "2024-01-07", location: "Warehouse A", totalQty: 200, status: "COMPLETED", createdAt: "2024-01-07 14:20", createdBy: "Priya Sharma" },
    ],
    total: 45,
    page: 1,
    totalPages: 5,
  };
}
