import { NextRequest, NextResponse } from "next/server";
import { prisma, OrderStatus } from "@oms/database";
import * as crypto from "crypto";

// POST /api/webhooks/channel - Handle marketplace webhooks
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    const configId = searchParams.get("configId");

    if (!source) {
      return NextResponse.json(
        { error: "Source parameter is required" },
        { status: 400 }
      );
    }

    const body = await request.text();
    const headers = Object.fromEntries(request.headers);

    // Verify webhook signature if config provided
    if (configId) {
      const channelConfig = await prisma.channelConfig.findUnique({
        where: { id: configId },
      });

      if (channelConfig) {
        const credentials = channelConfig.credentials as { webhookSecret?: string };
        if (credentials.webhookSecret) {
          const isValid = verifyWebhookSignature(
            source,
            body,
            headers,
            credentials.webhookSecret
          );
          if (!isValid) {
            console.error("Invalid webhook signature");
            return NextResponse.json(
              { error: "Invalid signature" },
              { status: 401 }
            );
          }
        }
      }
    }

    const payload = JSON.parse(body);

    switch (source.toLowerCase()) {
      case "shopify":
        return handleShopifyWebhook(payload, headers);
      case "flipkart":
        return handleFlipkartWebhook(payload);
      case "amazon":
        return handleAmazonWebhook(payload);
      default:
        return NextResponse.json(
          { error: `Unknown source: ${source}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Channel webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

function verifyWebhookSignature(
  source: string,
  body: string,
  headers: Record<string, string>,
  secret: string
): boolean {
  switch (source.toLowerCase()) {
    case "shopify": {
      const hmac = headers["x-shopify-hmac-sha256"];
      if (!hmac) return false;
      const hash = crypto
        .createHmac("sha256", secret)
        .update(body, "utf8")
        .digest("base64");
      return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(hash));
    }
    case "flipkart": {
      // Flipkart uses different signature method
      const signature = headers["x-flipkart-signature"];
      if (!signature) return false;
      const hash = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
      return signature === hash;
    }
    default:
      return true; // Skip verification for unknown sources
  }
}

async function handleShopifyWebhook(
  payload: ShopifyOrderPayload,
  headers: Record<string, string>
): Promise<NextResponse> {
  const topic = headers["x-shopify-topic"];

  switch (topic) {
    case "orders/create":
      return handleShopifyOrderCreate(payload);
    case "orders/updated":
      return handleShopifyOrderUpdate(payload);
    case "orders/cancelled":
      return handleShopifyOrderCancel(payload);
    case "orders/fulfilled":
      return handleShopifyOrderFulfilled(payload);
    case "refunds/create":
      return handleShopifyRefund(payload);
    default:
      console.log(`Unhandled Shopify topic: ${topic}`);
      return NextResponse.json({ received: true, topic });
  }
}

interface ShopifyOrderPayload {
  id: number;
  name: string;
  email?: string;
  created_at: string;
  financial_status: string;
  fulfillment_status?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  customer?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
  };
  shipping_address?: {
    name?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
  };
  line_items?: {
    sku?: string;
    quantity: number;
    price: string;
    tax_lines?: { price: string }[];
  }[];
  shipping_lines?: { price: string }[];
  total_discounts?: string;
  refunds?: {
    id: number;
    created_at: string;
    refund_line_items: { line_item_id: number; quantity: number }[];
  }[];
}

async function handleShopifyOrderCreate(payload: ShopifyOrderPayload): Promise<NextResponse> {
  const orderId = payload.name || payload.id.toString();

  // Check if order exists
  const existing = await prisma.order.findFirst({
    where: { externalOrderNo: orderId },
  });

  if (existing) {
    return NextResponse.json({
      received: true,
      message: "Order already exists",
      orderId: existing.id,
    });
  }

  // Queue for import or create directly based on configuration
  // For now, just acknowledge receipt
  console.log(`New Shopify order received: ${orderId}`);

  return NextResponse.json({
    received: true,
    message: "Order queued for import",
    externalOrderNo: orderId,
  });
}

async function handleShopifyOrderUpdate(payload: ShopifyOrderPayload): Promise<NextResponse> {
  const orderId = payload.name || payload.id.toString();

  const order = await prisma.order.findFirst({
    where: { externalOrderNo: orderId },
  });

  if (!order) {
    return NextResponse.json({
      received: true,
      message: "Order not found in system",
    });
  }

  // Update order status based on Shopify status
  let newStatus: OrderStatus | null = null;

  if (payload.cancelled_at) {
    newStatus = "CANCELLED";
  } else if (payload.fulfillment_status === "fulfilled") {
    newStatus = "SHIPPED";
  } else if (payload.financial_status === "paid") {
    // Order is paid but not shipped yet
    // OrderStatus doesn't have PENDING - check for CREATED
    if (order.status === "CREATED") {
      newStatus = "CONFIRMED";
    }
  }

  if (newStatus && order.status !== newStatus) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: newStatus },
    });
  }

  return NextResponse.json({
    received: true,
    orderId: order.id,
    status: newStatus || order.status,
  });
}

async function handleShopifyOrderCancel(payload: ShopifyOrderPayload): Promise<NextResponse> {
  const orderId = payload.name || payload.id.toString();

  const order = await prisma.order.findFirst({
    where: { externalOrderNo: orderId },
  });

  if (!order) {
    return NextResponse.json({
      received: true,
      message: "Order not found in system",
    });
  }

  // Only cancel if not already shipped
  if (!["SHIPPED", "DELIVERED", "OUT_FOR_DELIVERY"].includes(order.status)) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        remarks: payload.cancel_reason
          ? `Cancelled via Shopify: ${payload.cancel_reason}`
          : "Cancelled via Shopify webhook",
      },
    });
  }

  return NextResponse.json({
    received: true,
    orderId: order.id,
    cancelled: true,
  });
}

async function handleShopifyOrderFulfilled(payload: ShopifyOrderPayload): Promise<NextResponse> {
  const orderId = payload.name || payload.id.toString();

  const order = await prisma.order.findFirst({
    where: { externalOrderNo: orderId },
  });

  if (!order) {
    return NextResponse.json({
      received: true,
      message: "Order not found in system",
    });
  }

  // Update to shipped if not already
  if (!["SHIPPED", "DELIVERED", "OUT_FOR_DELIVERY"].includes(order.status)) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "SHIPPED" },
    });
  }

  return NextResponse.json({
    received: true,
    orderId: order.id,
    fulfilled: true,
  });
}

async function handleShopifyRefund(payload: ShopifyOrderPayload): Promise<NextResponse> {
  const orderId = payload.name || payload.id.toString();

  console.log(`Refund received for Shopify order: ${orderId}`);

  // Log refund for manual processing
  // In production, could create return record automatically

  return NextResponse.json({
    received: true,
    message: "Refund logged for processing",
  });
}

async function handleFlipkartWebhook(payload: {
  event_type: string;
  order_id?: string;
  shipment_id?: string;
  status?: string;
  data?: Record<string, unknown>;
}): Promise<NextResponse> {
  const { event_type, order_id, status } = payload;

  switch (event_type) {
    case "ORDER_PLACED":
    case "ORDER_APPROVED":
      console.log(`New Flipkart order: ${order_id}`);
      return NextResponse.json({ received: true, message: "Order queued" });

    case "ORDER_CANCELLED":
      if (order_id) {
        const order = await prisma.order.findFirst({
          where: { externalOrderNo: order_id },
        });

        if (order && !["SHIPPED", "DELIVERED"].includes(order.status)) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
          });
        }
      }
      return NextResponse.json({ received: true, cancelled: true });

    case "SHIPMENT_DELIVERED":
      if (order_id) {
        const order = await prisma.order.findFirst({
          where: { externalOrderNo: order_id },
        });

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "DELIVERED" },
          });
        }
      }
      return NextResponse.json({ received: true, delivered: true });

    default:
      console.log(`Unhandled Flipkart event: ${event_type}`);
      return NextResponse.json({ received: true, event_type });
  }
}

async function handleAmazonWebhook(payload: {
  notificationType: string;
  payload: {
    AmazonOrderId?: string;
    OrderStatus?: string;
  };
}): Promise<NextResponse> {
  const { notificationType } = payload;

  switch (notificationType) {
    case "ORDER_CHANGE":
      const orderId = payload.payload?.AmazonOrderId;
      const status = payload.payload?.OrderStatus;

      if (orderId && status) {
        const order = await prisma.order.findFirst({
          where: { externalOrderNo: orderId },
        });

        if (order) {
          let newStatus: OrderStatus | null = null;

          switch (status) {
            case "Shipped":
              newStatus = "SHIPPED";
              break;
            case "Canceled":
              newStatus = "CANCELLED";
              break;
          }

          if (newStatus && order.status !== newStatus) {
            await prisma.order.update({
              where: { id: order.id },
              data: { status: newStatus },
            });
          }
        }
      }
      return NextResponse.json({ received: true });

    default:
      console.log(`Unhandled Amazon notification: ${notificationType}`);
      return NextResponse.json({ received: true, notificationType });
  }
}
