import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { auth } from "@/lib/auth";

// GET /api/customers/[id] - Get customer details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        CustomerGroup: true,
        PriceList: {
          include: {
            PriceListItem: true,
          },
        },
        Order: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            orderNo: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
        Quotation: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            quotationNo: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
        B2BCreditTransaction: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: { Order: true, Quotation: true, B2BCreditTransaction: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Calculate credit metrics
    const creditMetrics = {
      creditLimit: customer.creditLimit,
      creditUsed: customer.creditUsed,
      creditAvailable: customer.creditLimit.minus(customer.creditUsed),
      utilizationPercentage: customer.creditLimit.gt(0)
        ? customer.creditUsed.div(customer.creditLimit).mul(100).toNumber()
        : 0,
    };

    return NextResponse.json({
      ...customer,
      creditMetrics,
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

// PATCH /api/customers/[id] - Update customer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      type,
      status,
      email,
      phone,
      gst,
      pan,
      billingAddress,
      shippingAddresses,
      customerGroupId,
      priceListId,
      creditEnabled,
      creditLimit,
      creditStatus,
      paymentTermType,
      paymentTermDays,
      dunningLevel,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (gst !== undefined) updateData.gst = gst;
    if (pan !== undefined) updateData.pan = pan;
    if (billingAddress !== undefined) updateData.billingAddress = billingAddress;
    if (shippingAddresses !== undefined) updateData.shippingAddresses = shippingAddresses;
    if (customerGroupId !== undefined) updateData.customerGroupId = customerGroupId;
    if (priceListId !== undefined) updateData.priceListId = priceListId;
    if (creditEnabled !== undefined) updateData.creditEnabled = creditEnabled;
    if (creditLimit !== undefined) updateData.creditLimit = creditLimit;
    if (creditStatus !== undefined) updateData.creditStatus = creditStatus;
    if (paymentTermType !== undefined) updateData.paymentTermType = paymentTermType;
    if (paymentTermDays !== undefined) updateData.paymentTermDays = paymentTermDays;
    if (dunningLevel !== undefined) updateData.dunningLevel = dunningLevel;

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        CustomerGroup: true,
        PriceList: true,
      },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Check for existing orders
    const orderCount = await prisma.order.count({
      where: { customerId: id },
    });

    if (orderCount > 0) {
      // Soft delete by setting status to INACTIVE
      await prisma.customer.update({
        where: { id },
        data: { status: "INACTIVE" },
      });

      return NextResponse.json({
        success: true,
        message: "Customer deactivated (has existing orders)",
      });
    }

    // Hard delete if no orders
    await prisma.$transaction(async (tx) => {
      await tx.b2BCreditTransaction.deleteMany({ where: { customerId: id } });
      await tx.quotation.deleteMany({ where: { customerId: id } });
      await tx.customer.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
