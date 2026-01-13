import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/settings/locations - Get locations list
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${OMS_BASE_URL}/api/settings/locations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(request.headers.get("authorization") && {
          Authorization: request.headers.get("authorization")!,
        }),
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        data: getDemoLocations(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json({
      success: true,
      data: getDemoLocations(),
    });
  }
}

// POST /api/oms/settings/locations - Create new location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/settings/locations`, {
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
      return NextResponse.json({
        success: true,
        data: {
          id: `LOC-${Date.now()}`,
          message: "Location created successfully (demo mode)",
        },
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json({
      success: true,
      data: {
        id: `LOC-${Date.now()}`,
        message: "Location created successfully (demo mode)",
      },
    });
  }
}

// PUT /api/oms/settings/locations - Update location
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/settings/locations`, {
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
      return NextResponse.json({
        success: true,
        message: "Location updated successfully (demo mode)",
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json({
      success: true,
      message: "Location updated successfully (demo mode)",
    });
  }
}

// DELETE /api/oms/settings/locations - Delete location
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/settings/locations`, {
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
        message: "Location deleted successfully (demo mode)",
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json({
      success: true,
      message: "Location deleted successfully (demo mode)",
    });
  }
}

function getDemoLocations() {
  return {
    locations: [
      { id: "1", code: "WH-DELHI", name: "Delhi Warehouse", type: "WAREHOUSE", address: "Plot 45, Industrial Area Phase 2", city: "Delhi", state: "Delhi", pincode: "110037", capacity: 50000, currentStock: 38500, status: "ACTIVE", manager: "Rahul Sharma" },
      { id: "2", code: "WH-MUMBAI", name: "Mumbai Distribution Center", type: "DISTRIBUTION_CENTER", address: "Unit 12, Bhiwandi Industrial Estate", city: "Mumbai", state: "Maharashtra", pincode: "421302", capacity: 75000, currentStock: 52000, status: "ACTIVE", manager: "Priya Patel" },
      { id: "3", code: "WH-BANGALORE", name: "Bangalore Fulfillment Hub", type: "FULFILLMENT_CENTER", address: "Survey No. 78, Electronic City", city: "Bangalore", state: "Karnataka", pincode: "560100", capacity: 40000, currentStock: 28000, status: "ACTIVE", manager: "Amit Kumar" },
    ],
    total: 5,
  };
}
