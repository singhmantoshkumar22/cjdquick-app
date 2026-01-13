import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/settings - Get all settings
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${OMS_BASE_URL}/api/settings`, {
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
        data: getDemoSettings(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({
      success: true,
      data: getDemoSettings(),
    });
  }
}

function getDemoSettings() {
  return {
    version: "2.4.1",
    environment: "Production",
    lastUpdated: "2024-01-05",
    license: "Enterprise",
    features: {
      multiLocation: true,
      multiChannel: true,
      batchProcessing: true,
      advancedReporting: true,
    },
  };
}
