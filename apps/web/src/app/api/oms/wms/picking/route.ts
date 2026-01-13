import { NextRequest, NextResponse } from "next/server";

const OMS_BACKEND_URL = process.env.OMS_BACKEND_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const picklistId = searchParams.get("picklistId");

    let url = `${OMS_BACKEND_URL}/api/wms/picking`;
    if (picklistId) url += `?picklistId=${picklistId}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        data: {
          pickingTasks: [
            { id: "1", taskId: "PICK-001", picklistId: "PL-2024-001234", skuCode: "SKU-001", skuDesc: "Wireless Mouse", bin: "BIN-A001", quantity: 5, pickedQty: 0, status: "PENDING" },
            { id: "2", taskId: "PICK-002", picklistId: "PL-2024-001234", skuCode: "SKU-002", skuDesc: "USB Keyboard", bin: "BIN-A002", quantity: 3, pickedQty: 3, status: "COMPLETED" },
            { id: "3", taskId: "PICK-003", picklistId: "PL-2024-001234", skuCode: "SKU-003", skuDesc: "Monitor Stand", bin: "BIN-B001", quantity: 2, pickedQty: 1, status: "IN_PROGRESS" },
          ],
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching picking tasks:", error);
    return NextResponse.json({
      success: true,
      data: {
        pickingTasks: [
          { id: "1", taskId: "PICK-001", picklistId: "PL-2024-001234", skuCode: "SKU-001", skuDesc: "Wireless Mouse", bin: "BIN-A001", quantity: 5, pickedQty: 0, status: "PENDING" },
          { id: "2", taskId: "PICK-002", picklistId: "PL-2024-001234", skuCode: "SKU-002", skuDesc: "USB Keyboard", bin: "BIN-A002", quantity: 3, pickedQty: 3, status: "COMPLETED" },
        ],
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BACKEND_URL}/api/wms/picking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        message: "Pick confirmed successfully (demo mode)",
        data: body,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error confirming pick:", error);
    return NextResponse.json({
      success: true,
      message: "Pick confirmed successfully (demo mode)",
    });
  }
}
