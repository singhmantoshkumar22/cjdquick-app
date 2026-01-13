/**
 * Unified TMS Service
 *
 * Handles transport management operations for unified orders:
 * - Manifest creation and management
 * - AWB assignment
 * - Handover to transporter
 * - Tracking updates
 * - Delivery status management
 */

import { prisma } from "@cjdquick/database";
import { updateOrderStatus } from "./unified-order-service";

// =============================================================================
// TYPES
// =============================================================================

export interface CreateManifestParams {
  locationId: string;
  transporterId: string;
  orderIds: string[];
  manifestType?: "FORWARD" | "REVERSE" | "RTO";
  scheduledPickupAt?: Date;
  remarks?: string;
}

export interface ManifestResult {
  id: string;
  manifestNumber: string;
  transporterId: string;
  locationId: string;
  status: string;
  orderCount: number;
  totalWeight: number;
  totalCod: number;
}

export interface AssignAwbParams {
  orderId: string;
  awbNumber: string;
  trackingUrl?: string;
  labelUrl?: string;
}

export interface TrackingUpdateParams {
  orderId?: string;
  awbNumber?: string;
  status: string;
  statusText?: string;
  location?: string;
  timestamp?: Date;
  rawEvent?: any;
}

// =============================================================================
// MANIFEST NUMBER GENERATION
// =============================================================================

async function generateManifestNumber(): Promise<string> {
  const sequence = await prisma.sequenceGenerator.upsert({
    where: { name: "manifest" },
    update: { currentValue: { increment: 1 } },
    create: { name: "manifest", prefix: "MF", currentValue: 1, paddingLength: 8 },
  });

  const paddedNumber = String(sequence.currentValue).padStart(sequence.paddingLength, "0");
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");

  return `MF-${datePart}-${paddedNumber}`;
}

// =============================================================================
// MANIFEST CREATION
// =============================================================================

/**
 * Create a manifest for multiple orders
 */
export async function createManifest(params: CreateManifestParams): Promise<ManifestResult> {
  const {
    locationId,
    transporterId,
    orderIds,
    manifestType = "FORWARD",
    scheduledPickupAt,
    remarks,
  } = params;

  if (orderIds.length === 0) {
    throw new Error("At least one order is required");
  }

  // Verify all orders exist and are ready to ship
  const orders = await prisma.unifiedOrder.findMany({
    where: {
      id: { in: orderIds },
      status: "READY_TO_SHIP",
      transporterId,
    },
  });

  if (orders.length !== orderIds.length) {
    const foundIds = orders.map((o) => o.id);
    const missingIds = orderIds.filter((id) => !foundIds.includes(id));
    throw new Error(`Orders not ready or wrong transporter: ${missingIds.join(", ")}`);
  }

  const manifestNumber = await generateManifestNumber();

  // Calculate totals
  const totalWeight = orders.reduce((sum, o) => sum + (o.chargeableWeight || o.totalWeight || 0), 0);
  const totalCod = orders.reduce((sum, o) => sum + (o.codAmount || 0), 0);
  const codOrderCount = orders.filter((o) => o.paymentMode === "COD").length;

  // Create manifest using ManifestNew model
  const manifest = await prisma.manifestNew.create({
    data: {
      manifestNumber,
      status: "OPEN",
      locationId,
      transporterId,
      orderCount: orders.length,
      totalWeight,
    },
  });

  // Link orders to manifest and update status
  for (const order of orders) {
    await prisma.unifiedOrder.update({
      where: { id: order.id },
      data: { manifestId: manifest.id },
    });

    await updateOrderStatus({
      orderId: order.id,
      status: "MANIFESTED",
      statusText: `Added to manifest ${manifestNumber}`,
    });
  }

  return {
    id: manifest.id,
    manifestNumber: manifest.manifestNumber,
    transporterId: manifest.transporterId,
    locationId: manifest.locationId,
    status: manifest.status,
    orderCount: manifest.orderCount,
    totalWeight: manifest.totalWeight,
    totalCod: totalCod,
  };
}

/**
 * Close manifest - ready for handover
 */
