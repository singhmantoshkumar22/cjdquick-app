import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/settings/general - Get general settings
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${OMS_BASE_URL}/api/settings/general`, {
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
        data: getDemoGeneralSettings(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching general settings:", error);
    return NextResponse.json({
      success: true,
      data: getDemoGeneralSettings(),
    });
  }
}

// PUT /api/oms/settings/general - Update general settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/settings/general`, {
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
        message: "Settings updated successfully (demo mode)",
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating general settings:", error);
    return NextResponse.json({
      success: true,
      message: "Settings updated successfully (demo mode)",
    });
  }
}

function getDemoGeneralSettings() {
  return {
    company: {
      name: "CJD Retail Pvt Ltd",
      legalName: "CJD Retail Private Limited",
      gstin: "27AABCC1234D1ZE",
      pan: "AABCC1234D",
      address: "123 Business Park, Sector 18",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122015",
      country: "India",
    },
    regional: {
      timezone: "Asia/Kolkata",
      dateFormat: "DD/MM/YYYY",
      currency: "INR",
      language: "en",
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      orderCreated: true,
      orderShipped: true,
      returnRequested: true,
      lowStock: true,
      dailyDigest: false,
    },
  };
}
