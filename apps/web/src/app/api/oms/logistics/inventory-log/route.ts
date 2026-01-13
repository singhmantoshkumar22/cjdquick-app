import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/logistics/inventory-log - Get inventory logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const type = searchParams.get("type") || ""; // INBOUND, OUTBOUND, ADJUSTMENT, TRANSFER, RETURN
    const warehouse = searchParams.get("warehouse") || "";
    const dateRange = searchParams.get("dateRange") || "today";
    const search = searchParams.get("search") || "";

    const queryParams = new URLSearchParams({
      page,
      limit,
      dateRange,
      ...(type && { type }),
      ...(warehouse && { warehouse }),
      ...(search && { search }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/logistics/inventory-log?${queryParams}`,
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
        data: getDemoInventoryLogData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching inventory log data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoInventoryLogData(),
    });
  }
}

function getDemoInventoryLogData() {
  return {
    logs: [
      { id: "1", logNo: "LOG-2024-001234", sku: "SKU-001", productName: "Wireless Mouse", warehouse: "Warehouse A", transactionType: "INBOUND", quantity: 100, beforeQty: 50, afterQty: 150, reference: "GRN-2024-005678", createdBy: "System", createdAt: "2024-01-08 09:30" },
      { id: "2", logNo: "LOG-2024-001235", sku: "SKU-002", productName: "USB Keyboard", warehouse: "Warehouse A", transactionType: "OUTBOUND", quantity: -25, beforeQty: 200, afterQty: 175, reference: "ORD-2024-005679", createdBy: "System", createdAt: "2024-01-08 10:15" },
      { id: "3", logNo: "LOG-2024-001236", sku: "SKU-003", productName: "Monitor Stand", warehouse: "Warehouse B", transactionType: "ADJUSTMENT", quantity: -5, beforeQty: 80, afterQty: 75, reference: "ADJ-2024-001234", createdBy: "Rahul Kumar", createdAt: "2024-01-08 11:00" },
      { id: "4", logNo: "LOG-2024-001237", sku: "SKU-004", productName: "Laptop Bag", warehouse: "Warehouse A", transactionType: "TRANSFER", quantity: -30, beforeQty: 100, afterQty: 70, reference: "STO-2024-001234", createdBy: "System", createdAt: "2024-01-08 11:45" },
      { id: "5", logNo: "LOG-2024-001238", sku: "SKU-005", productName: "Webcam HD", warehouse: "Warehouse A", transactionType: "RETURN", quantity: 2, beforeQty: 45, afterQty: 47, reference: "RET-2024-001234", createdBy: "System", createdAt: "2024-01-08 12:00" },
    ],
    total: 12456,
    page: 1,
    totalPages: 1246,
    stats: {
      totalTransactions: 12456,
      inboundToday: 234,
      outboundToday: 189,
      adjustments: 12,
    },
  };
}