export async function closeManifest(manifestId: string, vehicleNumber?: string, driverName?: string) {
  const manifest = await prisma.manifestNew.findUnique({
    where: { id: manifestId },
  });

  if (!manifest) {
    throw new Error("Manifest not found");
  }

  if (manifest.status !== "OPEN") {
    throw new Error(`Cannot close manifest in ${manifest.status} status`);
  }

  const updated = await prisma.manifestNew.update({
    where: { id: manifestId },
    data: {
      status: "CONFIRMED",
      confirmedAt: new Date(),
      vehicleNo: vehicleNumber,
      driverName,
    },
  });

  return updated;
}

/**
 * Handover manifest to transporter
 */
export async function handoverManifest(
  manifestId: string,
  handoveredTo?: string,
  handoverRemarks?: string
) {
  const manifest = await prisma.manifestNew.findUnique({
    where: { id: manifestId },
    include: {
      orders: true,
    },
  });

  if (!manifest) {
    throw new Error("Manifest not found");
  }

  if (manifest.status !== "CONFIRMED") {
    throw new Error(`Cannot handover manifest in ${manifest.status} status`);
  }

  // Update manifest
  const updated = await prisma.manifestNew.update({
    where: { id: manifestId },
    data: {
      status: "CLOSED",
    },
  });

  // Update all orders in manifest
  for (const order of manifest.orders) {
    await updateOrderStatus({
      orderId: order.id,
      status: "HANDED_OVER",
      statusText: `Handed over - Manifest: ${manifest.manifestNumber}`,
    });
  }

  return updated;
}

// =============================================================================
// AWB MANAGEMENT
// =============================================================================

/**
 * Assign AWB to an order
 */
export async function assignAwb(params: AssignAwbParams) {
  const { orderId, awbNumber, trackingUrl, labelUrl } = params;

  const order = await prisma.unifiedOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!order.transporterId) {
    throw new Error("Order must have transporter assigned before AWB");
  }

  // Update order with AWB
  const updated = await prisma.unifiedOrder.update({
    where: { id: orderId },
    data: {
      awbNumber,
      trackingUrl,
      labelUrl,
    },
  });

  await updateOrderStatus({
    orderId,
    status: order.status, // Keep same status
    statusText: `AWB assigned: ${awbNumber}`,
  });

  return updated;
}

/**
 * Bulk assign AWBs
 */
export async function bulkAssignAwbs(assignments: AssignAwbParams[]) {
  const results: any[] = [];
  const errors: any[] = [];

  for (const assignment of assignments) {
    try {
      const result = await assignAwb(assignment);
      results.push(result);
    } catch (err: any) {
      errors.push({ orderId: assignment.orderId, error: err.message });
    }
  }

  return {
    success: errors.length === 0,
    assigned: results.length,
    failed: errors.length,
    results,
    errors,
  };
}

// =============================================================================
// TRACKING UPDATES
// =============================================================================

/**
 * Update tracking status for an order
 */
export async function updateTracking(params: TrackingUpdateParams) {
  const { orderId, awbNumber, status, statusText, location, timestamp, rawEvent } = params;

  // Find order by ID or AWB
  let order;
  if (orderId) {
    order = await prisma.unifiedOrder.findUnique({ where: { id: orderId } });
  } else if (awbNumber) {
    order = await prisma.unifiedOrder.findFirst({ where: { awbNumber } });
  }

  if (!order) {
    throw new Error("Order not found");
  }

  // Map external status to internal status
  const statusMap: Record<string, string> = {
    PICKED_UP: "PICKED_UP",
    IN_TRANSIT: "IN_TRANSIT",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
    ATTEMPTED: "DELIVERY_ATTEMPTED",
    FAILED: "DELIVERY_FAILED",
    RTO_INITIATED: "RTO_IN_TRANSIT",
    RTO_DELIVERED: "RTO_DELIVERED",
  };

  const mappedStatus = statusMap[status] || status;

  // Update order status
  await updateOrderStatus({
    orderId: order.id,
    status: mappedStatus,
    statusText: statusText || `Tracking update: ${status}`,
    location,
    source: "TRANSPORTER_WEBHOOK",
  });

  // Create tracking event
  await prisma.unifiedOrderEvent.create({
    data: {
      orderId: order.id,
      status: mappedStatus,
      statusText: statusText || status,
      location,
      eventTime: timestamp || new Date(),
      source: "TRANSPORTER",
      remarks: rawEvent ? JSON.stringify(rawEvent) : null,
    },
  });

  // Handle special statuses
  if (mappedStatus === "DELIVERED") {
    await prisma.unifiedOrder.update({
      where: { id: order.id },
      data: { deliveredAt: timestamp || new Date() },
    });
  }

  return order;
}

