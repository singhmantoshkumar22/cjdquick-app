import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/wms/pack - List Packing Tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("pageSize") || "20";
    const status = searchParams.get("status");
    const packedBy = searchParams.get("packedBy");
    const search = searchParams.get("search");

    const queryParams = new URLSearchParams({
      page,
      pageSize,
      ...(status && { status }),
      ...(packedBy && { packedBy }),
      ...(search && { search }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/wms/pack?${queryParams.toString()}`,
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
        data: getDemoPackData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching pack data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoPackData(),
    });
  }
}

// POST /api/oms/wms/pack - Complete Packing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/wms/pack`, {
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
    console.error("Error completing packing:", error);
    return NextResponse.json(
      { success: false, error: { code: "PACK_ERROR", message: "Failed to complete packing" } },
      { status: 500 }
    );
  }
}

function getDemoPackData() {
  return {
    items: [
      {
        id: "1",
        packNo: "PAK-2024-001234",
        orderNo: "ORD-2024-005678",
        picklistNo: "PCK-2024-001234",
        customerName: "Rahul Sharma",
        totalItems: 5,
        packedItems: 5,
        boxCount: 2,
        weight: "2.5 kg",
        status: "COMPLETED",
        packedBy: "John Smith",
        createdAt: "2024-01-08 10:30",
      },
      {
        id: "2",
        packNo: "PAK-2024-001235",
        orderNo: "ORD-2024-005679",
        picklistNo: "PCK-2024-001235",
        customerName: "Priya Patel",
        totalItems: 8,
        packedItems: 4,
        boxCount: 1,
        weight: "1.2 kg",
        status: "IN_PROGRESS",
        packedBy: "Jane Doe",
        createdAt: "2024-01-08 11:15",
      },
    ],
    total: 89,
    page: 1,
    pageSize: 20,
    totalPages: 5,
    statusCounts: {
      all: 89,
      pending: 28,
      in_progress: 15,
      completed: 46,
    },
  };
}
