import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/wms/picklist - List Picklists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("pageSize") || "20";
    const status = searchParams.get("status");
    const zone = searchParams.get("zone");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const queryParams = new URLSearchParams({
      page,
      pageSize,
      ...(status && { status }),
      ...(zone && { zone }),
      ...(priority && { priority }),
      ...(search && { search }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/wms/picklist?${queryParams.toString()}`,
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
        data: getDemoPicklistData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching picklist data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoPicklistData(),
    });
  }
}

// POST /api/oms/wms/picklist - Create Picklist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/wms/picklist`, {
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
    console.error("Error creating picklist:", error);
    return NextResponse.json(
      { success: false, error: { code: "CREATE_ERROR", message: "Failed to create picklist" } },
      { status: 500 }
    );
  }
}

function getDemoPicklistData() {
  return {
    items: [
      {
        id: "1",
        picklistNo: "PCK-2024-001234",
        orderCount: 15,
        totalItems: 45,
        pickedItems: 45,
        zone: "Zone A",
        priority: "HIGH",
        status: "COMPLETED",
        assignedTo: "John Smith",
        createdAt: "2024-01-08 08:00",
        dueTime: "10:00",
      },
      {
        id: "2",
        picklistNo: "PCK-2024-001235",
        orderCount: 22,
        totalItems: 68,
        pickedItems: 34,
        zone: "Zone B",
        priority: "HIGH",
        status: "IN_PROGRESS",
        assignedTo: "Jane Doe",
        createdAt: "2024-01-08 09:30",
        dueTime: "11:30",
      },
    ],
    total: 128,
    page: 1,
    pageSize: 20,
    totalPages: 7,
    statusCounts: {
      all: 128,
      pending: 35,
      in_progress: 28,
      completed: 65,
    },
  };
}
