import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/wms - Get WMS dashboard stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "dashboard";

    const response = await fetch(
      `${OMS_BASE_URL}/api/wms?type=${type}`,
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
        data: getDemoWMSData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching WMS data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoWMSData(),
    });
  }
}

function getDemoWMSData() {
  return {
    stats: {
      pendingGrn: 12,
      pendingPutaway: 45,
      pendingPick: 128,
      pendingPack: 89,
      pendingDispatch: 67,
      todayInbound: 342,
      todayOutbound: 567,
      totalSkus: 3296,
      lowStockAlerts: 24,
      cycleCountDue: 156,
    },
    recentActivity: [
      { id: 1, type: "GRN", reference: "GRN-2024-001234", status: "Received", time: "10 mins ago", items: 45 },
      { id: 2, type: "Putaway", reference: "PUT-2024-005678", status: "Completed", time: "25 mins ago", items: 32 },
      { id: 3, type: "Pick", reference: "PCK-2024-008912", status: "In Progress", time: "30 mins ago", items: 18 },
      { id: 4, type: "Pack", reference: "PAK-2024-003456", status: "Completed", time: "45 mins ago", items: 12 },
      { id: 5, type: "Dispatch", reference: "DSP-2024-007890", status: "Shipped", time: "1 hour ago", items: 28 },
    ],
    zoneUtilization: [
      { zone: "Zone A", capacity: 85, skus: 450 },
      { zone: "Zone B", capacity: 72, skus: 380 },
      { zone: "Zone C", capacity: 93, skus: 520 },
      { zone: "Zone D", capacity: 45, skus: 210 },
      { zone: "Zone E", capacity: 68, skus: 340 },
    ],
  };
}
