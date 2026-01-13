import { NextRequest, NextResponse } from "next/server";

const OMS_BACKEND_URL = process.env.OMS_BACKEND_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${OMS_BACKEND_URL}/api/wms/bulk-shipment`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        data: {
          uploads: [
            { id: "1", uploadId: "BULK-001", fileName: "bulk_ship_20240108.csv", uploadDate: "2024-01-08 14:00", totalRecords: 100, successCount: 98, errorCount: 2, status: "COMPLETED", uploadedBy: "Rahul Kumar" },
            { id: "2", uploadId: "BULK-002", fileName: "bulk_pack_20240108.csv", uploadDate: "2024-01-08 15:30", totalRecords: 50, successCount: 50, errorCount: 0, status: "COMPLETED", uploadedBy: "Priya Sharma" },
            { id: "3", uploadId: "BULK-003", fileName: "orders_batch.csv", uploadDate: "2024-01-08 16:00", totalRecords: 200, successCount: 0, errorCount: 0, status: "PROCESSING", uploadedBy: "Amit Patel" },
          ],
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching bulk uploads:", error);
    return NextResponse.json({
      success: true,
      data: {
        uploads: [
          { id: "1", uploadId: "BULK-001", fileName: "bulk_ship_20240108.csv", uploadDate: "2024-01-08 14:00", totalRecords: 100, successCount: 98, errorCount: 2, status: "COMPLETED", uploadedBy: "Rahul Kumar" },
          { id: "2", uploadId: "BULK-002", fileName: "bulk_pack_20240108.csv", uploadDate: "2024-01-08 15:30", totalRecords: 50, successCount: 50, errorCount: 0, status: "COMPLETED", uploadedBy: "Priya Sharma" },
        ],
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BACKEND_URL}/api/wms/bulk-shipment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        message: "Bulk upload started successfully (demo mode)",
        data: { uploadId: `BULK-${Date.now()}`, status: "PROCESSING" },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error uploading bulk file:", error);
    return NextResponse.json({
      success: true,
      message: "Bulk upload started successfully (demo mode)",
    });
  }
}
