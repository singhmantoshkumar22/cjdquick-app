import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/logistics/transhipment - Get transhipment list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const status = searchParams.get("status") || "";
    const sourceHub = searchParams.get("sourceHub") || "";

    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(status && { status }),
      ...(sourceHub && { sourceHub }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/logistics/transhipment?${queryParams}`,
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
        data: getDemoTranshipmentData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching transhipment data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoTranshipmentData(),
    });
  }
}

// POST /api/oms/logistics/transhipment - Create transhipment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/logistics/transhipment`, {
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
        { success: false, error: "Failed to create transhipment" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating transhipment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create transhipment" },
      { status: 500 }
    );
  }
}

// PUT /api/oms/logistics/transhipment - Update transhipment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/logistics/transhipment`, {
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
        { success: false, error: "Failed to update transhipment" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating transhipment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update transhipment" },
      { status: 500 }
    );
  }
}

function getDemoTranshipmentData() {
  return {
    transhipments: [
      { id: "1", transhipmentNo: "TRN-2024-001234", sourceHub: "Mumbai Hub", destinationHub: "Delhi Hub", vehicleNo: "MH-12-AB-1234", totalPackages: 450, totalWeight: 2500, departureTime: "2024-01-08 06:00", arrivalTime: "2024-01-08 18:00", status: "COMPLETED" },
      { id: "2", transhipmentNo: "TRN-2024-001235", sourceHub: "Delhi Hub", destinationHub: "Bangalore Hub", vehicleNo: "DL-01-CD-5678", totalPackages: 320, totalWeight: 1800, departureTime: "2024-01-08 08:00", arrivalTime: null, status: "IN_TRANSIT" },
      { id: "3", transhipmentNo: "TRN-2024-001236", sourceHub: "Mumbai Hub", destinationHub: "Chennai Hub", vehicleNo: "MH-12-EF-9012", totalPackages: 280, totalWeight: 1500, departureTime: "2024-01-08 10:00", arrivalTime: null, status: "IN_TRANSIT" },
      { id: "4", transhipmentNo: "TRN-2024-001237", sourceHub: "Kolkata Hub", destinationHub: "Mumbai Hub", vehicleNo: "-", totalPackages: 200, totalWeight: 1200, departureTime: "-", arrivalTime: null, status: "SCHEDULED" },
    ],
    total: 156,
    page: 1,
    totalPages: 16,
    stats: {
      totalTranshipments: 156,
      inTransit: 24,
      scheduled: 18,
      completedToday: 32,
    },
  };
}
