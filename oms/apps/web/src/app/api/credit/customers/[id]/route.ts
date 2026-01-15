import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { auth } from "@/lib/auth";
import {
  getCustomerCreditSummary,
  updateCreditLimit,
  checkCredit,
} from "@/lib/services/credit-service";

// GET /api/credit/customers/[id] - Get customer credit details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const creditSummary = await getCustomerCreditSummary(id);

    if (!creditSummary) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(creditSummary);
  } catch (error) {
    console.error("Error fetching customer credit:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer credit" },
      { status: 500 }
    );
  }
}

// PATCH /api/credit/customers/[id] - Update customer credit settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const {
      creditEnabled,
      creditLimit,
      creditStatus,
      paymentTermType,
      paymentTermDays,
      dunningEnabled,
      dunningDays,
      remarks,
    } = body;

    // If changing credit limit, use the service
    if (creditLimit !== undefined && creditLimit !== Number(existing.creditLimit)) {
      await updateCreditLimit(id, parseFloat(creditLimit), session.user.id!, remarks);
    }

    // Update other fields
    const updateData: Record<string, unknown> = {};
    if (creditEnabled !== undefined) updateData.creditEnabled = creditEnabled;
    if (creditStatus !== undefined) updateData.creditStatus = creditStatus;
    if (paymentTermType !== undefined) updateData.paymentTermType = paymentTermType;
    if (paymentTermDays !== undefined) updateData.paymentTermDays = paymentTermDays;
    if (dunningEnabled !== undefined) updateData.dunningEnabled = dunningEnabled;
    if (dunningDays !== undefined) updateData.dunningDays = dunningDays;

    // Only update if there are fields to update
    if (Object.keys(updateData).length > 0) {
      await prisma.customer.update({
        where: { id },
        data: updateData,
      });
    }

    // Return updated summary
    const updatedSummary = await getCustomerCreditSummary(id);
    return NextResponse.json(updatedSummary);
  } catch (error) {
    console.error("Error updating customer credit:", error);
    return NextResponse.json(
      { error: "Failed to update customer credit" },
      { status: 500 }
    );
  }
}

// POST /api/credit/customers/[id] - Check credit for amount
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { amount } = body;

    if (amount === undefined) {
      return NextResponse.json({ error: "amount is required" }, { status: 400 });
    }

    const result = await checkCredit(id, parseFloat(amount));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking credit:", error);
    return NextResponse.json(
      { error: "Failed to check credit" },
      { status: 500 }
    );
  }
}
