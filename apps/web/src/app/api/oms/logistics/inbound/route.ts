import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/logistics/inbound - Get inbound data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "list"; // list, gate-pass, enquiry, realtime, qc, direct, sto, return
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const status = searchParams.get("status") || "";

    const queryParams = new URLSearchParams({
      type,
      page,
      limit,
      ...(status && { status }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/logistics/inbound?${queryParams}`,
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
        data: getDemoInboundData(type),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching inbound data:", error);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "list";
    return NextResponse.json({
      success: true,
      data: getDemoInboundData(type),
    });
  }
}

// POST /api/oms/logistics/inbound - Create inbound
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/logistics/inbound`, {
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
      return NextResponse.json(
        { success: false, error: "Failed to create inbound" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating inbound:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create inbound" },
      { status: 500 }
    );
  }
}

// PUT /api/oms/logistics/inbound - Update inbound
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/logistics/inbound`, {
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
      return NextResponse.json(
        { success: false, error: "Failed to update inbound" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating inbound:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update inbound" },
      { status: 500 }
    );
  }
}

function getDemoInboundData(type: string) {
  switch (type) {
    case "gate-pass":
      return {
        gatePasses: [
          { id: "1", gatePassNo: "GP-2024-001234", vehicleNo: "MH-12-AB-1234", driverName: "Rajesh Kumar", driverPhone: "+91 98765 43210", transporter: "Delhivery", grnCount: 3, totalItems: 450, inTime: "2024-01-08 09:30", outTime: "2024-01-08 11:45", status: "COMPLETED" },
          { id: "2", gatePassNo: "GP-2024-001235", vehicleNo: "MH-12-CD-5678", driverName: "Suresh Singh", driverPhone: "+91 98765 43211", transporter: "BlueDart", grnCount: 2, totalItems: 280, inTime: "2024-01-08 10:15", outTime: null, status: "IN_PROGRESS" },
        ],
        total: 24,
        page: 1,
        totalPages: 3,
      };
    case "enquiry":
      return {
        enquiries: [
          { id: "1", enquiryNo: "ENQ-2024-001234", asnNo: "ASN-2024-005678", vendor: "Tech Supplies", expectedDate: "2024-01-08", items: 150, status: "EXPECTED" },
          { id: "2", enquiryNo: "ENQ-2024-001235", asnNo: "ASN-2024-005679", vendor: "Electronics Hub", expectedDate: "2024-01-09", items: 200, status: "IN_TRANSIT" },
        ],
        total: 156,
        page: 1,
        totalPages: 16,
      };
    case "realtime":
      return {
        shipments: [
          { id: "1", asnNo: "ASN-2024-001234", vehicleNo: "MH-12-AB-1234", transporter: "Delhivery", origin: "Mumbai", destination: "Warehouse A", currentLocation: "Pune (45 km away)", eta: "2024-01-08 14:30", items: 450, status: "IN_TRANSIT", lastUpdated: "5 mins ago" },
          { id: "2", asnNo: "ASN-2024-001235", vehicleNo: "MH-12-CD-5678", transporter: "BlueDart", origin: "Delhi", destination: "Warehouse B", currentLocation: "At Gate", eta: "2024-01-08 12:00", items: 280, status: "ARRIVED", lastUpdated: "2 mins ago" },
        ],
        total: 24,
        page: 1,
        totalPages: 3,
      };
    case "qc":
      return {
        qcTasks: [
          { id: "1", qcNo: "QC-2024-001234", grnNo: "GRN-2024-005678", vendor: "Tech Supplies", totalItems: 150, passedItems: 145, failedItems: 3, holdItems: 2, qcBy: "Rahul Kumar", qcDate: "2024-01-08 10:30", status: "COMPLETED" },
          { id: "2", qcNo: "QC-2024-001235", grnNo: "GRN-2024-005679", vendor: "Electronics Hub", totalItems: 200, passedItems: 120, failedItems: 0, holdItems: 80, qcBy: "Priya Sharma", qcDate: "2024-01-08 11:15", status: "IN_PROGRESS" },
        ],
        total: 156,
        page: 1,
        totalPages: 16,
      };
    default:
      return {
        inbounds: [
          { id: "1", inboundNo: "INB-2024-001234", poNo: "PO-2024-005678", vendor: "Tech Supplies", warehouse: "Warehouse A", items: 150, received: 150, status: "COMPLETED", createdAt: "2024-01-08 09:30" },
          { id: "2", inboundNo: "INB-2024-001235", poNo: "PO-2024-005679", vendor: "Electronics Hub", warehouse: "Warehouse A", items: 200, received: 120, status: "IN_PROGRESS", createdAt: "2024-01-08 10:15" },
        ],
        total: 245,
        page: 1,
        totalPages: 25,
      };
  }
}
