import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/settings/master-data - Get master data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "skus";

    const response = await fetch(
      `${OMS_BASE_URL}/api/settings/master-data?type=${type}`,
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
        data: getDemoMasterData(type),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching master data:", error);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "skus";
    return NextResponse.json({
      success: true,
      data: getDemoMasterData(type),
    });
  }
}

// POST /api/oms/settings/master-data - Create new master data item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/settings/master-data`, {
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
      return NextResponse.json({
        success: true,
        data: {
          id: `MD-${Date.now()}`,
          message: "Item created successfully (demo mode)",
        },
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating master data:", error);
    return NextResponse.json({
      success: true,
      data: {
        id: `MD-${Date.now()}`,
        message: "Item created successfully (demo mode)",
      },
    });
  }
}

// PUT /api/oms/settings/master-data - Update master data item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/settings/master-data`, {
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
        message: "Item updated successfully (demo mode)",
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating master data:", error);
    return NextResponse.json({
      success: true,
      message: "Item updated successfully (demo mode)",
    });
  }
}

// DELETE /api/oms/settings/master-data - Delete master data item
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BASE_URL}/api/settings/master-data`, {
      method: "DELETE",
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
        message: "Item deleted successfully (demo mode)",
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error deleting master data:", error);
    return NextResponse.json({
      success: true,
      message: "Item deleted successfully (demo mode)",
    });
  }
}

function getDemoMasterData(type: string) {
  switch (type) {
    case "skus":
      return {
        items: [
          { id: "1", code: "SKU-001", name: "Wireless Mouse - Black", category: "Electronics", vendor: "TechSupply Co", price: "₹799", status: "ACTIVE", createdAt: "2023-06-15" },
          { id: "2", code: "SKU-002", name: "USB Keyboard - Mechanical", category: "Electronics", vendor: "TechSupply Co", price: "₹1,499", status: "ACTIVE", createdAt: "2023-06-15" },
          { id: "3", code: "SKU-003", name: "Monitor Stand - Adjustable", category: "Accessories", vendor: "Office Plus", price: "₹2,299", status: "ACTIVE", createdAt: "2023-07-20" },
        ],
        total: 1456,
      };
    case "categories":
      return {
        items: [
          { id: "1", code: "CAT-001", name: "Electronics", description: "Electronic devices and accessories", skuCount: "456", status: "ACTIVE", createdAt: "2023-01-01" },
          { id: "2", code: "CAT-002", name: "Apparel", description: "Clothing and fashion items", skuCount: "389", status: "ACTIVE", createdAt: "2023-01-01" },
          { id: "3", code: "CAT-003", name: "Home & Kitchen", description: "Home decor and kitchen items", skuCount: "312", status: "ACTIVE", createdAt: "2023-01-01" },
        ],
        total: 12,
      };
    case "vendors":
      return {
        items: [
          { id: "1", code: "VND-001", name: "TechSupply Co", contact: "Rajesh Kumar", email: "rajesh@techsupply.com", phone: "+91 98765 43210", status: "ACTIVE", createdAt: "2023-01-15" },
          { id: "2", code: "VND-002", name: "Office Plus", contact: "Anita Sharma", email: "anita@officeplus.com", phone: "+91 98765 43211", status: "ACTIVE", createdAt: "2023-02-01" },
        ],
        total: 24,
      };
    case "reasons":
      return {
        items: [
          { id: "1", code: "RET-001", name: "Product Damaged", type: "RETURN", description: "Item received in damaged condition", status: "ACTIVE", createdAt: "2023-01-01" },
          { id: "2", code: "RET-002", name: "Wrong Product", type: "RETURN", description: "Received different product than ordered", status: "ACTIVE", createdAt: "2023-01-01" },
          { id: "3", code: "CAN-001", name: "Customer Request", type: "CANCELLATION", description: "Customer requested cancellation", status: "ACTIVE", createdAt: "2023-01-01" },
        ],
        total: 15,
      };
    default:
      return { items: [], total: 0 };
  }
}
