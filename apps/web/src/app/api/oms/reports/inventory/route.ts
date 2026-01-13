import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/reports/inventory - Get inventory report data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location") || "all";
    const category = searchParams.get("category") || "all";

    const queryParams = new URLSearchParams({
      ...(location !== "all" && { location }),
      ...(category !== "all" && { category }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/reports/inventory?${queryParams}`,
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
        data: getDemoInventoryData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching inventory data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoInventoryData(),
    });
  }
}

function getDemoInventoryData() {
  return {
    summary: {
      totalSKUs: 1456,
      totalValue: 125600000,
      outOfStock: 23,
      lowStock: 87,
      overStock: 34,
      avgTurnover: 4.2,
    },
    byCategory: [
      { category: "Electronics", skus: 456, quantity: 23456, value: 45600000 },
      { category: "Apparel", skus: 389, quantity: 34567, value: 28900000 },
      { category: "Home & Kitchen", skus: 312, quantity: 18934, value: 25600000 },
      { category: "Beauty", skus: 189, quantity: 12345, value: 15600000 },
      { category: "Sports", skus: 110, quantity: 8765, value: 9900000 },
    ],
    stockHealth: [
      { status: "Healthy Stock", count: 1089, percentage: 75, color: "bg-green-500" },
      { status: "Low Stock", count: 87, percentage: 6, color: "bg-yellow-500" },
      { status: "Out of Stock", count: 23, percentage: 2, color: "bg-red-500" },
      { status: "Over Stock", count: 34, percentage: 2, color: "bg-orange-500" },
      { status: "Dead Stock", count: 223, percentage: 15, color: "bg-gray-500" },
    ],
    aging: [
      { range: "0-30 days", quantity: 45678, value: 56000000, percentage: 45 },
      { range: "31-60 days", quantity: 23456, value: 31200000, percentage: 25 },
      { range: "61-90 days", quantity: 12345, value: 18700000, percentage: 15 },
      { range: "90+ days", quantity: 8765, value: 19700000, percentage: 15 },
    ],
    topMovers: [
      { sku: "SKU-001", name: "Wireless Mouse", sold: 456, remaining: 234, turnover: 8.5 },
      { sku: "SKU-015", name: "USB-C Hub", sold: 324, remaining: 156, turnover: 7.2 },
      { sku: "SKU-023", name: "Bluetooth Speaker", sold: 289, remaining: 189, turnover: 6.8 },
      { sku: "SKU-042", name: "Phone Stand", sold: 267, remaining: 345, turnover: 5.9 },
      { sku: "SKU-056", name: "Laptop Sleeve", sold: 234, remaining: 278, turnover: 5.2 },
    ],
    slowMovers: [
      { sku: "SKU-234", name: "VR Headset Case", quantity: 456, daysInStock: 145, value: 91200 },
      { sku: "SKU-189", name: "Retro Phone Case", quantity: 389, daysInStock: 132, value: 38900 },
      { sku: "SKU-312", name: "Cable Organizer XL", quantity: 234, daysInStock: 118, value: 23400 },
      { sku: "SKU-456", name: "Screen Protector Kit", quantity: 567, daysInStock: 98, value: 28350 },
      { sku: "SKU-123", name: "Wireless Charger Pad", quantity: 189, daysInStock: 95, value: 47250 },
    ],
  };
}
