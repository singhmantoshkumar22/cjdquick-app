import { prisma } from "@cjdquick/database";

// =============================================================================
// TYPES
// =============================================================================

export interface CreateOrderParams {
  // Brand/Customer identification
  brandId: string;
  orderType: "B2B" | "B2C";
  channel?: string;
  externalOrderNo?: string;

  // Location
  locationId?: string; // Fulfillment warehouse
  pickupLocationId?: string; // For B2C pickup
  brandPickupId?: string; // Brand's own pickup location

  // Customer Info
  customerName: string;
  customerPhone: string;
  customerEmail?: string;

  // Shipping Address
  shippingAddress: string;
  shippingPincode: string;
  shippingCity: string;
  shippingState: string;
  shippingCountry?: string;

  // Billing Address
  billingAddress?: string;

  // Origin pincode (from warehouse or pickup)
  originPincode: string;

  // Package Details
  totalWeight: number;
  length?: number;
  width?: number;
  height?: number;
  packageCount?: number;

  // Order Items
  items: CreateOrderItemParams[];

  // Payment
  paymentMode: "PREPAID" | "COD";
  codAmount?: number;

  // Priority & Notes
  priority?: number;
  tags?: string[];
  remarks?: string;

  // Dates
  shipByDate?: Date;
  promisedDate?: Date;
}

export interface CreateOrderItemParams {
  skuId?: string;
  skuCode?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxAmount?: number;
  discount?: number;
  weight?: number;
  hsn?: string;
}

export interface TransporterOption {
  transporterId: string;
  transporterCode: string;
  transporterName: string;
  rate: number;
  codCharges: number;
  totalCost: number;
  estimatedDays: number | null;
  reliabilityScore: number;
  finalScore: number;
}

export interface TransporterSelectionResult {
  recommended: TransporterOption | null;
  alternatives: TransporterOption[];
}

export interface OrderStatusUpdate {
  orderId: string;
  status: string;
  statusText: string;
  location?: string;
  remarks?: string;
  source?: string;
  sourceRef?: string;
}

// =============================================================================
// ORDER NUMBER GENERATION
// =============================================================================

export async function generateOrderNumber(orderType: "B2B" | "B2C"): Promise<string> {
  const prefix = orderType === "B2B" ? "ORD" : "B2C";

  // Get or create sequence
  const sequence = await prisma.sequenceGenerator.upsert({
    where: { name: `order_${orderType.toLowerCase()}` },
    update: { currentValue: { increment: 1 } },
    create: { name: `order_${orderType.toLowerCase()}`, prefix, currentValue: 1, paddingLength: 8 },
  });

  const paddedNumber = String(sequence.currentValue).padStart(sequence.paddingLength, "0");
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");

  return `${prefix}-${datePart}-${paddedNumber}`;
}

export async function generateAWBNumber(): Promise<string> {
  const sequence = await prisma.sequenceGenerator.upsert({
    where: { name: "awb" },
    update: { currentValue: { increment: 1 } },
    create: { name: "awb", prefix: "AWB", currentValue: 1, paddingLength: 10 },
  });

  return `AWB${String(sequence.currentValue).padStart(sequence.paddingLength, "0")}`;
}

// =============================================================================
// WEIGHT CALCULATIONS
// =============================================================================

export function calculateVolumetricWeight(
  lengthCm: number,
  widthCm: number,
  heightCm: number
): number {
  // Standard volumetric divisor for courier: 5000
  return (lengthCm * widthCm * heightCm) / 5000;
}

export function calculateChargeableWeight(
  actualWeight: number,
  lengthCm?: number,
  widthCm?: number,
  heightCm?: number
): { volumetricWeight: number | null; chargeableWeight: number } {
  if (lengthCm && widthCm && heightCm) {
    const volumetricWeight = calculateVolumetricWeight(lengthCm, widthCm, heightCm);
    return {
      volumetricWeight,
      chargeableWeight: Math.max(actualWeight, volumetricWeight),
    };
  }
  return { volumetricWeight: null, chargeableWeight: actualWeight };
}

