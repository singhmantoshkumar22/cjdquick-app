import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/wms/dispatch - List Manifests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("pageSize") || "20";
    const status = searchParams.get("status");
    const carrier = searchParams.get("carrier");
    const destination = searchParams.get("destination");
    const search = searchParams.get("search");

    const queryParams = new URLSearchParams({
      page,
      pageSize,
      ...(status && { status }),
      ...(carrier && { carrier }),
      ...(destination && { destination }),
      ...(search && { search }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/wms/dispatch?${queryParams.toString()}`,
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
        data: getDemoDispatchData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching dispatch data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoDispatchData(),
    });
  }
}

// POST /api/oms/wms/dispatch - Create Manifest
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/wms/dispatch`, {
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
    console.error("Error creating manifest:", error);
    return NextResponse.json(
      { success: false, error: { code: "CREATE_ERROR", message: "Failed to create manifest" } },
      { status: 500 }
    );
  }
}

function getDemoDispatchData() {
  return {
    items: [
      {
        id: "1",
        manifestNo: "MAN-2024-001234",
        carrier: "Delhivery",
        vehicleNo: "MH-12-AB-1234",
        driverName: "Rajesh Kumar",
        orderCount: 45,
        totalWeight: "125.5 kg",
        destination: "Mumbai Hub",
        status: "DISPATCHED",
        dispatchTime: "10:30",
        createdAt: "2024-01-08 10:15",
      },
      {
        id: "2",
        manifestNo: "MAN-2024-001235",
        carrier: "BlueDart",
        vehicleNo: "MH-12-CD-5678",
        driverName: "Suresh Singh",
        orderCount: 32,
        totalWeight: "89.2 kg",
        destination: "Delhi Hub",
        status: "READY",
        dispatchTime: "-",
        createdAt: "2024-01-08 11:00",
      },
    ],
    total: 156,
    page: 1,
    pageSize: 20,
    totalPages: 8,
    statusCounts: {
      all: 156,
      pending: 28,
      ready: 15,
      dispatched: 113,
    },
  };
}
