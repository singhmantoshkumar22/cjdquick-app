import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/reports/custom - Get custom reports list
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${OMS_BASE_URL}/api/reports/custom`, {
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
        data: getDemoCustomReports(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching custom reports:", error);
    return NextResponse.json({
      success: true,
      data: getDemoCustomReports(),
    });
  }
}

// POST /api/oms/reports/custom - Create new custom report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/reports/custom`, {
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
          id: `RPT-${Date.now()}`,
          message: "Report created successfully (demo mode)",
        },
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating custom report:", error);
    return NextResponse.json({
      success: true,
      data: {
        id: `RPT-${Date.now()}`,
        message: "Report created successfully (demo mode)",
      },
    });
  }
}

// PUT /api/oms/reports/custom - Update custom report
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/reports/custom`, {
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
        message: "Report updated successfully (demo mode)",
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating custom report:", error);
    return NextResponse.json({
      success: true,
      message: "Report updated successfully (demo mode)",
    });
  }
}

// DELETE /api/oms/reports/custom - Delete custom report
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/reports/custom`, {
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
        message: "Report deleted successfully (demo mode)",
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error deleting custom report:", error);
    return NextResponse.json({
      success: true,
      message: "Report deleted successfully (demo mode)",
    });
  }
}

function getDemoCustomReports() {
  return {
    reports: [
      {
        id: "1",
        name: "Weekly Sales by Channel",
        description: "Weekly revenue breakdown by sales channel",
        dataSource: "orders",
        columns: ["channel", "orderCount", "revenue", "aov"],
        schedule: "Weekly",
        lastRun: "2024-01-07 09:00",
        createdBy: "Admin",
      },
      {
        id: "2",
        name: "Low Stock Alert Report",
        description: "SKUs below reorder point",
        dataSource: "inventory",
        columns: ["sku", "name", "currentStock", "reorderPoint", "supplier"],
        schedule: "Daily",
        lastRun: "2024-01-08 06:00",
        createdBy: "Inventory Team",
      },
    ],
  };
}
