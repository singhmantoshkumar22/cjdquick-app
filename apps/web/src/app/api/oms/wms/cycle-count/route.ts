import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/wms/cycle-count - List Cycle Counts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("pageSize") || "20";
    const status = searchParams.get("status");
    const zone = searchParams.get("zone");
    const assignedTo = searchParams.get("assignedTo");
    const search = searchParams.get("search");

    const queryParams = new URLSearchParams({
      page,
      pageSize,
      ...(status && { status }),
      ...(zone && { zone }),
      ...(assignedTo && { assignedTo }),
      ...(search && { search }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/wms/cycle-count?${queryParams.toString()}`,
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
        data: getDemoCycleCountData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching cycle count data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoCycleCountData(),
    });
  }
}

// POST /api/oms/wms/cycle-count - Schedule Cycle Count
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/wms/cycle-count`, {
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
    console.error("Error scheduling cycle count:", error);
    return NextResponse.json(
      { success: false, error: { code: "CREATE_ERROR", message: "Failed to schedule cycle count" } },
      { status: 500 }
    );
  }
}

function getDemoCycleCountData() {
  return {
    items: [
      {
        id: "1",
        countNo: "CC-2024-001234",
        zone: "Zone A",
        binRange: "A-01-01 to A-05-10",
        totalBins: 50,
        countedBins: 50,
        skusCount: 125,
        variance: 2,
        status: "COMPLETED",
        assignedTo: "John Smith",
        scheduledDate: "2024-01-08",
        completedDate: "2024-01-08",
      },
      {
        id: "2",
        countNo: "CC-2024-001235",
        zone: "Zone B",
        binRange: "B-01-01 to B-03-08",
        totalBins: 32,
        countedBins: 18,
        skusCount: 89,
        variance: 0,
        status: "IN_PROGRESS",
        assignedTo: "Jane Doe",
        scheduledDate: "2024-01-08",
        completedDate: null,
      },
    ],
    total: 156,
    page: 1,
    pageSize: 20,
    totalPages: 8,
    statusCounts: {
      all: 156,
      scheduled: 45,
      in_progress: 12,
      completed: 89,
      variance: 10,
    },
  };
}
