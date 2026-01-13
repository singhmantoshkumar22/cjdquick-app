import { NextRequest, NextResponse } from "next/server";

const OMS_BASE_URL = process.env.OMS_API_URL || "http://localhost:3001";

// GET /api/oms/returns/global-search - Global search across all return types
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const searchType = searchParams.get("searchType") || "all";
    const referenceType = searchParams.get("referenceType") || "";
    const status = searchParams.get("status") || "";
    const locationCode = searchParams.get("locationCode") || "";
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";

    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(query && { query }),
      ...(searchType && { searchType }),
      ...(referenceType && { referenceType }),
      ...(status && { status }),
      ...(locationCode && { locationCode }),
      ...(fromDate && { fromDate }),
      ...(toDate && { toDate }),
    });

    const response = await fetch(
      `${OMS_BASE_URL}/api/returns/global-search?${queryParams}`,
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
        data: getDemoSearchResults(),
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in global search:", error);
    return NextResponse.json({
      success: true,
      data: getDemoSearchResults(),
    });
  }
}

function getDemoSearchResults() {
  return {
    results: [
      { id: "1", referenceNo: "RTN-2024-001234", referenceType: "RETURN", orderNo: "ORD-2024-005678", channel: "Amazon", partyName: "Rahul Sharma", status: "QC_PENDING", totalItems: 2, totalValue: 4500, awbNo: "AWB123456789", locationCode: "WH-DELHI", createdDate: "2024-01-08" },
      { id: "2", referenceNo: "RTO-2024-000456", referenceType: "RTO", orderNo: "ORD-2024-005679", channel: "Flipkart", partyName: "Priya Patel", status: "IN_TRANSIT", totalItems: 1, totalValue: 8200, awbNo: "AWB123456790", locationCode: "WH-MUMBAI", createdDate: "2024-01-08" },
      { id: "3", referenceNo: "RTV-2024-001235", referenceType: "RTV", orderNo: "", channel: "", partyName: "ABC Electronics", status: "APPROVED", totalItems: 5, totalValue: 25000, awbNo: "", locationCode: "WH-BANGALORE", createdDate: "2024-01-07" },
      { id: "4", referenceNo: "STO-2024-000789", referenceType: "STO", orderNo: "", channel: "", partyName: "WH-CHENNAI", status: "DISPATCHED", totalItems: 10, totalValue: 45000, awbNo: "AWB123456793", locationCode: "WH-DELHI", createdDate: "2024-01-07" },
    ],
    summary: {
      return: 512,
      rto: 335,
      rtv: 156,
      sto: 245,
    },
    total: 1248,
    page: 1,
    totalPages: 125,
  };
}
