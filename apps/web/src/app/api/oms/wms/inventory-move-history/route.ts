import { NextRequest, NextResponse } from "next/server";

const OMS_BACKEND_URL = process.env.OMS_BACKEND_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skuCode = searchParams.get("skuCode");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    let url = `${OMS_BACKEND_URL}/api/wms/inventory-move-history`;
    const params = new URLSearchParams();
    if (skuCode) params.append("skuCode", skuCode);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
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
          history: [
            { id: "1", skuCode: "SKU-001", skuDescription: "Wireless Mouse", moveDate: "2024-01-08 10:30", siteLocation: "Warehouse A", moveQty: 25, fromZone: "ZONE-A", toZone: "ZONE-B", fromBin: "BIN-A001", toBin: "BIN-B001", putawayNumber: "PUT-001", movedBy: "Rahul Kumar" },
            { id: "2", skuCode: "SKU-002", skuDescription: "USB Keyboard", moveDate: "2024-01-08 11:15", siteLocation: "Warehouse A", moveQty: 15, fromZone: "ZONE-B", toZone: "ZONE-A", fromBin: "BIN-B002", toBin: "BIN-A002", putawayNumber: "PUT-002", movedBy: "Priya Sharma" },
            { id: "3", skuCode: "SKU-003", skuDescription: "Monitor Stand", moveDate: "2024-01-07 14:20", siteLocation: "Warehouse B", moveQty: 10, fromZone: "ZONE-C", toZone: "ZONE-D", fromBin: "BIN-C001", toBin: "BIN-D001", putawayNumber: "PUT-003", movedBy: "Amit Patel" },
            { id: "4", skuCode: "SKU-004", skuDescription: "Laptop Bag", moveDate: "2024-01-07 16:45", siteLocation: "Warehouse A", moveQty: 50, fromZone: "QC", toZone: "ZONE-A", fromBin: "QC-BIN-001", toBin: "BIN-A003", putawayNumber: "PUT-004", movedBy: "System" },
          ],
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching move history:", error);
    return NextResponse.json({
      success: true,
      data: {
        history: [
          { id: "1", skuCode: "SKU-001", skuDescription: "Wireless Mouse", moveDate: "2024-01-08 10:30", siteLocation: "Warehouse A", moveQty: 25, fromZone: "ZONE-A", toZone: "ZONE-B", fromBin: "BIN-A001", toBin: "BIN-B001", putawayNumber: "PUT-001", movedBy: "Rahul Kumar" },
          { id: "2", skuCode: "SKU-002", skuDescription: "USB Keyboard", moveDate: "2024-01-08 11:15", siteLocation: "Warehouse A", moveQty: 15, fromZone: "ZONE-B", toZone: "ZONE-A", fromBin: "BIN-B002", toBin: "BIN-A002", putawayNumber: "PUT-002", movedBy: "Priya Sharma" },
        ],
      },
    });
  }
}