// =============================================================================
// TRANSPORTER SELECTION
// =============================================================================

interface TransporterSelectionParams {
  originPincode: string;
  destinationPincode: string;
  weightKg: number;
  isCod: boolean;
  codAmount: number;
  companyId?: string;
}

export async function selectTransporter(
  params: TransporterSelectionParams
): Promise<TransporterSelectionResult> {
  const { destinationPincode, weightKg, isCod, codAmount, companyId } = params;

  // 1. Find serviceable transporters for this pincode
  const serviceablePincodes = await prisma.transporterServicePincode.findMany({
    where: {
      pincode: destinationPincode,
      transporter: {
        isActive: true,
        ...(isCod ? { supportsCod: true } : {}),
      },
      ...(isCod ? { codAvailable: true } : { prepaidAvailable: true }),
    },
    include: {
      transporter: true,
    },
  });

  if (serviceablePincodes.length === 0) {
    return { recommended: null, alternatives: [] };
  }

  // 2. Calculate rates for each transporter
  const options: TransporterOption[] = [];

  for (const sp of serviceablePincodes) {
    const transporter = sp.transporter;
    let rate = 0;
    let codCharges = 0;
    let rateCard: any = null;

    // Try to get rate card if company ID is provided
    if (companyId) {
      const config = await prisma.transporterConfig.findFirst({
        where: {
          transporterId: transporter.id,
          companyId,
          isActive: true,
        },
        include: {
          rateCards: {
            where: {
              status: "ACTIVE",
              effectiveFrom: { lte: new Date() },
              OR: [
                { effectiveTo: null },
                { effectiveTo: { gte: new Date() } },
              ],
            },
            include: { slabs: true },
            take: 1,
            orderBy: { effectiveFrom: "desc" },
          },
        },
      });

      rateCard = config?.rateCards?.[0];
    }

    if (rateCard) {
      // Find applicable slab
      const slab = rateCard.slabs.find(
        (s: any) => weightKg >= s.fromWeight && weightKg <= s.toWeight
      );

      if (slab) {
        rate = slab.rate;
        if (slab.additionalWeightRate && weightKg > slab.fromWeight) {
          rate += (weightKg - slab.fromWeight) * slab.additionalWeightRate;
        }
        if (slab.minCharge && rate < slab.minCharge) {
          rate = slab.minCharge;
        }
      } else {
        // Use base cost if no slab matches
        rate = rateCard.baseCost;
      }

      // Add fuel surcharge
      if (rateCard.fuelSurchargePercent) {
        rate += rate * (rateCard.fuelSurchargePercent / 100);
      }

      // Calculate COD charges
      if (isCod && codAmount > 0) {
        if (rateCard.codChargePercent) {
          codCharges = codAmount * (rateCard.codChargePercent / 100);
          if (rateCard.codChargeMin && codCharges < rateCard.codChargeMin) {
            codCharges = rateCard.codChargeMin;
          }
          if (rateCard.codChargeCap && codCharges > rateCard.codChargeCap) {
            codCharges = rateCard.codChargeCap;
          }
        }
      }
    } else {
      // Default rates if no rate card
      rate = 50 + weightKg * 15; // Base 50 + 15/kg
      if (isCod && codAmount > 0) {
        codCharges = Math.max(30, codAmount * 0.02); // 2% or min 30
      }
    }

    const totalCost = rate + codCharges;

    options.push({
      transporterId: transporter.id,
      transporterCode: transporter.code,
      transporterName: transporter.name,
      rate,
      codCharges,
      totalCost,
      estimatedDays: sp.deliveryDays,
      reliabilityScore: 80, // Default, could be calculated from performance data
      finalScore: 0,
    });
  }

  // 3. Calculate final scores (lower cost, faster delivery = higher score)
  if (options.length > 0) {
    const costs = options.map((o) => o.totalCost);
    const days = options.map((o) => o.estimatedDays || 7);

    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const costRange = maxCost - minCost || 1;

    const minDays = Math.min(...days);
    const maxDays = Math.max(...days);
    const daysRange = maxDays - minDays || 1;

    for (const option of options) {
      const costScore = 100 * (1 - (option.totalCost - minCost) / costRange);
      const speedScore = 100 * (1 - ((option.estimatedDays || 7) - minDays) / daysRange);

      // Weighted: 40% cost, 30% speed, 30% reliability
      option.finalScore = 0.4 * costScore + 0.3 * speedScore + 0.3 * option.reliabilityScore;
    }

    // Sort by final score descending
    options.sort((a, b) => b.finalScore - a.finalScore);
  }

  return {
    recommended: options[0] || null,
    alternatives: options.slice(1),
  };
}

