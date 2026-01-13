import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/inbound/realtime - Get real-time inbound activities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const location = searchParams.get("location") || "";

    const queryParams = new URLSearchParams({
      ...(type && { type }),
      ...(status && { status }),
      ...(location && { location }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/inbound/realtime?${queryParams}`,
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
        data: getDemoRealTimeData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching real-time inbound data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoRealTimeData(),
    });
  }
}

function getDemoRealTimeData() {
  return {
    inbounds: [
      { id: "1", inboundNo: "INB-2024-001234", inboundType: "WITH_ASN", referenceNo: "ASN-001234", vendor: "ABC Suppliers", location: "Warehouse A", expectedQty: 500, receivedQty: 250, pendingQty: 250, status: "RECEIVING", vehicleNo: "MH-12-AB-1234", driverName: "Rajesh Kumar", arrivalTime: "10:30 AM", dock: "Dock 1", currentActivity: "Unloading in progress" },
      { id: "2", inboundNo: "INB-2024-001235", inboundType: "WITH_PO", referenceNo: "PO-2024-0056", vendor: "XYZ Trading", location: "Warehouse A", expectedQty: 200, receivedQty: 200, pendingQty: 0, status: "QC_PENDING", vehicleNo: "MH-12-CD-5678", driverName: "Suresh Singh", arrivalTime: "09:15 AM", dock: "Dock 2", currentActivity: "Awaiting QC inspection" },
      { id: "3", inboundNo: "INB-2024-001236", inboundType: "DIRECT", referenceNo: "DR-001236", vendor: "Quick Supplies", location: "Warehouse B", expectedQty: 100, receivedQty: 0, pendingQty: 100, status: "WAITING", vehicleNo: "MH-04-EF-9012", driverName: "Amit Patel", arrivalTime: "11:00 AM", dock: "-", currentActivity: "Vehicle waiting at gate" },
      { id: "4", inboundNo: "INB-2024-001237", inboundType: "WITH_GATE_PASS", referenceNo: "GP-2024-0089", vendor: "Metro Distributors", location: "Warehouse A", expectedQty: 350, receivedQty: 350, pendingQty: 0, status: "COMPLETED", vehicleNo: "MH-12-GH-3456", driverName: "Vikram Yadav", arrivalTime: "08:00 AM", dock: "Dock 3", currentActivity: "Completed - Ready for putaway" },
    ],
    summary: {
      waiting: 1,
      receiving: 1,
      qcPending: 1,
      completed: 1,
    },
  };
}
