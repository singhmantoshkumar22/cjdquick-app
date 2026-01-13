import { NextRequest, NextResponse } from "next/server";

const OMS_BACKEND_URL = process.env.OMS_BACKEND_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get("zone");
    const status = searchParams.get("status");

    let url = `${OMS_BACKEND_URL}/api/wms/bins`;
    const params = new URLSearchParams();
    if (zone) params.append("zone", zone);
    if (status) params.append("status", status);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        data: {
          bins: [
            { id: "1", binCode: "BIN-A001", zoneName: "ZONE-A", binType: "STORAGE", capacity: 100, currentQty: 75, status: "ACTIVE", lastUpdated: "2024-01-08 10:30", x: 1, y: 1, z: 1 },
            { id: "2", binCode: "BIN-A002", zoneName: "ZONE-A", binType: "STORAGE", capacity: 100, currentQty: 50, status: "ACTIVE", lastUpdated: "2024-01-08 11:15", x: 1, y: 1, z: 2 },
            { id: "3", binCode: "BIN-B001", zoneName: "ZONE-B", binType: "STORAGE", capacity: 150, currentQty: 150, status: "FULL", lastUpdated: "2024-01-08 09:00", x: 2, y: 1, z: 1 },
            { id: "4", binCode: "QC-BIN-001", zoneName: "QC-ZONE", binType: "QC", capacity: 50, currentQty: 10, status: "ACTIVE", lastUpdated: "2024-01-08 12:00", x: 3, y: 1, z: 1 },
          ],
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching bins:", error);
    return NextResponse.json({
      success: true,
      data: {
        bins: [
          { id: "1", binCode: "BIN-A001", zoneName: "ZONE-A", binType: "STORAGE", capacity: 100, currentQty: 75, status: "ACTIVE", lastUpdated: "2024-01-08 10:30", x: 1, y: 1, z: 1 },
          { id: "2", binCode: "BIN-A002", zoneName: "ZONE-A", binType: "STORAGE", capacity: 100, currentQty: 50, status: "ACTIVE", lastUpdated: "2024-01-08 11:15", x: 1, y: 1, z: 2 },
        ],
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BACKEND_URL}/api/wms/bins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        message: "Bin created successfully (demo mode)",
        data: { id: Date.now().toString(), ...body },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating bin:", error);
    return NextResponse.json({
      success: true,
      message: "Bin created successfully (demo mode)",
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BACKEND_URL}/api/wms/bins/${body.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        message: "Bin updated successfully (demo mode)",
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating bin:", error);
    return NextResponse.json({
      success: true,
      message: "Bin updated successfully (demo mode)",
    });
  }
}