// =============================================================================
// ORDER CREATION
// =============================================================================

export async function createUnifiedOrder(params: CreateOrderParams) {
  const {
    brandId,
    orderType,
    channel = "MANUAL",
    externalOrderNo,
    locationId,
    pickupLocationId,
    brandPickupId,
    customerName,
    customerPhone,
    customerEmail,
    shippingAddress,
    shippingPincode,
    shippingCity,
    shippingState,
    shippingCountry = "India",
    billingAddress,
    originPincode,
    totalWeight,
    length,
    width,
    height,
    packageCount = 1,
    items,
    paymentMode,
    codAmount = 0,
    priority = 0,
    tags,
    remarks,
    shipByDate,
    promisedDate,
  } = params;

  // Validate brand exists
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) {
    throw new Error("Brand not found");
  }

  // Calculate weights
  const { volumetricWeight, chargeableWeight } = calculateChargeableWeight(
    totalWeight,
    length,
    width,
    height
  );

  // Calculate totals from items
  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  for (const item of items) {
    const itemTotal = item.unitPrice * item.quantity;
    subtotal += itemTotal;
    totalTax += item.taxAmount || 0;
    totalDiscount += item.discount || 0;
  }

  const totalAmount = subtotal + totalTax - totalDiscount;

  // Generate order number
  const orderNumber = await generateOrderNumber(orderType);

  // Create order with items
  const order = await prisma.unifiedOrder.create({
    data: {
      orderNumber,
      orderType,
      channel,
      externalOrderNo,
      brandId,
      locationId,
      pickupLocationId,
      brandPickupId,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      shippingPincode,
      shippingCity,
      shippingState,
      shippingCountry,
      billingAddress,
      originPincode,
      totalWeight,
      length,
      width,
      height,
      volumetricWeight,
      chargeableWeight,
      packageCount,
      subtotal,
      taxAmount: totalTax,
      discount: totalDiscount,
      totalAmount,
      paymentMode,
      codAmount: paymentMode === "COD" ? codAmount : 0,
      status: "CREATED",
      wmsStatus: "PENDING",
      priority,
      tags: tags ? JSON.stringify(tags) : null,
      remarks,
      shipByDate,
      promisedDate,
      items: {
        create: items.map((item) => ({
          skuId: item.skuId,
          skuCode: item.skuCode,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxAmount: item.taxAmount || 0,
          discount: item.discount || 0,
          totalPrice: item.unitPrice * item.quantity + (item.taxAmount || 0) - (item.discount || 0),
          weight: item.weight,
          hsn: item.hsn,
          status: "PENDING",
        })),
      },
    },
    include: {
      items: true,
      brand: { select: { code: true, name: true, type: true } },
    },
  });

  // Create initial event
  await prisma.unifiedOrderEvent.create({
    data: {
      orderId: order.id,
      status: "CREATED",
      statusText: "Order created",
      source: "SYSTEM",
      eventTime: new Date(),
    },
  });

  return order;
}

// =============================================================================
// ORDER STATUS UPDATES
// =============================================================================

