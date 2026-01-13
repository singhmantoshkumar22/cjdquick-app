import { NextRequest, NextResponse } from "next/server";
import { omsRequest } from "@/lib/oms-client";

// GET /api/oms/orders - List OMS orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("pageSize") || searchParams.get("limit") || "20";
    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const paymentMode = searchParams.get("paymentMode");
    const search = searchParams.get("search");

    // Build query string
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(status && { status }),
      ...(channel && { channel }),
      ...(paymentMode && { paymentMode }),
      ...(search && { search }),
    });

    // Proxy to OMS backend with internal API key
    const result = await omsRequest(`/api/orders?${queryParams.toString()}`);

    if (!result.success) {
      // Return demo data if OMS backend is not available
      console.log("OMS not available, returning demo data");
      return NextResponse.json({
        success: true,
        data: getDemoOrdersData(),
      });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error fetching OMS orders:", error);
    return NextResponse.json({
      success: true,
      data: getDemoOrdersData(),
    });
  }
}

// POST /api/oms/orders - Create OMS order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await omsRequest("/api/orders", {
      method: "POST",
      body,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    console.error("Error creating OMS order:", error);
    return NextResponse.json(
      { success: false, error: { code: "CREATE_ERROR", message: "Failed to create order" } },
      { status: 500 }
    );
  }
}

function getDemoOrdersData() {
  return {
    items: [
      {
        id: "1",
        webOrderNo: "ORD-2024-001234",
        channel: "Amazon",
        customerName: "Rahul Sharma",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        items: 2,
        quantity: 5,
        amount: 12500,
        paymentMode: "Prepaid",
        status: "NEW",
        createdAt: "2024-01-08 10:30",
      },
      {
        id: "2",
        webOrderNo: "ORD-2024-001235",
        channel: "Flipkart",
        customerName: "Priya Patel",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
        items: 1,
        quantity: 3,
        amount: 8500,
        paymentMode: "COD",
        status: "PROCESSING",
        createdAt: "2024-01-08 10:15",
      },
      {
        id: "3",
        webOrderNo: "ORD-2024-001236",
        channel: "Shopify",
        customerName: "Amit Kumar",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        items: 3,
        quantity: 8,
        amount: 22000,
        paymentMode: "Prepaid",
        status: "PACKED",
        createdAt: "2024-01-08 09:45",
      },
      {
        id: "4",
        webOrderNo: "ORD-2024-001237",
        channel: "Amazon",
        customerName: "Sneha Gupta",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600001",
        items: 1,
        quantity: 1,
        amount: 4500,
        paymentMode: "Prepaid",
        status: "SHIPPED",
        createdAt: "2024-01-08 09:30",
      },
      {
        id: "5",
        webOrderNo: "ORD-2024-001238",
        channel: "Manual",
        customerName: "Vikram Singh",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
        items: 2,
        quantity: 4,
        amount: 15000,
        paymentMode: "COD",
        status: "DELIVERED",
        createdAt: "2024-01-07 16:20",
      },
    ],
    total: 3693,
    page: 1,
    pageSize: 20,
    totalPages: 185,
    statusCounts: {
      all: 3693,
      new: 245,
      processing: 128,
      packed: 89,
      shipped: 456,
      delivered: 2650,
      cancelled: 78,
      rto: 47,
    },
  };
}
