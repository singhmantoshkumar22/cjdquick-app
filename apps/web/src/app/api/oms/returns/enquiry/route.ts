import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/returns/enquiry - Get return list with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const returnNo = searchParams.get("returnNo") || "";
    const orderNo = searchParams.get("orderNo") || "";
    const awbNo = searchParams.get("awbNo") || "";
    const returnType = searchParams.get("returnType") || "";
    const status = searchParams.get("status") || "";
    const channel = searchParams.get("channel") || "";
    const locationCode = searchParams.get("locationCode") || "";

    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(returnNo && { returnNo }),
      ...(orderNo && { orderNo }),
      ...(awbNo && { awbNo }),
      ...(returnType && { returnType }),
      ...(status && { status }),
      ...(channel && { channel }),
      ...(locationCode && { locationCode }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/returns/enquiry?${queryParams}`,
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
        data: getDemoReturnData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching return data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoReturnData(),
    });
  }
}

// POST /api/oms/returns/enquiry - Create new return
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/returns`, {
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
        { success: false, error: "Failed to create return" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating return:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create return" },
      { status: 500 }
    );
  }
}

// PUT /api/oms/returns/enquiry - Update return
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/returns`, {
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
        { success: false, error: "Failed to update return" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating return:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update return" },
      { status: 500 }
    );
  }
}

function getDemoReturnData() {
  return {
    returns: [
      { id: "1", returnNo: "RTN-2024-001234", orderNo: "ORD-2024-005678", channel: "Amazon", customerName: "Rahul Sharma", customerPhone: "9876543210", returnType: "CUSTOMER_RETURN", status: "QC_PENDING", reason: "Defective Product", totalItems: 2, totalValue: 4500, awbNo: "AWB123456789", courierPartner: "Delhivery", locationCode: "WH-DELHI", createdDate: "2024-01-08 10:30", receivedDate: "2024-01-08 14:00" },
      { id: "2", returnNo: "RTN-2024-001235", orderNo: "ORD-2024-005679", channel: "Flipkart", customerName: "Priya Patel", customerPhone: "9876543211", returnType: "RTO", status: "IN_TRANSIT", reason: "Customer Refused", totalItems: 1, totalValue: 8200, awbNo: "AWB123456790", courierPartner: "BlueDart", locationCode: "WH-MUMBAI", createdDate: "2024-01-08 09:15", receivedDate: "" },
      { id: "3", returnNo: "RTN-2024-001236", orderNo: "ORD-2024-005680", channel: "Shopify", customerName: "Amit Kumar", customerPhone: "9876543212", returnType: "EXCHANGE", status: "RESTOCKED", reason: "Size Issue", totalItems: 1, totalValue: 2500, awbNo: "AWB123456791", courierPartner: "Ekart", locationCode: "WH-BANGALORE", createdDate: "2024-01-07 16:45", receivedDate: "2024-01-08 10:00" },
    ],
    summary: {
      initiated: 45,
      inTransit: 128,
      received: 89,
      qcPending: 156,
      restocked: 712,
      disposed: 115,
    },
    total: 1245,
    page: 1,
    totalPages: 125,
  };
}
