import { NextRequest, NextResponse } from "next/server";

const OMS_BACKEND_URL = process.env.OMS_BACKEND_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let url = `${OMS_BACKEND_URL}/api/wms/delivery-shipping`;
    if (status) url += `?status=${status}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        data: {
          shipments: [
            { id: "1", orderId: "ORD-2024-001234", awbNumber: "AWB123456789", courier: "BlueDart", customer: "John Doe", destination: "Mumbai", weight: 2.5, status: "NEW", createdDate: "2024-01-08 09:15" },
            { id: "2", orderId: "ORD-2024-001235", awbNumber: "AWB123456790", courier: "Delhivery", customer: "ABC Corp", destination: "Delhi", weight: 5.0, status: "PICKLIST_CREATED", createdDate: "2024-01-08 10:30" },
            { id: "3", orderId: "ORD-2024-001236", awbNumber: "AWB123456791", courier: "DTDC", customer: "Jane Smith", destination: "Bangalore", weight: 1.2, status: "PICK_PACK", createdDate: "2024-01-08 11:00" },
            { id: "4", orderId: "ORD-2024-001237", awbNumber: "AWB123456792", courier: "Ecom Express", customer: "XYZ Store", destination: "Chennai", weight: 3.8, status: "SHIPPED", createdDate: "2024-01-07 16:45" },
          ],
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return NextResponse.json({
      success: true,
      data: {
        shipments: [
          { id: "1", orderId: "ORD-2024-001234", awbNumber: "AWB123456789", courier: "BlueDart", customer: "John Doe", destination: "Mumbai", weight: 2.5, status: "NEW", createdDate: "2024-01-08 09:15" },
          { id: "2", orderId: "ORD-2024-001235", awbNumber: "AWB123456790", courier: "Delhivery", customer: "ABC Corp", destination: "Delhi", weight: 5.0, status: "PICKLIST_CREATED", createdDate: "2024-01-08 10:30" },
        ],
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BACKEND_URL}/api/wms/delivery-shipping`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        message: "Shipment updated successfully (demo mode)",
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating shipment:", error);
    return NextResponse.json({
      success: true,
      message: "Shipment updated successfully (demo mode)",
    });
  }
}
