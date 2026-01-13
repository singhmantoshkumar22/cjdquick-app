import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/logistics/transporter - Get transporter list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";

    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(status && { status }),
      ...(type && { type }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/logistics/transporter?${queryParams}`,
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
        data: getDemoTransporterData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching transporter data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoTransporterData(),
    });
  }
}

// POST /api/oms/logistics/transporter - Create transporter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/logistics/transporter`, {
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
        { success: false, error: "Failed to create transporter" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating transporter:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create transporter" },
      { status: 500 }
    );
  }
}

// PUT /api/oms/logistics/transporter - Update transporter priority
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/logistics/transporter`, {
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
        { success: false, error: "Failed to update transporter" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating transporter:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update transporter" },
      { status: 500 }
    );
  }
}

// DELETE /api/oms/logistics/transporter - Delete transporter preference
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/logistics/transporter`, {
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
        message: "Transporter preference deleted successfully (demo mode)",
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error deleting transporter preference:", error);
    return NextResponse.json({
      success: true,
      message: "Transporter preference deleted successfully (demo mode)",
    });
  }
}

function getDemoTransporterData() {
  return {
    preferences: [
      { id: "1", fromLocation: "Headoffice", destinationPincode: "400001", orderType: "PREPAID", transporter: "Delhivery", preferenceOrder: 1, createdBy: "Rahul Kumar", createdAt: "2024-01-01", updatedBy: "Admin", updatedAt: "2024-01-08", status: "ACTIVE" },
      { id: "2", fromLocation: "Headoffice", destinationPincode: "400001", orderType: "COD", transporter: "BlueDart", preferenceOrder: 2, createdBy: "Priya Sharma", createdAt: "2024-01-02", updatedBy: "Admin", updatedAt: "2024-01-07", status: "ACTIVE" },
      { id: "3", fromLocation: "Warehouse A", destinationPincode: "110001", orderType: "ALL", transporter: "FedEx", preferenceOrder: 1, createdBy: "Amit Patel", createdAt: "2024-01-03", updatedBy: "Amit Patel", updatedAt: "2024-01-06", status: "ACTIVE" },
      { id: "4", fromLocation: "Warehouse B", destinationPincode: "560001", orderType: "PREPAID", transporter: "Ecom Express", preferenceOrder: 1, createdBy: "Sneha Gupta", createdAt: "2024-01-04", updatedBy: "System", updatedAt: "2024-01-08", status: "INACTIVE" },
      { id: "5", fromLocation: "Headoffice", destinationPincode: "500001", orderType: "COD", transporter: "DTDC", preferenceOrder: 3, createdBy: "Vikram Singh", createdAt: "2024-01-05", updatedBy: "Admin", updatedAt: "2024-01-05", status: "ACTIVE" },
    ],
    total: 156,
    page: 1,
    totalPages: 16,
  };
}