/**
 * Get tracking history for an order
 */
export async function getTrackingHistory(orderId: string) {
  const events = await prisma.unifiedOrderEvent.findMany({
    where: { orderId },
    orderBy: { eventTime: "desc" },
    select: {
      id: true,
      status: true,
      statusText: true,
      location: true,
      eventTime: true,
      source: true,
      createdAt: true,
    },
  });

  return events;
}

// =============================================================================
// DELIVERY MANAGEMENT
// =============================================================================

/**
 * Mark order as delivered
 */
export async function markDelivered(
  orderId: string,
  deliveredAt?: Date,
  podPhoto?: string,
  receiverName?: string
) {
  const order = await prisma.unifiedOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const validStatuses = ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERY_ATTEMPTED"];
  if (!validStatuses.includes(order.status)) {
    throw new Error(`Cannot mark as delivered from ${order.status} status`);
  }

  await prisma.unifiedOrder.update({
    where: { id: orderId },
    data: {
      deliveredAt: deliveredAt || new Date(),
      podPhoto,
      podReceiverName: receiverName,
    },
  });

  await updateOrderStatus({
    orderId,
    status: "DELIVERED",
    statusText: receiverName ? `Delivered to ${receiverName}` : "Delivered successfully",
  });

  return prisma.unifiedOrder.findUnique({
    where: { id: orderId },
    include: { transporter: true },
  });
}

/**
 * Mark delivery attempted (NDR)
 * Creates an NDR case for tracking
 */
