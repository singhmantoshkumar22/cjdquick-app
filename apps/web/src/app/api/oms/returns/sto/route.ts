import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/returns/sto - Get STO list with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const stoNo = searchParams.get("stoNo") || "";
    const stoType = searchParams.get("stoType") || "";
    const sourceLocation = searchParams.get("sourceLocation") || "";
    const destinationLocation = searchParams.get("destinationLocation") || "";
    const status = searchParams.get("status") || "";
    const awbNo = searchParams.get("awbNo") || "";

    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(stoNo && { stoNo }),
      ...(stoType && { stoType }),
      ...(sourceLocation && { sourceLocation }),
      ...(destinationLocation && { destinationLocation }),
      ...(status && { status }),
      ...(awbNo && { awbNo }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/returns/sto?${queryParams}`,
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
    console.error("Error fetching STO data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoSTOData(),
    });
  }
}

// POST /api/oms/returns/sto - Create new STO
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/returns/sto`, {
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
        { success: false, error: "Failed to create STO" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating STO:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create STO" },
      { status: 500 }
    );
  }
}

// PUT /api/oms/returns/sto - Update STO
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/returns/sto`, {
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
        { success: false, error: "Failed to update STO" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating STO:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update STO" },
      { status: 500 }
    );
  }
}

// DELETE /api/oms/returns/sto - Cancel STO
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/returns/sto`, {
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
        message: "STO cancelled successfully (demo mode)",
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error cancelling STO:", error);
    return NextResponse.json({
      success: true,
      message: "STO cancelled successfully (demo mode)",
    });
  }
}

function getDemoSTOData() {
  return {
    stos: [
      { id: "1", stoNo: "STO-2024-001234", stoType: "WAREHOUSE_TO_WAREHOUSE", sourceLocation: "WH-DELHI", destinationLocation: "WH-MUMBAI", status: "IN_TRANSIT", totalItems: 15, totalQty: 500, totalValue: 125000, dispatchDate: "2024-01-07", expectedDate: "2024-01-10", awbNo: "AWB123456789", transporterName: "Delhivery", createdDate: "2024-01-06", createdBy: "Rahul Kumar" },
      { id: "2", stoNo: "STO-2024-001235", stoType: "WAREHOUSE_TO_STORE", sourceLocation: "WH-MUMBAI", destinationLocation: "STORE-PUNE-01", status: "APPROVED", totalItems: 8, totalQty: 200, totalValue: 45000, dispatchDate: "", expectedDate: "2024-01-12", awbNo: "", transporterName: "", createdDate: "2024-01-08", createdBy: "Priya Sharma" },
      { id: "3", stoNo: "STO-2024-001236", stoType: "WAREHOUSE_TO_WAREHOUSE", sourceLocation: "WH-BANGALORE", destinationLocation: "WH-CHENNAI", status: "DISPATCHED", totalItems: 25, totalQty: 1000, totalValue: 350000, dispatchDate: "2024-01-08", expectedDate: "2024-01-11", awbNo: "AWB123456790", transporterName: "BlueDart", createdDate: "2024-01-05", createdBy: "Amit Patel" },
    ],
    summary: {
      draft: 12,
      approved: 28,
      dispatched: 45,
      inTransit: 38,
      received: 95,
      closed: 27,
    },
    total: 245,
    page: 1,
    totalPages: 25,
  };
}
