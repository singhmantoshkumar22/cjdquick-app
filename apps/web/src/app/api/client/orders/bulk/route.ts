import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";
import { getClientFromRequest } from "@/lib/client-auth";

interface BulkOrderData {
  warehouseId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryPincode: string;
  deliveryCity?: string;
  deliveryState?: string;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  itemDescription: string;
  itemValue?: number;
  itemQuantity?: number;
  itemSku?: string;
  paymentMode?: string;
  codAmount?: number;
  clientOrderId?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orders } = body as { orders: BulkOrderData[] };

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { success: false, error: "No orders provided" },
        { status: 400 }
      );
    }

    if (orders.length > 500) {
      return NextResponse.json(
        { success: false, error: "Maximum 500 orders per upload" },
        { status: 400 }
      );
    }

    // Validate all orders first
    const errors: { row: number; error: string }[] = [];
    const validOrders: (BulkOrderData & { rowIndex: number })[] = [];

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const rowNum = i + 2; // Row 2 onwards (row 1 is header)

      if (!order.customerName) {
        errors.push({ row: rowNum, error: "Customer name is required" });
        continue;
      }
      if (!order.customerPhone) {
        errors.push({ row: rowNum, error: "Customer phone is required" });
        continue;
      }
      if (!order.deliveryAddress) {
        errors.push({ row: rowNum, error: "Delivery address is required" });
        continue;
      }
      if (!order.deliveryPincode) {
        errors.push({ row: rowNum, error: "Delivery pincode is required" });
        continue;
      }
      if (!order.weightKg || order.weightKg <= 0) {
        errors.push({ row: rowNum, error: "Weight must be greater than 0" });
        continue;
      }
      if (!order.itemDescription) {
        errors.push({ row: rowNum, error: "Item description is required" });
        continue;
      }
      if (order.paymentMode === "COD" && (!order.codAmount || order.codAmount <= 0)) {
        errors.push({ row: rowNum, error: "COD amount is required for COD orders" });
        continue;
      }

      validOrders.push({ ...order, rowIndex: i });
    }

    if (validOrders.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid orders to process",
        errors,
      });
    }

    // Get current order count for generating order numbers
    const orderCount = await prisma.order.count({ where: { clientId: clientContext.id } });

    // Create orders in transaction
    const createdOrders = await prisma.$transaction(
      validOrders.map((order, index) => {
        const orderNumber = `CJD${Date.now().toString(36).toUpperCase()}${(orderCount + index + 1).toString().padStart(4, "0")}`;

        let volumetricWeight = null;
        if (order.lengthCm && order.widthCm && order.heightCm) {
          volumetricWeight = (order.lengthCm * order.widthCm * order.heightCm) / 5000;
        }

        const chargeableWeight = volumetricWeight
          ? Math.max(order.weightKg, volumetricWeight)
          : order.weightKg;

        return prisma.order.create({
          data: {
            orderNumber,
            clientId: clientContext.id,
            warehouseId: order.warehouseId,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerEmail: order.customerEmail,
            deliveryAddress: order.deliveryAddress,
            deliveryPincode: order.deliveryPincode,
            deliveryCity: order.deliveryCity || "",
            deliveryState: order.deliveryState || "",
            originPincode: "",
            weightKg: order.weightKg,
            lengthCm: order.lengthCm,
            widthCm: order.widthCm,
            heightCm: order.heightCm,
            volumetricWeight,
            chargeableWeight,
            itemDescription: order.itemDescription,
            itemValue: order.itemValue || 0,
            itemQuantity: order.itemQuantity || 1,
            itemSku: order.itemSku,
            paymentMode: order.paymentMode || "PREPAID",
            codAmount: order.paymentMode === "COD" ? order.codAmount || 0 : 0,
            clientOrderId: order.clientOrderId,
            notes: order.notes,
            status: "CREATED",
          },
        });
      })
    );

    // Create initial events for all orders
    await prisma.orderEvent.createMany({
      data: createdOrders.map((order) => ({
        orderId: order.id,
        status: "CREATED",
        statusText: "Order created via bulk upload",
        source: "CLIENT_PORTAL",
        eventTime: new Date(),
      })),
    });

    return NextResponse.json({
      success: true,
      data: {
        created: createdOrders.length,
        failed: errors.length,
        errors,
        orders: createdOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
        })),
      },
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
