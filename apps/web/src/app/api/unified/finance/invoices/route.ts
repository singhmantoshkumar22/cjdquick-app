import { NextRequest, NextResponse } from "next/server";
import { getAnyAuthContext } from "@/lib/unified-auth";
import {
  generateInvoice,
  getInvoiceDetails,
  listInvoices,
  updateInvoiceStatus,
} from "@/lib/unified-finance-service";

// GET: List invoices or get single invoice
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
    const invoiceId = searchParams.get("id");

    // Get single invoice details
    if (invoiceId) {
      const invoice = await getInvoiceDetails(invoiceId);
      if (!invoice) {
        return NextResponse.json(
          { success: false, error: "Invoice not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: invoice });
    }

    // List invoices
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

    const invoices = await listInvoices({
      brandId,
      status,
      fromDate,
      toDate,
      page,
      pageSize,
    });

    return NextResponse.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error("List invoices error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// POST: Generate invoice
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
    const {
      brandId,
      periodStart,
      periodEnd,
      includeDelivered = true,
      includeRto = true,
    } = body;

    if (!brandId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, error: "brandId, periodStart, and periodEnd are required" },
        { status: 400 }
      );
    }

    const invoice = await generateInvoice({
      brandId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      includeDelivered,
      includeRto,
    });

    return NextResponse.json({
      success: true,
      data: invoice,
      message: `Invoice ${invoice.invoiceNumber} generated`,
    });
  } catch (error: any) {
    console.error("Generate invoice error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate invoice" },
      { status: 400 }
    );
  }
}

// PATCH: Update invoice status
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
    const { invoiceId, status, paidAmount } = body;

    if (!invoiceId || !status) {
      return NextResponse.json(
        { success: false, error: "invoiceId and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Valid options: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const invoice = await updateInvoiceStatus(invoiceId, status, paidAmount);

    return NextResponse.json({
      success: true,
      data: invoice,
      message: `Invoice status updated to ${status}`,
    });
  } catch (error: any) {
    console.error("Update invoice error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update invoice" },
      { status: 400 }
    );
  }
}
