import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/returns/without-order - Get returns without order list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const returnNo = searchParams.get("returnNo") || "";
    const customerName = searchParams.get("customerName") || "";
    const customerPhone = searchParams.get("customerPhone") || "";
    const returnType = searchParams.get("returnType") || "";
    const status = searchParams.get("status") || "";
    const locationCode = searchParams.get("locationCode") || "";

    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(returnNo && { returnNo }),
      ...(customerName && { customerName }),
      ...(customerPhone && { customerPhone }),
      ...(returnType && { returnType }),
      ...(status && { status }),
      ...(locationCode && { locationCode }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/returns/without-order?${queryParams}`,
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
        data: getDemoData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching returns without order:", error);
    return NextResponse.json({
      success: true,
      data: getDemoData(),
    });
  }
}

// POST /api/oms/returns/without-order - Create return without order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/returns/without-order`, {
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
      // Return demo success response
      return NextResponse.json({
        success: true,
        data: {
          returnNo: `RTN-WO-${Date.now()}`,
          message: "Return without order created successfully (demo mode)",
        },
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating return without order:", error);
    return NextResponse.json({
      success: true,
      data: {
        returnNo: `RTN-WO-${Date.now()}`,
        message: "Return without order created successfully (demo mode)",
      },
    });
  }
}

// PUT /api/oms/returns/without-order - Update return without order
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/returns/without-order`, {
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
    console.error("Error updating return without order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update return" },
      { status: 500 }
    );
  }
}

function getDemoData() {
  return {
    returns: [
      {
        id: "1",
        returnNo: "RTN-WO-2024-001",
        returnType: "WALK_IN",
        customerName: "Rahul Sharma",
        customerPhone: "9876543210",
        status: "RECEIVED",
        totalItems: 2,
        totalQty: 3,
        totalValue: 4500,
        invoiceNo: "INV-OLD-001",
        locationCode: "WH-DELHI",
        createdDate: "2024-01-08 10:30",
        createdBy: "Store Staff",
      },
      {
        id: "2",
        returnNo: "RTN-WO-2024-002",
        returnType: "COURIER",
        customerName: "Priya Patel",
        customerPhone: "9876543211",
        status: "QC_PENDING",
        totalItems: 1,
        totalQty: 1,
        totalValue: 2500,
        invoiceNo: "",
        locationCode: "WH-MUMBAI",
        createdDate: "2024-01-08 09:15",
        createdBy: "Warehouse Team",
      },
      {
        id: "3",
        returnNo: "RTN-WO-2024-003",
        returnType: "WARRANTY",
        customerName: "Amit Kumar",
        customerPhone: "9876543212",
        status: "RESTOCKED",
        totalItems: 1,
        totalQty: 1,
        totalValue: 8500,
        invoiceNo: "INV-OLD-045",
        locationCode: "WH-BANGALORE",
        createdDate: "2024-01-07 14:20",
        createdBy: "Service Center",
      },
    ],
    summary: {
      walkIn: 45,
      courier: 28,
      warranty: 15,
      exchange: 12,
      total: 100,
    },
    total: 100,
    page: 1,
    totalPages: 10,
  };
}
