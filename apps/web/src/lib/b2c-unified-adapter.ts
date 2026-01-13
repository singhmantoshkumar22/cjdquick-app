/**
 * B2C to Unified Order Adapter
 *
 * This adapter allows the B2C portal to work with the unified order model.
 * Currently a stub that defers to direct unified order service when Brand is set up.
 */

import { prisma } from "@cjdquick/database";
import {
  createUnifiedOrder,
  listOrders,
  getOrderDetails,
  updateOrderStatus,
  cancelOrder,
  selectTransporter,
  assignTransporter,
  getOrderStats,
  type CreateOrderParams,
} from "./unified-order-service";

interface B2CContext {
  sellerId: string;
  businessName: string;
  email: string;
}

interface B2COrderInput {
  pickupLocationId?: string;
  orderType?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryLandmark?: string;
  deliveryPincode: string;
  deliveryCity: string;
  deliveryState: string;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  productName: string;
  productSku?: string;
  productQuantity?: number;
  productValue: number;
  paymentMode?: string;
  codAmount?: number;
  serviceType?: string;
  sellerNotes?: string;
  deliveryInstructions?: string;
  autoSelectTransporter?: boolean;
}

/**
 * Get or create Brand record for B2C seller
 * This bridges the legacy B2CSeller to the new Brand model
 */
export async function getOrCreateBrandForSeller(sellerId: string): Promise<string> {
  // Check if brand already exists for this seller by looking for matching code pattern
  const brandCode = `B2C-${sellerId.slice(0, 8)}`;

  const existingBrand = await prisma.brand.findFirst({
    where: { code: brandCode },
  });

  if (existingBrand) {
    return existingBrand.id;
  }

  // Get seller details
  const seller = await prisma.b2CSeller.findUnique({
    where: { id: sellerId },
  });

  if (!seller) {
    throw new Error("Seller not found");
  }

  // Get or create a default company for B2C sellers
  let company = await prisma.company.findFirst({
    where: { code: "DEFAULT" },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        code: "DEFAULT",
        name: "Default Company",
        legalName: "Default Company",
      },
    });
  }

  // Create brand for this seller
  const brand = await prisma.brand.create({
    data: {
      code: brandCode,
      name: seller.businessName,
      type: "B2C",
      companyId: company.id,
      contactPerson: seller.businessName,
      contactPhone: seller.phone,
      contactEmail: seller.email,
      kycStatus: seller.kycStatus,
    },
  });

  return brand.id;
}

/**
 * Create a unified order from B2C order input
 */
export async function createB2CUnifiedOrder(
  context: B2CContext,
  input: B2COrderInput
) {
  // Get brand ID for seller
  const brandId = await getOrCreateBrandForSeller(context.sellerId);

  // Get pickup location details for origin pincode
  let originPincode = "";
  if (input.pickupLocationId) {
    const pickupLocation = await prisma.b2CPickupLocation.findUnique({
      where: { id: input.pickupLocationId },
    });
    if (pickupLocation) {
      originPincode = pickupLocation.pincode;
    }
  }

  // Map B2C input to unified order params
  const orderParams: CreateOrderParams = {
    brandId,
    orderType: "B2C",
    channel: "MANUAL",
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    shippingAddress: `${input.deliveryAddress}${input.deliveryLandmark ? `, Near: ${input.deliveryLandmark}` : ""}`,
    shippingPincode: input.deliveryPincode,
    shippingCity: input.deliveryCity,
    shippingState: input.deliveryState,
    shippingCountry: "India",
    originPincode,
    totalWeight: input.weightKg,
    length: input.lengthCm,
    width: input.widthCm,
    height: input.heightCm,
    packageCount: 1,
    items: [
      {
        name: input.productName,
        skuCode: input.productSku,
        quantity: input.productQuantity || 1,
        unitPrice: input.productValue / (input.productQuantity || 1),
        weight: input.weightKg,
      },
    ],
    paymentMode: (input.paymentMode as "PREPAID" | "COD") || "PREPAID",
    codAmount: input.paymentMode === "COD" ? input.codAmount : 0,
    remarks: input.sellerNotes || input.deliveryInstructions,
    tags: input.serviceType ? [input.serviceType] : undefined,
  };

  // Create unified order
  const order = await createUnifiedOrder(orderParams);

  // Auto-select transporter if requested
  if (input.autoSelectTransporter && originPincode) {
    try {
      const transporterResult = await selectTransporter({
        originPincode,
        destinationPincode: input.deliveryPincode,
        weightKg: order.chargeableWeight || order.totalWeight,
        isCod: input.paymentMode === "COD",
        codAmount: input.codAmount || 0,
      });

      if (transporterResult.recommended) {
        await assignTransporter(order.id, transporterResult.recommended.transporterId);
      }
    } catch (e) {
      // Non-fatal, order created without transporter
      console.warn("Auto-select transporter failed:", e);
    }
  }

  // Fetch the complete order with relations
  return getOrderDetails(order.id);
}

