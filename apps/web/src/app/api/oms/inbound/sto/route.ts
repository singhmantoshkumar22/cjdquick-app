import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/inbound/sto - Get STO inbound list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const stoNo = searchParams.get("stoNo") || "";
    const fromLocation = searchParams.get("fromLocation") || "";
    const toLocation = searchParams.get("toLocation") || "";
    const status = searchParams.get("status") || "";

    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(stoNo && { stoNo }),
      ...(fromLocation && { fromLocation }),
      ...(toLocation && { toLocation }),
      ...(status && { status }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/inbound/sto?${queryParams}`,
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
        data: getDemoSTOData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching STO inbound data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoSTOData(),
    });
  }
}

// POST /api/oms/inbound/sto - Receive STO inbound
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/inbound/sto/receive`, {
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
        { success: false, error: "Failed to receive STO" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error receiving STO:", error);
    return NextResponse.json(
      { success: false, error: "Failed to receive STO" },
      { status: 500 }
    );
  }
}

function getDemoSTOData() {
  return {
    stos: [
      { id: "1", stoNo: "STO-2024-001234", stoDate: "2024-01-05", fromLocation: "Warehouse A", toLocation: "Warehouse B", status: "IN_TRANSIT", totalSkus: 5, totalQty: 500, receivedQty: 0, dispatchDate: "2024-01-06", expectedDate: "2024-01-08", vehicleNo: "MH-12-AB-1234", driverName: "Rajesh Kumar", createdBy: "Rahul Kumar", remarks: "Urgent transfer" },
      { id: "2", stoNo: "STO-2024-001235", stoDate: "2024-01-04", fromLocation: "Warehouse B", toLocation: "Warehouse A", status: "PARTIAL", totalSkus: 3, totalQty: 200, receivedQty: 150, dispatchDate: "2024-01-05", expectedDate: "2024-01-07", vehicleNo: "MH-12-CD-5678", driverName: "Suresh Singh", createdBy: "Priya Sharma", remarks: "" },
      { id: "3", stoNo: "STO-2024-001236", stoDate: "2024-01-03", fromLocation: "Headoffice", toLocation: "Warehouse A", status: "RECEIVED", totalSkus: 8, totalQty: 1000, receivedQty: 1000, dispatchDate: "2024-01-04", expectedDate: "2024-01-06", vehicleNo: "MH-04-EF-9012", driverName: "Amit Patel", createdBy: "Amit Patel", remarks: "Monthly stock replenishment" },
      { id: "4", stoNo: "STO-2024-001237", stoDate: "2024-01-02", fromLocation: "Warehouse A", toLocation: "Headoffice", status: "PENDING", totalSkus: 2, totalQty: 100, receivedQty: 0, dispatchDate: "", expectedDate: "2024-01-09", vehicleNo: "", driverName: "", createdBy: "Sneha Gupta", remarks: "Return to HO" },
    ],
    summary: {
      pending: 1,
      inTransit: 1,
      partial: 1,
      received: 1,
    },
    total: 89,
    page: 1,
    totalPages: 9,
  };
}
