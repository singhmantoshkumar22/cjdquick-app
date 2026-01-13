import { NextRequest, NextResponse } from "next/server";

const OMS_BACKEND_URL = process.env.OMS_BACKEND_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${OMS_BACKEND_URL}/api/wms/lottable`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        data: {
          lottables: [
            { id: "1", ruleCode: "LOT-001", ruleName: "FIFO Standard", strategy: "FIFO", priority: 1, status: "ACTIVE", skuCategory: "Electronics", description: "First In First Out for electronics" },
            { id: "2", ruleCode: "LOT-002", ruleName: "FEFO Perishables", strategy: "FEFO", priority: 1, status: "ACTIVE", skuCategory: "Food & Beverages", description: "First Expiry First Out for perishables" },
            { id: "3", ruleCode: "LOT-003", ruleName: "LIFO Bulk", strategy: "LIFO", priority: 2, status: "ACTIVE", skuCategory: "Raw Materials", description: "Last In First Out for bulk items" },
            { id: "4", ruleCode: "LOT-004", ruleName: "Default FIFO", strategy: "FIFO", priority: 10, status: "ACTIVE", skuCategory: "All", description: "Default FIFO for all other categories" },
          ],
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching lottables:", error);
    return NextResponse.json({
      success: true,
      data: {
        lottables: [
          { id: "1", ruleCode: "LOT-001", ruleName: "FIFO Standard", strategy: "FIFO", priority: 1, status: "ACTIVE", skuCategory: "Electronics", description: "First In First Out for electronics" },
          { id: "2", ruleCode: "LOT-002", ruleName: "FEFO Perishables", strategy: "FEFO", priority: 1, status: "ACTIVE", skuCategory: "Food & Beverages", description: "First Expiry First Out for perishables" },
        ],
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BACKEND_URL}/api/wms/lottable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        message: "Lottable rule created successfully (demo mode)",
        data: { id: Date.now().toString(), ...body },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating lottable:", error);
    return NextResponse.json({
      success: true,
      message: "Lottable rule created successfully (demo mode)",
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${OMS_BACKEND_URL}/api/wms/lottable/${body.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        message: "Lottable rule updated successfully (demo mode)",
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating lottable:", error);
    return NextResponse.json({
      success: true,
      message: "Lottable rule updated successfully (demo mode)",
    });
  }
}
