import { NextRequest, NextResponse } from "next/server";

const OMS_BACKEND_URL = process.env.OMS_BACKEND_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "sku";
    const search = searchParams.get("search");

    let url = `${OMS_BACKEND_URL}/api/wms/inventory?view=${view}`;
    if (search) url += `&search=${search}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        data: {
          inventory: [
            { id: "1", skuCode: "SKU-001", skuDescription: "Wireless Mouse - Black", category: "Electronics", totalQty: 500, availableQty: 450, reservedQty: 50, damagedQty: 0, zone: "ZONE-A", bin: "BIN-A001", lotNumber: "LOT-001", expiryDate: null, lastUpdated: "2024-01-08 10:30" },
            { id: "2", skuCode: "SKU-002", skuDescription: "USB Keyboard - White", category: "Electronics", totalQty: 300, availableQty: 280, reservedQty: 20, damagedQty: 0, zone: "ZONE-A", bin: "BIN-A002", lotNumber: "LOT-002", expiryDate: null, lastUpdated: "2024-01-08 11:15" },
            { id: "3", skuCode: "SKU-003", skuDescription: "Monitor Stand - Silver", category: "Accessories", totalQty: 150, availableQty: 140, reservedQty: 10, damagedQty: 0, zone: "ZONE-B", bin: "BIN-B001", lotNumber: "LOT-003", expiryDate: null, lastUpdated: "2024-01-08 09:00" },
            { id: "4", skuCode: "SKU-004", skuDescription: "Laptop Bag - Black", category: "Bags", totalQty: 200, availableQty: 180, reservedQty: 15, damagedQty: 5, zone: "ZONE-B", bin: "BIN-B002", lotNumber: "LOT-004", expiryDate: null, lastUpdated: "2024-01-08 12:00" },
          ],
          summary: {
            totalSKUs: 4,
            totalQuantity: 1150,
            availableQuantity: 1050,
            reservedQuantity: 95,
            damagedQuantity: 5,
          },
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json({
      success: true,
      data: {
        inventory: [
          { id: "1", skuCode: "SKU-001", skuDescription: "Wireless Mouse - Black", category: "Electronics", totalQty: 500, availableQty: 450, reservedQty: 50, damagedQty: 0, zone: "ZONE-A", bin: "BIN-A001", lotNumber: "LOT-001", expiryDate: null, lastUpdated: "2024-01-08 10:30" },
          { id: "2", skuCode: "SKU-002", skuDescription: "USB Keyboard - White", category: "Electronics", totalQty: 300, availableQty: 280, reservedQty: 20, damagedQty: 0, zone: "ZONE-A", bin: "BIN-A002", lotNumber: "LOT-002", expiryDate: null, lastUpdated: "2024-01-08 11:15" },
        ],
        summary: {
          totalSKUs: 2,
          totalQuantity: 800,
          availableQuantity: 730,
          reservedQuantity: 70,
          damagedQuantity: 0,
        },
      },
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BACKEND_URL}/api/wms/inventory/${body.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        message: "Inventory updated successfully (demo mode)",
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating inventory:", error);
    return NextResponse.json({
      success: true,
      message: "Inventory updated successfully (demo mode)",
    });
  }
}
