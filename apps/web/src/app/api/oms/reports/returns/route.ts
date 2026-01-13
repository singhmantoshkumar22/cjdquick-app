import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/reports/returns - Get returns report data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get("dateRange") || "last30days";
    const channel = searchParams.get("channel") || "all";

    const queryParams = new URLSearchParams({
      dateRange,
      ...(channel !== "all" && { channel }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/reports/returns?${queryParams}`,
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
        data: getDemoReturnsData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching returns data:", error);
    return NextResponse.json({
      success: true,
      data: getDemoReturnsData(),
    });
  }
}

function getDemoReturnsData() {
  return {
    summary: {
      totalReturns: 281,
      returnRate: 4.8,
      avgProcessingTime: "2.3 days",
      pendingReturns: 34,
      refundAmount: 234500,
      restockRate: 72,
    },
    byReason: [
      { reason: "Product Damaged", count: 78, percentage: 28 },
      { reason: "Wrong Product Received", count: 56, percentage: 20 },
      { reason: "Quality Not As Expected", count: 48, percentage: 17 },
      { reason: "Size/Fit Issue", count: 42, percentage: 15 },
      { reason: "Changed Mind", count: 34, percentage: 12 },
      { reason: "Other", count: 23, percentage: 8 },
    ],
    byChannel: [
      { channel: "Amazon", returns: 126, returnRate: 4.8, refundAmount: 105525 },
      { channel: "Flipkart", returns: 84, returnRate: 4.8, refundAmount: 70350 },
      { channel: "Shopify", returns: 42, returnRate: 4.8, refundAmount: 35175 },
      { channel: "Manual", returns: 29, returnRate: 5.0, refundAmount: 23450 },
    ],
    byCategory: [
      { category: "Apparel", returns: 98, returnRate: 8.2 },
      { category: "Electronics", returns: 67, returnRate: 3.5 },
      { category: "Home & Kitchen", returns: 52, returnRate: 4.1 },
      { category: "Beauty", returns: 38, returnRate: 5.6 },
      { category: "Sports", returns: 26, returnRate: 4.2 },
    ],
    processingBreakdown: [
      { status: "Received", count: 45, avgTime: "0.5 days" },
      { status: "Inspected", count: 78, avgTime: "1.2 days" },
      { status: "Refund Processed", count: 124, avgTime: "2.1 days" },
      { status: "Restocked", count: 89, avgTime: "2.5 days" },
    ],
    refundBreakdown: [
      { type: "Full Refund", count: 198, amount: 178650 },
      { type: "Partial Refund", count: 56, amount: 39200 },
      { type: "Store Credit", count: 27, amount: 16650 },
    ],
    trend: [
      { date: "Week 1", returns: 62, returnRate: 4.6 },
      { date: "Week 2", returns: 71, returnRate: 4.9 },
      { date: "Week 3", returns: 68, returnRate: 4.7 },
      { date: "Week 4", returns: 80, returnRate: 5.1 },
    ],
  };
}
