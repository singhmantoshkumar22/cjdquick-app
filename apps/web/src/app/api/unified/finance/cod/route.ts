import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import {
  getCODPendingReconciliation,
  markCODCollected,
  bulkMarkCODCollected,
} from "@/lib/unified-finance-service";

// GET: Get COD orders pending reconciliation
export async function GET(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId") || undefined;
    const locationId = searchParams.get("locationId") || undefined;
    const transporterId = searchParams.get("transporterId") || undefined;
    const fromDate = searchParams.get("fromDate")
      ? new Date(searchParams.get("fromDate")!)
      : undefined;
    const toDate = searchParams.get("toDate")
      ? new Date(searchParams.get("toDate")!)
      : undefined;

    const result = await getCODPendingReconciliation({
      brandId,
      locationId,
      transporterId,
      fromDate,
      toDate,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get COD pending error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch COD orders" },
      { status: 500 }
    );
  }
}

// POST: Mark COD as collected
export async function POST(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, collectedAmount, paymentMode, paymentRef } = body;

    if (!orderId || collectedAmount === undefined || !paymentMode) {
      return NextResponse.json(
        { success: false, error: "orderId, collectedAmount, and paymentMode are required" },
        { status: 400 }
      );
    }

    const order = await markCODCollected(orderId, collectedAmount, paymentMode, paymentRef);

    return NextResponse.json({
      success: true,
      data: order,
      message: "COD marked as collected",
    });
  } catch (error: any) {
    console.error("Mark COD collected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to mark COD as collected" },
      { status: 400 }
    );
  }
}

// PUT: Bulk mark COD collected
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { collections } = body;

    if (!collections || !Array.isArray(collections) || collections.length === 0) {
      return NextResponse.json(
        { success: false, error: "collections array is required" },
        { status: 400 }
      );
    }

    // Validate each collection
    for (const collection of collections) {
      if (!collection.orderId || collection.collectedAmount === undefined || !collection.paymentMode) {
        return NextResponse.json(
          { success: false, error: "Each collection requires orderId, collectedAmount, and paymentMode" },
          { status: 400 }
        );
      }
    }

    const result = await bulkMarkCODCollected(collections);

    return NextResponse.json({
      success: result.success,
      data: result,
      message: `${result.processed} COD orders processed, ${result.failed} failed`,
    });
  } catch (error: any) {
    console.error("Bulk COD collection error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process COD collections" },
      { status: 500 }
    );
  }
}
