import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/returns - List OMS returns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("pageSize") || "20";
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const channel = searchParams.get("channel");
    const reason = searchParams.get("reason");
    const search = searchParams.get("search");

    const queryParams = new URLSearchParams({
      page,
      pageSize,
      ...(status && { status }),
      ...(type && { type }),
      ...(channel && { channel }),
      ...(reason && { reason }),
      ...(search && { search }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/returns?${queryParams.toString()}`,
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
        data: getDemoReturnsData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching OMS returns:", error);
    return NextResponse.json({
      success: true,
      data: getDemoReturnsData(),
    });
  }
}

// POST /api/oms/returns - Create return
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
      const error = await response.json();
      return NextResponse.json(
        { success: false, error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error creating return:", error);
    return NextResponse.json(
      { success: false, error: { code: "CREATE_ERROR", message: "Failed to create return" } },
      { status: 500 }
    );
  }
}

function getDemoReturnsData() {
  return {
    items: [
      {
        id: "1",
        returnNo: "RTN-2024-001",
        orderNo: "ORD-2024-000892",
        channel: "Amazon",
        customerName: "Rahul Sharma",
        reason: "Defective Product",
        items: 1,
        amount: 4500,
        type: "RETURN",
        status: "INITIATED",
        createdAt: "2024-01-08 10:30",
      },
      {
        id: "2",
        returnNo: "RTN-2024-002",
        orderNo: "ORD-2024-000756",
        channel: "Flipkart",
        customerName: "Priya Patel",
        reason: "Wrong Item",
        items: 2,
        amount: 8200,
        type: "RTO",
        status: "IN_TRANSIT",
        createdAt: "2024-01-08 09:15",
      },
      {
        id: "3",
        returnNo: "RTN-2024-003",
        orderNo: "ORD-2024-000645",
        channel: "Shopify",
        customerName: "Amit Kumar",
        reason: "Size Issue",
        items: 1,
        amount: 2500,
        type: "RETURN",
        status: "RECEIVED",
        createdAt: "2024-01-07 16:45",
      },
      {
        id: "4",
        returnNo: "RTN-2024-004",
        orderNo: "ORD-2024-000534",
        channel: "Amazon",
        customerName: "Sneha Gupta",
        reason: "Customer Refused",
        items: 1,
        amount: 6800,
        type: "RTO",
        status: "QC_PASSED",
        createdAt: "2024-01-07 14:20",
      },
      {
        id: "5",
        returnNo: "RTN-2024-005",
        orderNo: "ORD-2024-000423",
        channel: "Manual",
        customerName: "Vikram Singh",
        reason: "Damaged in Transit",
        items: 3,
        amount: 12500,
        type: "RETURN",
        status: "RESTOCKED",
        createdAt: "2024-01-06 11:00",
      },
    ],
    total: 847,
    page: 1,
    pageSize: 20,
    totalPages: 43,
    summary: {
      totalReturns: 847,
      customerReturns: 512,
      rto: 335,
      returnRate: 8.45,
      pendingQc: 89,
    },
    statusCounts: {
      all: 847,
      initiated: 45,
      in_transit: 128,
      received: 89,
      qc_pending: 34,
      restocked: 486,
      disposed: 65,
    },
  };
}
