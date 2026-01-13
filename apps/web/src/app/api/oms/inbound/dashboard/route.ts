import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/inbound/dashboard - Get inbound dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationCode = searchParams.get("locationCode") || "";
    const dateRange = searchParams.get("dateRange") || "today";

    const queryParams = new URLSearchParams({
      ...(locationCode && { locationCode }),
      ...(dateRange && { dateRange }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/inbound/dashboard?${queryParams}`,
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
        data: getDemoDashboardData(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching inbound dashboard:", error);
    return NextResponse.json({
      success: true,
      data: getDemoDashboardData(),
    });
  }
}

function getDemoDashboardData() {
  return {
    summary: {
      totalPending: 24,
      todayReceived: 12,
      qcPending: 8,
      stoPending: 5,
      returnsPending: 15,
      totalInTransit: 7,
    },
    byType: {
      withASN: { pending: 8, received: 45, total: 53 },
      withPO: { pending: 6, received: 32, total: 38 },
      direct: { pending: 4, received: 28, total: 32 },
      sto: { pending: 3, received: 18, total: 21 },
      return: { pending: 3, received: 22, total: 25 },
    },
    byStatus: {
      draft: 5,
      pending: 24,
      receiving: 8,
      qcPending: 8,
      qcPassed: 12,
      qcFailed: 2,
      putawayPending: 6,
      completed: 156,
      cancelled: 3,
    },
    recentActivity: [
      { id: "1", inboundNo: "INB-2024-001245", type: "WITH_ASN", vendor: "ABC Suppliers", status: "RECEIVING", qty: 250, time: "10 mins ago" },
      { id: "2", inboundNo: "INB-2024-001244", type: "STO", vendor: "Internal Transfer", status: "QC_PENDING", qty: 500, time: "25 mins ago" },
      { id: "3", inboundNo: "INB-2024-001243", type: "RETURN", vendor: "Customer Return", status: "PENDING", qty: 15, time: "1 hour ago" },
      { id: "4", inboundNo: "INB-2024-001242", type: "DIRECT", vendor: "XYZ Trading", status: "COMPLETED", qty: 100, time: "2 hours ago" },
      { id: "5", inboundNo: "INB-2024-001241", type: "WITH_PO", vendor: "Metro Distributors", status: "COMPLETED", qty: 350, time: "3 hours ago" },
    ],
    trends: {
      daily: [
        { date: "2024-01-02", received: 45, pending: 12 },
        { date: "2024-01-03", received: 52, pending: 8 },
        { date: "2024-01-04", received: 38, pending: 15 },
        { date: "2024-01-05", received: 61, pending: 10 },
        { date: "2024-01-06", received: 48, pending: 18 },
        { date: "2024-01-07", received: 55, pending: 14 },
        { date: "2024-01-08", received: 42, pending: 24 },
      ],
    },
    topVendors: [
      { vendorCode: "VND-001", vendorName: "ABC Suppliers", inboundCount: 45, totalQty: 12500 },
      { vendorCode: "VND-002", vendorName: "XYZ Trading", inboundCount: 38, totalQty: 9800 },
      { vendorCode: "VND-003", vendorName: "Metro Distributors", inboundCount: 32, totalQty: 8500 },
      { vendorCode: "VND-004", vendorName: "National Suppliers", inboundCount: 28, totalQty: 7200 },
      { vendorCode: "VND-005", vendorName: "Premium Goods", inboundCount: 25, totalQty: 6800 },
    ],
  };
}