export const ORDER_STATUS_FLOW: Record<string, string[]> = {
  CREATED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["ALLOCATED", "ON_HOLD", "CANCELLED"],
  ALLOCATED: ["PICKING", "ON_HOLD", "CANCELLED"],
  PICKING: ["PICKED", "PARTIALLY_ALLOCATED"],
  PICKED: ["PACKING"],
  PACKING: ["PACKED"],
  PACKED: ["READY_TO_SHIP", "MANIFESTED"],
  READY_TO_SHIP: ["MANIFESTED"],
  MANIFESTED: ["SHIPPED"],
  SHIPPED: ["IN_TRANSIT"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "EXCEPTION"],
  OUT_FOR_DELIVERY: ["DELIVERED", "EXCEPTION", "RTO_INITIATED"],
  DELIVERED: [],
  EXCEPTION: ["IN_TRANSIT", "OUT_FOR_DELIVERY", "RTO_INITIATED"],
  RTO_INITIATED: ["RTO_IN_TRANSIT"],
  RTO_IN_TRANSIT: ["RTO_DELIVERED"],
  RTO_DELIVERED: [],
  ON_HOLD: ["CONFIRMED", "CANCELLED"],
  CANCELLED: [],
};

export async function updateOrderStatus(params: OrderStatusUpdate) {
  const { orderId, status, statusText, location, remarks, source = "SYSTEM", sourceRef } = params;

  // Get current order
  const order = await prisma.unifiedOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error("Order not found");
  }

  // Validate status transition
  const allowedStatuses = ORDER_STATUS_FLOW[order.status] || [];
  if (!allowedStatuses.includes(status)) {
    throw new Error(`Cannot transition from ${order.status} to ${status}`);
  }

  // Update order status and relevant timestamps
  const updateData: any = { status };
  const now = new Date();

  switch (status) {
    case "MANIFESTED":
      updateData.manifestedAt = now;
      break;
    case "SHIPPED":
      updateData.shippedAt = now;
      break;
    case "DELIVERED":
      updateData.deliveredAt = now;
      break;
    case "PICKED":
      updateData.pickedAt = now;
      updateData.wmsStatus = "PICKED";
      break;
    case "PACKED":
      updateData.packedAt = now;
      updateData.wmsStatus = "PACKED";
      break;
  }

  // Update order
  const updatedOrder = await prisma.unifiedOrder.update({
    where: { id: orderId },
    data: updateData,
  });

  // Create event
  await prisma.unifiedOrderEvent.create({
    data: {
      orderId,
      status,
      statusText,
      location,
      remarks,
      source,
      sourceRef,
      eventTime: now,
    },
  });

  return updatedOrder;
}

// =============================================================================
// ASSIGN TRANSPORTER
// =============================================================================

export async function assignTransporter(
  orderId: string,
  transporterId: string,
  awbNumber?: string
) {
  const order = await prisma.unifiedOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error("Order not found");
  }

  const transporter = await prisma.transporter.findUnique({ where: { id: transporterId } });
  if (!transporter) {
    throw new Error("Transporter not found");
  }

  // Generate AWB if not provided
  const awb = awbNumber || (await generateAWBNumber());

  // Build tracking URL
  let trackingUrl = null;
  if (transporter.trackingUrlTemplate) {
    trackingUrl = transporter.trackingUrlTemplate.replace("{AWB}", awb);
  }

  // Update order
  const updatedOrder = await prisma.unifiedOrder.update({
    where: { id: orderId },
    data: {
      transporterId,
      awbNumber: awb,
      trackingUrl,
    },
  });

  // Create event
  await prisma.unifiedOrderEvent.create({
    data: {
      orderId,
      status: order.status,
      statusText: `Transporter assigned: ${transporter.name} (AWB: ${awb})`,
      source: "SYSTEM",
      eventTime: new Date(),
    },
  });

  return updatedOrder;
}

// =============================================================================
// GET ORDER DETAILS
// =============================================================================

