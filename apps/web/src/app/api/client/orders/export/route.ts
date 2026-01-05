import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";
import { getClientFromRequest } from "@/lib/client-auth";

export async function GET(request: NextRequest) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const status = searchParams.get("status");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const where: any = {
      clientId: clientContext.id,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    if (fromDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(fromDate) };
    }

    if (toDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(toDate) };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10000, // Limit to 10k records
      include: {
        warehouse: {
          select: { name: true, code: true },
        },
        partner: {
          select: { displayName: true, code: true },
        },
      },
    });

    if (format === "csv") {
      const headers = [
        "Order Number",
        "AWB Number",
        "Status",
        "Created At",
        "Customer Name",
        "Customer Phone",
        "Customer Email",
        "Delivery Address",
        "Delivery Pincode",
        "Delivery City",
        "Delivery State",
        "Weight (kg)",
        "Chargeable Weight (kg)",
        "Item Description",
        "Item Value",
        "Item Quantity",
        "Payment Mode",
        "COD Amount",
        "Warehouse",
        "Partner",
        "Manifested At",
        "Delivered At",
        "Client Order ID",
      ];

      const rows = orders.map((order) => [
        order.orderNumber,
        order.awbNumber || "",
        order.status,
        order.createdAt.toISOString(),
        order.customerName,
        order.customerPhone,
        order.customerEmail || "",
        `"${order.deliveryAddress.replace(/"/g, '""')}"`,
        order.deliveryPincode,
        order.deliveryCity,
        order.deliveryState,
        order.weightKg,
        order.chargeableWeight || order.weightKg,
        `"${order.itemDescription.replace(/"/g, '""')}"`,
        order.itemValue,
        order.itemQuantity,
        order.paymentMode,
        order.codAmount,
        order.warehouse?.name || "",
        order.partner?.displayName || "",
        order.manifestedAt?.toISOString() || "",
        order.deliveredAt?.toISOString() || "",
        order.clientOrderId || "",
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="orders_export_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // JSON format
    return NextResponse.json({
      success: true,
      data: orders.map((order) => ({
        orderNumber: order.orderNumber,
        awbNumber: order.awbNumber,
        status: order.status,
        createdAt: order.createdAt,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        deliveryAddress: order.deliveryAddress,
        deliveryPincode: order.deliveryPincode,
        deliveryCity: order.deliveryCity,
        deliveryState: order.deliveryState,
        weightKg: order.weightKg,
        chargeableWeight: order.chargeableWeight,
        itemDescription: order.itemDescription,
        itemValue: order.itemValue,
        itemQuantity: order.itemQuantity,
        paymentMode: order.paymentMode,
        codAmount: order.codAmount,
        warehouse: order.warehouse?.name,
        partner: order.partner?.displayName,
        manifestedAt: order.manifestedAt,
        deliveredAt: order.deliveredAt,
        clientOrderId: order.clientOrderId,
      })),
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
