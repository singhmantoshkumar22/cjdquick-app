import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import {
  generateRemittance,
  listRemittances,
  processRemittancePayment,
} from "@/lib/unified-finance-service";

// GET: List remittances
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
    const status = searchParams.get("status") || undefined;
    const fromDate = searchParams.get("fromDate")
      ? new Date(searchParams.get("fromDate")!)
      : undefined;
    const toDate = searchParams.get("toDate")
      ? new Date(searchParams.get("toDate")!)
      : undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const remittances = await listRemittances({
      brandId,
      status,
      fromDate,
      toDate,
      page,
      pageSize,
    });

    return NextResponse.json({
      success: true,
      data: remittances,
    });
  } catch (error) {
    console.error("List remittances error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch remittances" },
      { status: 500 }
    );
  }
}

// POST: Generate remittance
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
    const { brandId, periodStart, periodEnd, deductions } = body;

    if (!brandId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, error: "brandId, periodStart, and periodEnd are required" },
        { status: 400 }
      );
    }

    const remittance = await generateRemittance({
      brandId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      deductions,
    });

    return NextResponse.json({
      success: true,
      data: remittance,
      message: `Remittance ${remittance.remittanceNumber} generated`,
    });
  } catch (error: any) {
    console.error("Generate remittance error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate remittance" },
      { status: 400 }
    );
  }
}

// PATCH: Process remittance payment
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAnyAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { remittanceId, paymentMode, paymentRef } = body;

    if (!remittanceId || !paymentMode || !paymentRef) {
      return NextResponse.json(
        { success: false, error: "remittanceId, paymentMode, and paymentRef are required" },
        { status: 400 }
      );
    }

    const remittance = await processRemittancePayment(remittanceId, paymentMode, paymentRef);

    return NextResponse.json({
      success: true,
      data: remittance,
      message: "Remittance payment processed",
    });
  } catch (error: any) {
    console.error("Process remittance payment error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process remittance payment" },
      { status: 400 }
    );
  }
}