export async function markDeliveryAttempted(
  orderId: string,
  reason: string,
  remarks?: string,
  ndrImage?: string
) {
  const order = await prisma.unifiedOrder.findUnique({
    where: { id: orderId },
    include: { ndrCase: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Check or create NDR case
  let ndrCase = order.ndrCase;
  const attemptNumber = ndrCase ? ndrCase.attemptNumber + 1 : 1;

  if (!ndrCase) {
    // Create new NDR case
    ndrCase = await prisma.unifiedNdrCase.create({
      data: {
        orderId,
        reason,
        reasonText: remarks,
        attemptNumber: 1,
        action: "PENDING",
      },
    });
  } else {
    // Update existing NDR case
    ndrCase = await prisma.unifiedNdrCase.update({
      where: { id: ndrCase.id },
      data: {
        attemptNumber: { increment: 1 },
        reason,
        reasonText: remarks,
      },
    });
  }

  await updateOrderStatus({
    orderId,
    status: "DELIVERY_ATTEMPTED",
    statusText: `Attempt ${attemptNumber}: ${reason}`,
  });

  return prisma.unifiedOrder.findUnique({
    where: { id: orderId },
    include: { ndrCase: true },
  });
}

/**
 * Initiate RTO
 */
export async function initiateRto(orderId: string, reason: string, initiatedBy: string) {
  const order = await prisma.unifiedOrder.findUnique({
    where: { id: orderId },
    include: { ndrCase: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const rtoStatuses = ["DELIVERY_ATTEMPTED", "DELIVERY_FAILED", "OUT_FOR_DELIVERY", "IN_TRANSIT"];
  if (!rtoStatuses.includes(order.status)) {
    throw new Error(`Cannot initiate RTO from ${order.status} status`);
  }

  // Update NDR case if exists
  if (order.ndrCase) {
    await prisma.unifiedNdrCase.update({
      where: { id: order.ndrCase.id },
      data: {
        action: "RTO",
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  await updateOrderStatus({
    orderId,
    status: "RTO_IN_TRANSIT",
    statusText: `RTO initiated: ${reason}`,
    source: "SYSTEM",
    sourceRef: initiatedBy,
  });

  return prisma.unifiedOrder.findUnique({ where: { id: orderId } });
}

// =============================================================================
// TMS DASHBOARD & QUERIES
// =============================================================================

/**
 * Get TMS dashboard stats
 */
export async function getTMSDashboardStats(locationId?: string, transporterId?: string) {
  const locationFilter = locationId ? { locationId } : {};
  const transporterFilter = transporterId ? { transporterId } : {};
  const baseFilter = { ...locationFilter, ...transporterFilter };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    readyToShip,
    manifested,
    handedOver,
    inTransit,
    outForDelivery,
    deliveredToday,
    ndrPending,
    rtoInTransit,
  ] = await Promise.all([
    prisma.unifiedOrder.count({ where: { ...baseFilter, status: "READY_TO_SHIP" } }),
    prisma.unifiedOrder.count({ where: { ...baseFilter, status: "MANIFESTED" } }),
    prisma.unifiedOrder.count({ where: { ...baseFilter, status: "HANDED_OVER" } }),
    prisma.unifiedOrder.count({ where: { ...baseFilter, status: "IN_TRANSIT" } }),
    prisma.unifiedOrder.count({ where: { ...baseFilter, status: "OUT_FOR_DELIVERY" } }),
    prisma.unifiedOrder.count({
      where: { ...baseFilter, status: "DELIVERED", deliveredAt: { gte: today } },
    }),
    prisma.unifiedOrder.count({ where: { ...baseFilter, status: "DELIVERY_ATTEMPTED" } }),
    prisma.unifiedOrder.count({ where: { ...baseFilter, status: "RTO_IN_TRANSIT" } }),
  ]);

  return {
    readyToShip,
    manifested,
    handedOver,
    inTransit,
    outForDelivery,
    deliveredToday,
    ndrPending,
    rtoInTransit,
    totalInPipeline: readyToShip + manifested + handedOver + inTransit + outForDelivery,
  };
}

/**
 * List manifests
 */
export async function listManifests(
  params: {
    locationId?: string;
    transporterId?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const { locationId, transporterId, status, fromDate, toDate, page = 1, pageSize = 20 } = params;

  const where: any = {};
  if (locationId) where.locationId = locationId;
  if (transporterId) where.transporterId = transporterId;
  if (status) where.status = status;
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) where.createdAt.lte = toDate;
  }

  const [items, total] = await Promise.all([
    prisma.manifestNew.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        transporter: { select: { code: true, name: true } },
        location: { select: { code: true, name: true } },
        _count: { select: { orders: true } },
      },
    }),
    prisma.manifestNew.count({ where }),
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

/**
 * Get manifest details with orders
 */
export async function getManifestDetails(manifestId: string) {
  const manifest = await prisma.manifestNew.findUnique({
    where: { id: manifestId },
    include: {
      transporter: { select: { code: true, name: true, logo: true } },
      location: { select: { code: true, name: true, address: true } },
      orders: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          shippingCity: true,
          shippingPincode: true,
          awbNumber: true,
          status: true,
          paymentMode: true,
          codAmount: true,
          chargeableWeight: true,
        },
      },
    },
  });

  return manifest;
}

/**
 * Get orders in transit (for tracking dashboard)
 */
export async function getOrdersInTransit(
  params: {
    locationId?: string;
    transporterId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const { locationId, transporterId, status, page = 1, pageSize = 50 } = params;

  const where: any = {};
  if (locationId) where.locationId = locationId;
  if (transporterId) where.transporterId = transporterId;

  if (status) {
    where.status = status;
  } else {
    // Default: all in-transit statuses
    where.status = {
      in: ["HANDED_OVER", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERY_ATTEMPTED"],
    };
  }

  const [items, total] = await Promise.all([
    prisma.unifiedOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        orderNumber: true,
        awbNumber: true,
        customerName: true,
        customerPhone: true,
        shippingCity: true,
        shippingState: true,
        shippingPincode: true,
        status: true,
        paymentMode: true,
        codAmount: true,
        transporter: { select: { code: true, name: true } },
        brand: { select: { code: true, name: true } },
        ndrCase: { select: { attemptNumber: true, reason: true, action: true } },
        createdAt: true,
        updatedAt: true,
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