export async function getOrderDetails(orderId: string) {
  const order = await prisma.unifiedOrder.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      events: {
        orderBy: { eventTime: "desc" },
      },
      brand: {
        select: { code: true, name: true, type: true, contactPerson: true, contactPhone: true },
      },
      transporter: {
        select: { code: true, name: true, trackingUrlTemplate: true },
      },
      location: {
        select: { code: true, name: true, city: true, state: true },
      },
      ndrCase: true,
    },
  });

  return order;
}

// =============================================================================
// LIST ORDERS
// =============================================================================

interface ListOrdersParams {
  brandId?: string;
  locationId?: string;
  orderType?: "B2B" | "B2C";
  status?: string;
  channel?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listOrders(params: ListOrdersParams) {
  const {
    brandId,
    locationId,
    orderType,
    status,
    channel,
    fromDate,
    toDate,
    search,
    page = 1,
    pageSize = 20,
  } = params;

  const where: any = {};

  if (brandId) where.brandId = brandId;
  if (locationId) where.locationId = locationId;
  if (orderType) where.orderType = orderType;
  if (status) where.status = status;
  if (channel) where.channel = channel;

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setDate(endDate.getDate() + 1);
      where.createdAt.lt = endDate;
    }
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search } },
      { awbNumber: { contains: search } },
      { customerName: { contains: search } },
      { customerPhone: { contains: search } },
      { externalOrderNo: { contains: search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.unifiedOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        brand: { select: { code: true, name: true } },
        transporter: { select: { code: true, name: true } },
        location: { select: { code: true, name: true } },
      },
    }),
    prisma.unifiedOrder.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// =============================================================================
// CANCEL ORDER
// =============================================================================

export async function cancelOrder(orderId: string, reason: string, actor: string) {
  const order = await prisma.unifiedOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error("Order not found");
  }

  // Check if cancellable
  const nonCancellableStatuses = [
    "PICKED",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "RTO_IN_TRANSIT",
    "RTO_DELIVERED",
    "CANCELLED",
  ];

  if (nonCancellableStatuses.includes(order.status)) {
    throw new Error(`Cannot cancel order in ${order.status} status`);
  }

  // Update order
  const updatedOrder = await prisma.unifiedOrder.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelReason: reason,
    },
  });

  // Create event
  await prisma.unifiedOrderEvent.create({
    data: {
      orderId,
      status: "CANCELLED",
      statusText: `Order cancelled: ${reason}`,
      source: "USER",
      sourceRef: actor,
      eventTime: new Date(),
    },
  });

  return updatedOrder;
}

// =============================================================================
// ORDER STATISTICS
// =============================================================================

export async function getOrderStats(brandId?: string, locationId?: string, days: number = 30) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const where: any = { createdAt: { gte: fromDate } };
  if (brandId) where.brandId = brandId;
  if (locationId) where.locationId = locationId;

  const [
    totalOrders,
    pendingOrders,
    inTransitOrders,
    deliveredOrders,
    rtoOrders,
    cancelledOrders,
  ] = await Promise.all([
    prisma.unifiedOrder.count({ where }),
    prisma.unifiedOrder.count({ where: { ...where, status: { in: ["CREATED", "CONFIRMED", "ALLOCATED", "PICKING", "PICKED", "PACKING", "PACKED"] } } }),
    prisma.unifiedOrder.count({ where: { ...where, status: { in: ["MANIFESTED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY"] } } }),
    prisma.unifiedOrder.count({ where: { ...where, status: "DELIVERED" } }),
    prisma.unifiedOrder.count({ where: { ...where, status: { in: ["RTO_INITIATED", "RTO_IN_TRANSIT", "RTO_DELIVERED"] } } }),
    prisma.unifiedOrder.count({ where: { ...where, status: "CANCELLED" } }),
  ]);

  const deliveryRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : "0";
  const rtoRate = totalOrders > 0 ? ((rtoOrders / totalOrders) * 100).toFixed(1) : "0";

  return {
    totalOrders,
    pendingOrders,
    inTransitOrders,
    deliveredOrders,
    rtoOrders,
    cancelledOrders,
    deliveryRate: `${deliveryRate}%`,
    rtoRate: `${rtoRate}%`,
  };
}
