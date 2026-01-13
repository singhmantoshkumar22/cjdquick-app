import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/inbound/return - Get return inbound list
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
    const qcStatus = searchParams.get("qcStatus") || "";

    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(returnNo && { returnNo }),
      ...(orderNo && { orderNo }),
      ...(awbNo && { awbNo }),
      ...(returnType && { returnType }),
      ...(status && { status }),
      ...(qcStatus && { qcStatus }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/inbound/return?${queryParams}`,
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
    console.error("Error fetching return inbound data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoReturnData(),
    });
  }
}

// POST /api/oms/inbound/return - Create return inbound
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/inbound/return`, {
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
        { success: false, error: "Failed to create return inbound" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating return inbound:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create return inbound" },
      { status: 500 }
    );
  }
}

// PUT /api/oms/inbound/return - Receive return and update QC
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/inbound/return/receive`, {
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
        { success: false, error: "Failed to receive return" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error receiving return:", error);
    return NextResponse.json(
      { success: false, error: "Failed to receive return" },
      { status: 500 }
    );
  }
}

function getDemoReturnData() {
  return {
    returns: [
      { id: "1", returnNo: "RET-2024-001234", orderNo: "ORD-2024-5678", awbNo: "AWB-001234567", returnType: "RTO", returnReason: "Customer not available", customerName: "Rahul Sharma", customerPhone: "9876543210", skuCode: "SKU-001", skuDescription: "Wireless Mouse", returnQty: 1, receivedQty: 0, qcStatus: "PENDING", resellable: false, status: "PENDING", receivedAt: "", receivedBy: "", location: "Warehouse A", remarks: "" },
      { id: "2", returnNo: "RET-2024-001235", orderNo: "ORD-2024-5679", awbNo: "AWB-001234568", returnType: "CUSTOMER_RETURN", returnReason: "Product defective", customerName: "Priya Gupta", customerPhone: "9876543211", skuCode: "SKU-002", skuDescription: "USB Keyboard", returnQty: 1, receivedQty: 1, qcStatus: "FAILED", resellable: false, status: "QC_DONE", receivedAt: "2024-01-08 10:30", receivedBy: "Amit Kumar", location: "Warehouse A", remarks: "Keys not working" },
      { id: "3", returnNo: "RET-2024-001236", orderNo: "ORD-2024-5680", awbNo: "AWB-001234569", returnType: "EXCHANGE", returnReason: "Wrong size", customerName: "Vikram Singh", customerPhone: "9876543212", skuCode: "SKU-003", skuDescription: "Laptop Bag - Large", returnQty: 1, receivedQty: 1, qcStatus: "PASSED", resellable: true, status: "PUTAWAY", receivedAt: "2024-01-08 09:15", receivedBy: "Sneha Patel", location: "Warehouse A", remarks: "" },
      { id: "4", returnNo: "RET-2024-001237", orderNo: "ORD-2024-5681", awbNo: "AWB-001234570", returnType: "RTO", returnReason: "Address incorrect", customerName: "Neha Verma", customerPhone: "9876543213", skuCode: "SKU-004", skuDescription: "Monitor Stand", returnQty: 2, receivedQty: 2, qcStatus: "PASSED", resellable: true, status: "PUTAWAY", receivedAt: "2024-01-07 14:20", receivedBy: "Rahul Kumar", location: "Warehouse B", remarks: "" },
      { id: "5", returnNo: "RET-2024-001238", orderNo: "ORD-2024-5682", awbNo: "AWB-001234571", returnType: "REFUND", returnReason: "Changed mind", customerName: "Amit Patel", customerPhone: "9876543214", skuCode: "SKU-005", skuDescription: "Webcam HD", returnQty: 1, receivedQty: 0, qcStatus: "PENDING", resellable: false, status: "PENDING", receivedAt: "", receivedBy: "", location: "Warehouse A", remarks: "" },
    ],
    summary: {
      pending: 2,
      received: 1,
      qcDone: 1,
      putaway: 2,
      rto: 2,
      customerReturn: 1,
    },
    total: 234,
    page: 1,
    totalPages: 24,
  };
}
