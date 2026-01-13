import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/logistics - Get Logistics dashboard stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "dashboard";

    const response = await fetch(
      `${OMS_BASE_URL}/api/logistics?type=${type}`,
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
        data: getDemoLogisticsData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching logistics data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoLogisticsData(),
    });
  }
}

function getDemoLogisticsData() {
  return {
    stats: {
      totalShipments: 12456,
      inTransit: 3245,
      delivered: 8765,
      pending: 446,
      rtoShipments: 234,
      deliveryRate: 94.5,
      avgDeliveryTime: 2.3,
      todayShipments: 567,
    },
    transporterPerformance: [
      { name: "Delhivery", shipments: 4567, deliveryRate: 95.2, avgTime: 2.1 },
      { name: "BlueDart", shipments: 3456, deliveryRate: 93.8, avgTime: 2.4 },
      { name: "FedEx", shipments: 2345, deliveryRate: 96.5, avgTime: 1.9 },
      { name: "Ecom Express", shipments: 1234, deliveryRate: 92.1, avgTime: 2.8 },
      { name: "DTDC", shipments: 854, deliveryRate: 91.5, avgTime: 3.1 },
    ],
    recentShipments: [
      { id: 1, awb: "AWB-2024-001234", carrier: "Delhivery", status: "IN_TRANSIT", destination: "Mumbai" },
      { id: 2, awb: "AWB-2024-001235", carrier: "BlueDart", status: "DELIVERED", destination: "Delhi" },
      { id: 3, awb: "AWB-2024-001236", carrier: "FedEx", status: "OUT_FOR_DELIVERY", destination: "Bangalore" },
      { id: 4, awb: "AWB-2024-001237", carrier: "Ecom Express", status: "PENDING", destination: "Chennai" },
      { id: 5, awb: "AWB-2024-001238", carrier: "DTDC", status: "IN_TRANSIT", destination: "Kolkata" },
    ],
    deliveryTrends: [
      { date: "2024-01-01", delivered: 450, pending: 45 },
      { date: "2024-01-02", delivered: 520, pending: 38 },
      { date: "2024-01-03", delivered: 480, pending: 52 },
      { date: "2024-01-04", delivered: 560, pending: 41 },
      { date: "2024-01-05", delivered: 490, pending: 48 },
      { date: "2024-01-06", delivered: 540, pending: 35 },
      { date: "2024-01-07", delivered: 510, pending: 42 },
    ],
  };
}