/**
 * List B2C orders from unified model
 */
export async function listB2CUnifiedOrders(
  context: B2CContext,
  params: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    fromDate?: Date;
    toDate?: Date;
  }
) {
  const brandId = await getOrCreateBrandForSeller(context.sellerId);

  return listOrders({
    brandId,
    orderType: "B2C",
    page: params.page,
    pageSize: params.pageSize,
    status: params.status,
    search: params.search,
    fromDate: params.fromDate,
    toDate: params.toDate,
  });
}

/**
 * Get B2C order stats from unified model
 */
export async function getB2CUnifiedStats(context: B2CContext, days: number = 30) {
  const brandId = await getOrCreateBrandForSeller(context.sellerId);
  return getOrderStats(brandId, undefined, days);
}

/**
 * Get single order details
 */
export async function getB2CUnifiedOrderDetails(context: B2CContext, orderId: string) {
  const brandId = await getOrCreateBrandForSeller(context.sellerId);
  const order = await getOrderDetails(orderId);

  if (!order || order.brandId !== brandId) {
    return null;
  }

  return order;
}

/**
 * Update order status
 */
export async function updateB2CUnifiedOrderStatus(
  context: B2CContext,
  orderId: string,
  status: string,
  statusText: string
) {
  const brandId = await getOrCreateBrandForSeller(context.sellerId);
  const order = await prisma.unifiedOrder.findUnique({ where: { id: orderId } });

  if (!order || order.brandId !== brandId) {
    throw new Error("Order not found");
  }

  // B2C users can only confirm or cancel orders
  const allowedStatuses = ["CONFIRMED", "CANCELLED"];
  if (!allowedStatuses.includes(status)) {
    throw new Error("B2C users can only confirm or cancel orders");
  }

  if (status === "CANCELLED") {
    return cancelOrder(orderId, statusText, context.email);
  }

  return updateOrderStatus({
    orderId,
    status,
    statusText,
    source: "B2C_PORTAL",
    sourceRef: context.email,
  });
}

/**
 * Get available transporters for an order
 */
export async function getB2CTransporterOptions(
  originPincode: string,
  destinationPincode: string,
  weightKg: number,
  paymentMode: string,
  codAmount: number
) {
  return selectTransporter({
    originPincode,
    destinationPincode,
    weightKg,
    isCod: paymentMode === "COD",
    codAmount,
  });
}

/**
 * Map unified order to B2C order format for API response
 * This provides backward compatibility with existing B2C frontend
 */
export function mapUnifiedToB2CFormat(unifiedOrder: any) {
  return {
    id: unifiedOrder.id,
    orderNumber: unifiedOrder.orderNumber,
    orderType: unifiedOrder.orderType === "B2C" ? "FORWARD" : unifiedOrder.orderType,
    status: unifiedOrder.status,
    customerName: unifiedOrder.customerName,
    customerPhone: unifiedOrder.customerPhone,
    customerEmail: unifiedOrder.customerEmail,
    deliveryAddress: unifiedOrder.shippingAddress,
    deliveryPincode: unifiedOrder.shippingPincode,
    deliveryCity: unifiedOrder.shippingCity,
    deliveryState: unifiedOrder.shippingState,
    weightKg: unifiedOrder.totalWeight,
    lengthCm: unifiedOrder.length,
    widthCm: unifiedOrder.width,
    heightCm: unifiedOrder.height,
    volumetricWeight: unifiedOrder.volumetricWeight,
    chargeableWeight: unifiedOrder.chargeableWeight,
    productName: unifiedOrder.items?.[0]?.name || "Product",
    productSku: unifiedOrder.items?.[0]?.skuCode,
    productQuantity: unifiedOrder.items?.[0]?.quantity || 1,
    productValue: unifiedOrder.totalAmount,
    paymentMode: unifiedOrder.paymentMode,
    codAmount: unifiedOrder.codAmount,
    awbNumber: unifiedOrder.awbNumber,
    trackingUrl: unifiedOrder.trackingUrl,
    transporterName: unifiedOrder.transporter?.name,
    shippingCost: unifiedOrder.shippingCost,
    createdAt: unifiedOrder.createdAt,
    updatedAt: unifiedOrder.updatedAt,
  };
}
