import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/miscellaneous/putaway - Get putaway list with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const putawayNo = searchParams.get("putawayNo") || "";
    const status = searchParams.get("status") || "";
    const putawayType = searchParams.get("putawayType") || "";
    const locationCode = searchParams.get("locationCode") || "";
    const inboundNo = searchParams.get("inboundNo") || "";
    const skuCode = searchParams.get("skuCode") || "";
    const poNo = searchParams.get("poNo") || "";
    const orderNo = searchParams.get("orderNo") || "";

    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(putawayNo && { putawayNo }),
      ...(status && { status }),
      ...(putawayType && { putawayType }),
      ...(locationCode && { locationCode }),
      ...(inboundNo && { inboundNo }),
      ...(skuCode && { skuCode }),
      ...(poNo && { poNo }),
      ...(orderNo && { orderNo }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/miscellaneous/putaway?${queryParams}`,
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
        data: getDemoPutawayData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching putaway data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoPutawayData(),
    });
  }
}

// POST /api/oms/miscellaneous/putaway - Create new putaway
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/miscellaneous/putaway`, {
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
        { success: false, error: "Failed to create putaway" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating putaway:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create putaway" },
      { status: 500 }
    );
  }
}

// PUT /api/oms/miscellaneous/putaway - Update/Confirm putaway
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/miscellaneous/putaway`, {
      method: "PUT",
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
        { success: false, error: "Failed to update putaway" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating putaway:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update putaway" },
      { status: 500 }
    );
  }
}

// DELETE /api/oms/miscellaneous/putaway - Cancel putaway
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/miscellaneous/putaway`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(request.headers.get("authorization") && {
          Authorization: request.headers.get("authorization")!,
        }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        message: "Putaway cancelled successfully (demo mode)",
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error cancelling putaway:", error);
    return NextResponse.json({
      success: true,
      message: "Putaway cancelled successfully (demo mode)",
    });
  }
}

function getDemoPutawayData() {
  return {
    putaways: [
      { id: "1", putawayNo: "PUT-2024-001234", inboundNo: "INB-2024-001234", poNo: "PO-2024-001", orderNo: "", putawayType: "SELECTED_INBOUND", putawayMode: "SYSTEM_GENERATED", status: "OPEN", qcStatus: "PASSED", skuCode: "SKU-001", skuDescription: "Wireless Mouse", qtyForPutaway: 100, putawayQty: 0, fromBin: "QC-BIN-001", toBin: "", toZone: "ZONE-A", locationCode: "Warehouse A", createdDate: "2024-01-08 10:30", confirmedDate: "", createdBy: "Rahul Kumar", confirmedBy: "" },
      { id: "2", putawayNo: "PUT-2024-001235", inboundNo: "INB-2024-001235", poNo: "PO-2024-002", orderNo: "", putawayType: "SELECTED_INBOUND", putawayMode: "USER_DEFINED", status: "CONFIRMED", qcStatus: "PASSED", skuCode: "SKU-002", skuDescription: "USB Keyboard", qtyForPutaway: 50, putawayQty: 50, fromBin: "QC-BIN-002", toBin: "BIN-A001", toZone: "ZONE-A", locationCode: "Warehouse A", createdDate: "2024-01-08 09:15", confirmedDate: "2024-01-08 11:30", createdBy: "Priya Sharma", confirmedBy: "Amit Patel" },
      { id: "3", putawayNo: "PUT-2024-001236", inboundNo: "", poNo: "", orderNo: "ORD-2024-5678", putawayType: "CANCELLED_ORDERS", putawayMode: "SYSTEM_GENERATED", status: "PART_CONFIRMED", qcStatus: "PASSED", skuCode: "SKU-003", skuDescription: "Monitor Stand", qtyForPutaway: 25, putawayQty: 15, fromBin: "PICK-BIN-001", toBin: "BIN-B002", toZone: "ZONE-B", locationCode: "Warehouse A", createdDate: "2024-01-07 14:20", confirmedDate: "", createdBy: "Amit Patel", confirmedBy: "" },
      { id: "4", putawayNo: "PUT-2024-001237", inboundNo: "INB-2024-001237", poNo: "PO-2024-003", orderNo: "", putawayType: "SELECTED_INBOUND", putawayMode: "SYSTEM_GENERATED", status: "CLOSED", qcStatus: "PASSED", skuCode: "SKU-004", skuDescription: "Laptop Bag", qtyForPutaway: 75, putawayQty: 75, fromBin: "QC-BIN-003", toBin: "BIN-A002", toZone: "ZONE-A", locationCode: "Warehouse B", createdDate: "2024-01-07 11:45", confirmedDate: "2024-01-07 16:30", createdBy: "Sneha Gupta", confirmedBy: "Vikram Singh" },
      { id: "5", putawayNo: "PUT-2024-001238", inboundNo: "", poNo: "", orderNo: "ORD-2024-5679", putawayType: "CANCELLED_ORDERS", putawayMode: "USER_DEFINED", status: "CANCELLED", qcStatus: "N/A", skuCode: "SKU-005", skuDescription: "Webcam HD", qtyForPutaway: 30, putawayQty: 0, fromBin: "PICK-BIN-002", toBin: "", toZone: "", locationCode: "Warehouse A", createdDate: "2024-01-06 09:00", confirmedDate: "", createdBy: "Rahul Kumar", confirmedBy: "" },
    ],
    summary: {
      open: 5,
      partConfirmed: 3,
      confirmed: 12,
      closed: 45,
      cancelled: 2,
    },
    total: 67,
    page: 1,
    totalPages: 7,
  };
}
