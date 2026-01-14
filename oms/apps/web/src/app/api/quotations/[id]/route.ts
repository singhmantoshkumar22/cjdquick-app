import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { auth } from "@/lib/auth";

// GET /api/quotations/[id] - Get quotation details
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

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            customerGroup: true,
          },
        },
        items: {
          include: {
            sku: {
              select: { id: true, code: true, name: true, barcode: true },
            },
          },
        },
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        approvedByUser: {
          select: { id: true, name: true, email: true },
        },
        convertedOrder: {
          select: { id: true, orderNo: true, status: true },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    return NextResponse.json(quotation);
  } catch (error) {
    console.error("Error fetching quotation:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotation" },
      { status: 500 }
    );
  }
}

// PATCH /api/quotations/[id] - Update quotation
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

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action, validUntil, notes, terms, rejectionReason, items } = body;

    // Handle status transitions
    if (action) {
      switch (action) {
        case "submit":
          if (quotation.status !== "DRAFT") {
            return NextResponse.json(
              { error: "Only draft quotations can be submitted" },
              { status: 400 }
            );
          }

          const submittedQuotation = await prisma.quotation.update({
            where: { id },
            data: { status: "PENDING_APPROVAL" },
            include: { customer: true, items: { include: { sku: true } } },
          });
          return NextResponse.json(submittedQuotation);

        case "approve":
          if (quotation.status !== "PENDING_APPROVAL") {
            return NextResponse.json(
              { error: "Only pending quotations can be approved" },
              { status: 400 }
            );
          }

          const approvedQuotation = await prisma.quotation.update({
            where: { id },
            data: {
              status: "APPROVED",
              approvedBy: session.user.id,
              approvedAt: new Date(),
            },
            include: { customer: true, items: { include: { sku: true } } },
          });
          return NextResponse.json(approvedQuotation);

        case "reject":
          if (quotation.status !== "PENDING_APPROVAL") {
            return NextResponse.json(
              { error: "Only pending quotations can be rejected" },
              { status: 400 }
            );
          }

          const rejectedQuotation = await prisma.quotation.update({
            where: { id },
            data: {
              status: "REJECTED",
              rejectionReason,
            },
            include: { customer: true, items: { include: { sku: true } } },
          });
          return NextResponse.json(rejectedQuotation);

        case "convert":
          if (quotation.status !== "APPROVED") {
            return NextResponse.json(
              { error: "Only approved quotations can be converted to orders" },
              { status: 400 }
            );
          }

          // Check if already converted
          if (quotation.convertedToOrderId) {
            return NextResponse.json(
              { error: "Quotation already converted to order" },
              { status: 400 }
            );
          }

          // Convert to order in transaction
          const result = await prisma.$transaction(async (tx) => {
            // Generate order number
            const orderSequence = await tx.sequence.upsert({
              where: { name: "order" },
              update: { currentValue: { increment: 1 } },
              create: { name: "order", prefix: "ORD", currentValue: 1, paddingLength: 8 },
            });
            const orderNo = `${orderSequence.prefix}${String(orderSequence.currentValue).padStart(orderSequence.paddingLength, "0")}`;

            // Get quotation items
            const quotationItems = await tx.quotationItem.findMany({
              where: { quotationId: id },
              include: { sku: true },
            });

            // Create order
            const order = await tx.order.create({
              data: {
                orderNo,
                channel: "B2B",
                status: "CONFIRMED",
                paymentMode: "CREDIT",
                customerId: quotation.customerId,
                paymentTermType: quotation.paymentTermType,
                paymentTermDays: quotation.paymentTermDays,
                subtotal: quotation.subtotal,
                taxAmount: quotation.taxAmount,
                discount: quotation.discountAmount,
                totalAmount: quotation.totalAmount,
                items: {
                  create: quotationItems.map((item) => ({
                    skuId: item.skuId,
                    skuCode: item.sku.code,
                    skuName: item.sku.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discountAmount,
                    taxAmount: item.taxAmount,
                    totalPrice: item.totalPrice,
                  })),
                },
              },
            });

            // Update quotation
            await tx.quotation.update({
              where: { id },
              data: {
                status: "CONVERTED",
                convertedToOrderId: order.id,
                convertedAt: new Date(),
              },
            });

            // Update customer credit if credit is enabled
            if (quotation.customer.creditEnabled) {
              await tx.customer.update({
                where: { id: quotation.customerId },
                data: {
                  creditUsed: { increment: quotation.totalAmount },
                },
              });

              // Create credit transaction
              await tx.creditTransaction.create({
                data: {
                  customerId: quotation.customerId,
                  type: "UTILIZATION",
                  amount: quotation.totalAmount,
                  balanceBefore: quotation.customer.creditLimit.minus(quotation.customer.creditUsed),
                  balanceAfter: quotation.customer.creditLimit.minus(quotation.customer.creditUsed).minus(quotation.totalAmount),
                  referenceType: "ORDER",
                  referenceId: order.id,
                  referenceNo: orderNo,
                  description: `Order created from quotation ${quotation.quotationNo}`,
                  createdBy: session.user.id,
                },
              });
            }

            return order;
          });

          return NextResponse.json({
            success: true,
            order: result,
            message: "Quotation converted to order successfully",
          });

        case "cancel":
          if (["CONVERTED", "CANCELLED", "EXPIRED"].includes(quotation.status)) {
            return NextResponse.json(
              { error: "Cannot cancel this quotation" },
              { status: 400 }
            );
          }

          const cancelledQuotation = await prisma.quotation.update({
            where: { id },
            data: { status: "CANCELLED" },
            include: { customer: true, items: { include: { sku: true } } },
          });
          return NextResponse.json(cancelledQuotation);

        default:
          return NextResponse.json(
            { error: `Unknown action: ${action}` },
            { status: 400 }
          );
      }
    }

    // Regular update (only for DRAFT quotations)
    if (quotation.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft quotations can be edited" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (validUntil !== undefined) updateData.validUntil = new Date(validUntil);
    if (notes !== undefined) updateData.notes = notes;
    if (terms !== undefined) updateData.terms = terms;

    // Update items if provided
    if (items && Array.isArray(items)) {
      await prisma.$transaction(async (tx) => {
        // Delete existing items
        await tx.quotationItem.deleteMany({ where: { quotationId: id } });

        // Calculate new totals
        let subtotal = 0;
        let taxAmount = 0;
        let discountAmount = 0;

        for (const item of items) {
          const lineTotal = item.quantity * item.unitPrice;
          const lineDiscount = lineTotal * ((item.discountPercent || 0) / 100);
          const lineTaxable = lineTotal - lineDiscount;
          const lineTax = lineTaxable * ((item.taxRate || 18) / 100);

          subtotal += lineTotal;
          discountAmount += lineDiscount;
          taxAmount += lineTax;

          await tx.quotationItem.create({
            data: {
              quotationId: id,
              skuId: item.skuId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountPercent: item.discountPercent || 0,
              discountAmount: lineDiscount,
              taxRate: item.taxRate || 18,
              taxAmount: lineTax,
              totalPrice: lineTaxable + lineTax,
            },
          });
        }

        updateData.subtotal = subtotal;
        updateData.discountAmount = discountAmount;
        updateData.taxAmount = taxAmount;
        updateData.totalAmount = subtotal - discountAmount + taxAmount;
      });
    }

    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: {
          include: { sku: { select: { id: true, code: true, name: true } } },
        },
      },
    });

    return NextResponse.json(updatedQuotation);
  } catch (error) {
    console.error("Error updating quotation:", error);
    return NextResponse.json(
      { error: "Failed to update quotation" },
      { status: 500 }
    );
  }
}

// DELETE /api/quotations/[id] - Delete quotation
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

    const quotation = await prisma.quotation.findUnique({ where: { id } });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (quotation.status === "CONVERTED") {
      return NextResponse.json(
        { error: "Cannot delete converted quotation" },
        { status: 400 }
      );
    }

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
      await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      await tx.quotation.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quotation:", error);
    return NextResponse.json(
      { error: "Failed to delete quotation" },
      { status: 500 }
    );
  }
}
