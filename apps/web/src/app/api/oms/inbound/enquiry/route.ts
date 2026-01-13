import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/inbound/enquiry - Get inbound list with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const inboundNo = searchParams.get("inboundNo") || "";
    const stoNo = searchParams.get("stoNo") || "";
    const asnNo = searchParams.get("asnNo") || "";
    const poNo = searchParams.get("poNo") || "";
    const grnNo = searchParams.get("grnNo") || "";
    const inboundType = searchParams.get("inboundType") || "";
    const status = searchParams.get("status") || "";
    const vendor = searchParams.get("vendor") || "";
    const location = searchParams.get("location") || "";

    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(inboundNo && { inboundNo }),
      ...(stoNo && { stoNo }),
      ...(asnNo && { asnNo }),
      ...(poNo && { poNo }),
      ...(grnNo && { grnNo }),
      ...(inboundType && { inboundType }),
      ...(status && { status }),
      ...(vendor && { vendor }),
      ...(location && { location }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/inbound/enquiry?${queryParams}`,
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
        data: getDemoInboundData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching inbound data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoInboundData(),
    });
  }
}

// POST /api/oms/inbound/enquiry - Create inbound
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/inbound`, {
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
        { success: false, error: "Failed to create inbound" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating inbound:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create inbound" },
      { status: 500 }
    );
  }
}

function getDemoInboundData() {
  return {
    inbounds: [
      { id: "1", inboundNo: "INB-2024-001234", stoNo: "STO-001", asnNo: "ASN-001", poNo: "PO-2024-001", grnNo: "GRN-001", grnDate: "2024-01-08", inboundType: "WITH_ASN", invoiceNo: "INV-001234", vendor: "ABC Suppliers", status: "COMPLETED", inboundLocation: "Warehouse A", totalQty: 100, receivedQty: 100, createdAt: "2024-01-08 10:30", createdBy: "Rahul Kumar" },
      { id: "2", inboundNo: "INB-2024-001235", stoNo: "", asnNo: "", poNo: "PO-2024-002", grnNo: "GRN-002", grnDate: "2024-01-08", inboundType: "WITH_PO", invoiceNo: "INV-001235", vendor: "XYZ Trading", status: "IN_PROGRESS", inboundLocation: "Warehouse A", totalQty: 250, receivedQty: 150, createdAt: "2024-01-08 09:15", createdBy: "Priya Sharma" },
      { id: "3", inboundNo: "INB-2024-001236", stoNo: "STO-002", asnNo: "", poNo: "", grnNo: "GRN-003", grnDate: "2024-01-07", inboundType: "STO", invoiceNo: "", vendor: "Internal Transfer", status: "COMPLETED", inboundLocation: "Warehouse B", totalQty: 500, receivedQty: 500, createdAt: "2024-01-07 14:20", createdBy: "Amit Patel" },
      { id: "4", inboundNo: "INB-2024-001237", stoNo: "", asnNo: "", poNo: "", grnNo: "GRN-004", grnDate: "2024-01-08", inboundType: "DIRECT", invoiceNo: "INV-001237", vendor: "Quick Supplies", status: "PENDING", inboundLocation: "Warehouse A", totalQty: 75, receivedQty: 0, createdAt: "2024-01-08 11:45", createdBy: "Sneha Gupta" },
      { id: "5", inboundNo: "INB-2024-001238", stoNo: "", asnNo: "", poNo: "", grnNo: "GRN-005", grnDate: "2024-01-07", inboundType: "RETURN", invoiceNo: "", vendor: "Customer Return", status: "IN_PROGRESS", inboundLocation: "Warehouse A", totalQty: 25, receivedQty: 15, createdAt: "2024-01-07 16:30", createdBy: "Vikram Singh" },
    ],
    total: 156,
    page: 1,
    totalPages: 16,
  };
}
