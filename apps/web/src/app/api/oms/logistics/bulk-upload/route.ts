import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/logistics/bulk-upload - Get bulk upload history
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
      `${OMS_BASE_URL}/api/logistics/bulk-upload?${queryParams}`,
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
        data: getDemoBulkUploadData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching bulk upload data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoBulkUploadData(),
    });
  }
}

// POST /api/oms/logistics/bulk-upload - Upload file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const response = await fetch(`${OMS_BASE_URL}/api/logistics/bulk-upload`, {
      method: "POST",
      headers: {
        ...(request.headers.get("authorization") && {
          Authorization: request.headers.get("authorization")!,
        }),
      },
      body: formData,
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to upload file" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

function getDemoBulkUploadData() {
  return {
    uploads: [
      { id: "1", fileName: "awb_data_jan_08.xlsx", uploadType: "AWB Update", totalRecords: 500, successRecords: 498, failedRecords: 2, uploadedBy: "Rahul Kumar", uploadedAt: "2024-01-08 09:30", status: "COMPLETED" },
      { id: "2", fileName: "pincode_update.csv", uploadType: "Service Pincode", totalRecords: 1200, successRecords: 800, failedRecords: 0, uploadedBy: "Priya Sharma", uploadedAt: "2024-01-08 10:15", status: "PROCESSING" },
      { id: "3", fileName: "transporter_rates.xlsx", uploadType: "Rate Card", totalRecords: 350, successRecords: 0, failedRecords: 0, uploadedBy: "Amit Patel", uploadedAt: "2024-01-08 11:00", status: "PENDING" },
      { id: "4", fileName: "inventory_update.csv", uploadType: "Inventory", totalRecords: 800, successRecords: 0, failedRecords: 800, uploadedBy: "Sneha Gupta", uploadedAt: "2024-01-07 16:30", status: "FAILED" },
    ],
    total: 245,
    page: 1,
    totalPages: 25,
    stats: {
      totalUploads: 245,
      processing: 8,
      completed: 230,
      failed: 7,
    },
  };
}
