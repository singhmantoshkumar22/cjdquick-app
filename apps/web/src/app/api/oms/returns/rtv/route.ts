import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/returns/rtv - Get RTV list with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const rtvNo = searchParams.get("rtvNo") || "";
    const vendorCode = searchParams.get("vendorCode") || "";
    const vendorName = searchParams.get("vendorName") || "";
    const rtvType = searchParams.get("rtvType") || "";
    const status = searchParams.get("status") || "";
    const locationCode = searchParams.get("locationCode") || "";

    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(rtvNo && { rtvNo }),
      ...(vendorCode && { vendorCode }),
      ...(vendorName && { vendorName }),
      ...(rtvType && { rtvType }),
      ...(status && { status }),
      ...(locationCode && { locationCode }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/returns/rtv?${queryParams}`,
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
        data: getDemoRTVData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching RTV data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoRTVData(),
    });
  }
}

// POST /api/oms/returns/rtv - Create new RTV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/returns/rtv`, {
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
        { success: false, error: "Failed to create RTV" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating RTV:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create RTV" },
      { status: 500 }
    );
  }
}

// PUT /api/oms/returns/rtv - Update RTV
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/returns/rtv`, {
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
        { success: false, error: "Failed to update RTV" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating RTV:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update RTV" },
      { status: 500 }
    );
  }
}

function getDemoRTVData() {
  return {
    rtvs: [
      { id: "1", rtvNo: "RTV-2024-001234", vendorCode: "VND-001", vendorName: "ABC Electronics Pvt Ltd", rtvType: "DEFECTIVE", status: "PENDING", totalItems: 5, totalQty: 25, totalValue: 45000, locationCode: "WH-DELHI", createdDate: "2024-01-08 10:30", dispatchDate: "", createdBy: "Rahul Kumar" },
      { id: "2", rtvNo: "RTV-2024-001235", vendorCode: "VND-002", vendorName: "XYZ Traders", rtvType: "EXCESS", status: "APPROVED", totalItems: 3, totalQty: 100, totalValue: 25000, locationCode: "WH-MUMBAI", createdDate: "2024-01-08 09:15", dispatchDate: "", createdBy: "Priya Sharma" },
      { id: "3", rtvNo: "RTV-2024-001236", vendorCode: "VND-003", vendorName: "Metro Distributors", rtvType: "EXPIRY", status: "DISPATCHED", totalItems: 8, totalQty: 200, totalValue: 78000, locationCode: "WH-DELHI", createdDate: "2024-01-07 14:20", dispatchDate: "2024-01-08 11:00", createdBy: "Amit Patel" },
    ],
    summary: {
      pending: 23,
      approved: 45,
      dispatched: 38,
      received: 67,
      closed: 88,
    },
    total: 156,
    page: 1,
    totalPages: 16,
  };
}
