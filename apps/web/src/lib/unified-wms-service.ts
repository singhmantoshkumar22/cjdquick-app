/**
 * Unified WMS Service
 *
 * Handles warehouse management operations for unified orders:
 * - Inventory allocation
 * - Picklist generation
 * - Picking workflow
 * - Packing workflow
 * - Ready to ship
 */

import { prisma } from "@cjdquick/database";
import { updateOrderStatus } from "./unified-order-service";

// =============================================================================
// TYPES
// =============================================================================

export interface AllocateOrderParams {
  orderId: string;
  locationId: string;
  allocationStrategy?: "FIFO" | "FEFO" | "MANUAL";
}

export interface AllocationResult {
  success: boolean;
  orderId: string;
  allocations: {
    itemId: string;
    skuCode: string;
    requiredQty: number;
    allocatedQty: number;
    binAllocations: {
      binId: string;
      binCode: string;
      quantity: number;
      batchNo?: string;
    }[];
  }[];
  shortfall: {
    itemId: string;
    skuCode: string;
    requiredQty: number;
    availableQty: number;
  }[];
}

export interface PicklistItem {
  orderItemId: string;
  skuId: string;
  skuCode: string;
  skuName: string;
  binId: string;
  binCode: string;
  zoneName: string;
  requiredQty: number;
  pickedQty: number;
  batchNo?: string;
}

export interface PackingItem {
  orderItemId: string;
  skuCode: string;
  skuName: string;
  quantity: number;
  packedQty: number;
}

// =============================================================================
// PICKLIST NUMBER GENERATION
// =============================================================================

async function generatePicklistNumber(): Promise<string> {
  const sequence = await prisma.sequenceGenerator.upsert({
    where: { name: "picklist" },
    update: { currentValue: { increment: 1 } },
    create: { name: "picklist", prefix: "PL", currentValue: 1, paddingLength: 8 },
  });

  const paddedNumber = String(sequence.currentValue).padStart(sequence.paddingLength, "0");
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");

  return `PL-${datePart}-${paddedNumber}`;
}

// =============================================================================
// INVENTORY ALLOCATION
// =============================================================================

/**
 * Allocate inventory for an order
 * Uses FIFO or FEFO strategy based on configuration
 */
export async function allocateOrderInventory(
  params: AllocateOrderParams
): Promise<AllocationResult> {
  const { orderId, locationId, allocationStrategy = "FIFO" } = params;

  // Get order with items
  const order = await prisma.unifiedOrder.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!["CREATED", "CONFIRMED"].includes(order.status)) {
    throw new Error(`Cannot allocate order in ${order.status} status`);
  }

  const allocations: AllocationResult["allocations"] = [];
  const shortfall: AllocationResult["shortfall"] = [];

  // Process each order item
  for (const item of order.items) {
    const skuId = item.skuId;
    if (!skuId) {
      // No SKU linked, skip allocation
      allocations.push({
        itemId: item.id,
        skuCode: item.skuCode || "N/A",
        requiredQty: item.quantity,
        allocatedQty: item.quantity, // Auto-allocate for non-inventory items
        binAllocations: [],
      });
      continue;
    }

    // Find available inventory batches using FIFO/FEFO
    // Note: InventoryBatch holds bin-level, batch-level inventory
    const availableBatches = await prisma.inventoryBatch.findMany({
      where: {
        itemId: skuId, // itemId references InventoryItem (SKU master)
        availableQty: { gt: 0 },
        status: "AVAILABLE",
      },
      orderBy: allocationStrategy === "FEFO"
        ? { expiryDate: "asc" }
        : { receivedDate: "asc" },
    });

    let remainingQty = item.quantity;
    const binAllocations: AllocationResult["allocations"][0]["binAllocations"] = [];

    for (const batch of availableBatches) {
      if (remainingQty <= 0) break;

      const allocateQty = Math.min(remainingQty, batch.availableQty);

      // Reserve the inventory
      await prisma.inventoryBatch.update({
        where: { id: batch.id },
        data: {
          reservedQty: { increment: allocateQty },
          availableQty: { decrement: allocateQty },
        },
      });

      binAllocations.push({
        binId: batch.binId || "",
        binCode: batch.binId || "DEFAULT",
        quantity: allocateQty,
        batchNo: batch.batchNumber || undefined,
      });

      remainingQty -= allocateQty;
    }

    const allocatedQty = item.quantity - remainingQty;

    allocations.push({
      itemId: item.id,
      skuCode: item.skuCode || "N/A",
      requiredQty: item.quantity,
      allocatedQty,
      binAllocations,
    });

    // Update order item allocation
    await prisma.unifiedOrderItem.update({
      where: { id: item.id },
      data: {
        allocatedQty,
        status: allocatedQty >= item.quantity ? "ALLOCATED" : "PARTIALLY_ALLOCATED",
      },
    });

    if (remainingQty > 0) {
      shortfall.push({
        itemId: item.id,
        skuCode: item.skuCode || "N/A",
        requiredQty: item.quantity,
        availableQty: allocatedQty,
      });
    }
  }

  // Update order status
  const allAllocated = shortfall.length === 0;
  await updateOrderStatus({
    orderId,
    status: allAllocated ? "ALLOCATED" : "PARTIALLY_ALLOCATED",
    statusText: allAllocated
      ? "Inventory allocated successfully"
      : `Partial allocation - ${shortfall.length} items short`,
  });

  // Update order with location
  await prisma.unifiedOrder.update({
    where: { id: orderId },
    data: {
      locationId,
      wmsStatus: allAllocated ? "ALLOCATED" : "PARTIAL",
    },
  });

  return {
    success: allAllocated,
    orderId,
    allocations,
    shortfall,
  };
}

// =============================================================================
// PICKLIST GENERATION
// =============================================================================

/**
 * Create a picklist for an allocated order
 */
export async function createPicklist(orderId: string, assignedToId?: string) {
  const order = await prisma.unifiedOrder.findUnique({
    where: { id: orderId },
    include: {
      items: {
        where: { allocatedQty: { gt: 0 } },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!["ALLOCATED", "PARTIALLY_ALLOCATED"].includes(order.status)) {
    throw new Error(`Cannot create picklist for order in ${order.status} status`);
  }

  // Check if picklist already exists
  const existingPicklist = await prisma.picklistNew.findFirst({
    where: { orderId, status: { not: "CANCELLED" } },
  });

  if (existingPicklist) {
    throw new Error("Picklist already exists for this order");
  }

  const picklistNumber = await generatePicklistNumber();

  // Create picklist with items
  const picklist = await prisma.picklistNew.create({
    data: {
      picklistNumber,
      orderId,
      status: "PENDING",
      assignedToId,
      items: {
        create: order.items.map((item) => ({
          skuId: item.skuId,
          requiredQty: item.allocatedQty,
          pickedQty: 0,
        })),
      },
    },
    include: {
      items: true,
      order: {
        select: { orderNumber: true, customerName: true },
      },
    },
  });

  // Update order status
  await updateOrderStatus({
    orderId,
    status: "PICKING",
    statusText: `Picklist ${picklistNumber} created`,
  });

  await prisma.unifiedOrder.update({
    where: { id: orderId },
    data: { wmsStatus: "PICKING" },
  });

  return picklist;
}

// =============================================================================
// PICKING WORKFLOW
// =============================================================================

/**
 * Start picking process
 */
export async function startPicking(picklistId: string, pickerId: string) {
  const picklist = await prisma.picklistNew.findUnique({
    where: { id: picklistId },
  });

  if (!picklist) {
    throw new Error("Picklist not found");
  }

  if (picklist.status !== "PENDING") {
    throw new Error(`Cannot start picking for picklist in ${picklist.status} status`);
  }

  return prisma.picklistNew.update({
    where: { id: picklistId },
    data: {
      status: "IN_PROGRESS",
      assignedToId: pickerId,
      startedAt: new Date(),
    },
    include: {
      items: true,
      order: {
        include: { items: true },
      },
    },
  });
}

/**
 * Confirm picked quantity for a picklist item
 */
export async function confirmPickedItem(
  picklistItemId: string,
  pickedQty: number,
  batchNo?: string,
  serialNumbers?: string[]
) {
  const item = await prisma.picklistItemNew.findUnique({
    where: { id: picklistItemId },
    include: { picklist: true },
  });

  if (!item) {
    throw new Error("Picklist item not found");
  }

  if (item.picklist.status !== "IN_PROGRESS") {
    throw new Error("Picklist is not in progress");
  }

  if (pickedQty > item.requiredQty) {
    throw new Error("Picked quantity cannot exceed required quantity");
  }

  // Update picklist item
  const updatedItem = await prisma.picklistItemNew.update({
    where: { id: picklistItemId },
    data: {
      pickedQty,
      batchNo,
      serialNumbers: serialNumbers ? JSON.stringify(serialNumbers) : null,
      pickedAt: new Date(),
    },
  });

  // Check if all items are picked
  const allItems = await prisma.picklistItemNew.findMany({
    where: { picklistId: item.picklistId },
  });

  const allPicked = allItems.every((i) => i.pickedQty >= i.requiredQty);
  const anyPicked = allItems.some((i) => i.pickedQty > 0);

  if (allPicked) {
    await completePicking(item.picklistId);
  }

  return updatedItem;
}

/**
 * Complete picking process
 */
export async function completePicking(picklistId: string) {
  const picklist = await prisma.picklistNew.findUnique({
    where: { id: picklistId },
    include: {
      items: true,
      order: true,
    },
  });

  if (!picklist) {
    throw new Error("Picklist not found");
  }

  // Update picklist
  await prisma.picklistNew.update({
    where: { id: picklistId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  // Update order items with picked quantities
  for (const item of picklist.items) {
    if (item.skuId) {
      await prisma.unifiedOrderItem.updateMany({
        where: {
          orderId: picklist.orderId,
          skuId: item.skuId,
        },
        data: {
          pickedQty: item.pickedQty,
          status: item.pickedQty >= item.requiredQty ? "PICKED" : "PARTIALLY_PICKED",
        },
      });
    }
  }

  // Update order status
  await updateOrderStatus({
    orderId: picklist.orderId,
    status: "PICKED",
    statusText: "All items picked successfully",
  });

  await prisma.unifiedOrder.update({
    where: { id: picklist.orderId },
    data: {
      wmsStatus: "PICKED",
      pickedAt: new Date(),
    },
  });

  return picklist;
}

// =============================================================================
// PACKING WORKFLOW
// =============================================================================

/**
 * Start packing for an order
 */
export async function startPacking(orderId: string, packerId: string) {
  const order = await prisma.unifiedOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "PICKED") {
    throw new Error(`Cannot start packing for order in ${order.status} status`);
  }

  // Update order status
  await updateOrderStatus({
    orderId,
    status: "PACKING",
    statusText: "Packing started",
  });

  await prisma.unifiedOrder.update({
    where: { id: orderId },
    data: { wmsStatus: "PACKING" },
  });

  return order;
}

/**
 * Confirm packed items for an order
 */
export async function confirmPacking(
  orderId: string,
  packedItems: { itemId: string; packedQty: number }[],
  packageDetails?: {
    weight: number;
    length?: number;
    width?: number;
    height?: number;
  }
) {
  const order = await prisma.unifiedOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "PACKING") {
    throw new Error(`Cannot confirm packing for order in ${order.status} status`);
  }

  // Update each item's packed quantity
  for (const packed of packedItems) {
    await prisma.unifiedOrderItem.update({
      where: { id: packed.itemId },
      data: {
        packedQty: packed.packedQty,
        status: "PACKED",
      },
    });
  }

  // Update order with package details if provided
  const updateData: any = {
    wmsStatus: "PACKED",
    packedAt: new Date(),
  };

  if (packageDetails) {
    updateData.totalWeight = packageDetails.weight;
    if (packageDetails.length) updateData.length = packageDetails.length;
    if (packageDetails.width) updateData.width = packageDetails.width;
    if (packageDetails.height) updateData.height = packageDetails.height;

    // Recalculate chargeable weight
    if (packageDetails.length && packageDetails.width && packageDetails.height) {
      const volumetric = (packageDetails.length * packageDetails.width * packageDetails.height) / 5000;
      updateData.volumetricWeight = volumetric;
      updateData.chargeableWeight = Math.max(packageDetails.weight, volumetric);
    }
  }

  await prisma.unifiedOrder.update({
    where: { id: orderId },
    data: updateData,
  });

  // Update order status
  await updateOrderStatus({
    orderId,
    status: "PACKED",
    statusText: "Order packed and ready for shipping label",
  });

  return prisma.unifiedOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
}

// =============================================================================
// READY TO SHIP
// =============================================================================

/**
 * Mark order as ready to ship
 * This is typically called after label is generated
 */
export async function markReadyToShip(orderId: string) {
  const order = await prisma.unifiedOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "PACKED") {
    throw new Error(`Cannot mark as ready to ship for order in ${order.status} status`);
  }

  if (!order.awbNumber) {
    throw new Error("Order must have AWB assigned before marking ready to ship");
  }

  await prisma.unifiedOrder.update({
    where: { id: orderId },
    data: { wmsStatus: "READY_TO_SHIP" },
  });

  await updateOrderStatus({
    orderId,
    status: "READY_TO_SHIP",
    statusText: `Ready for pickup - AWB: ${order.awbNumber}`,
  });

  return prisma.unifiedOrder.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      transporter: true,
    },
  });
}

// =============================================================================
// WMS DASHBOARD & QUERIES
// =============================================================================

/**
 * Get WMS dashboard stats for a location
 */
export async function getWMSDashboardStats(locationId?: string) {
  const locationFilter = locationId ? { locationId } : {};

  const [
    pendingAllocation,
    pendingPicking,
    inPicking,
    pendingPacking,
    readyToShip,
    todayPicked,
    todayPacked,
  ] = await Promise.all([
    prisma.unifiedOrder.count({
      where: { ...locationFilter, status: "CONFIRMED", wmsStatus: "PENDING" },
    }),
    prisma.unifiedOrder.count({
      where: { ...locationFilter, status: "ALLOCATED", wmsStatus: "ALLOCATED" },
    }),
    prisma.unifiedOrder.count({
      where: { ...locationFilter, status: "PICKING", wmsStatus: "PICKING" },
    }),
    prisma.unifiedOrder.count({
      where: { ...locationFilter, status: "PICKED", wmsStatus: "PICKED" },
    }),
    prisma.unifiedOrder.count({
      where: { ...locationFilter, status: "READY_TO_SHIP" },
    }),
    prisma.unifiedOrder.count({
      where: {
        ...locationFilter,
        pickedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.unifiedOrder.count({
      where: {
        ...locationFilter,
        packedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return {
    pendingAllocation,
    pendingPicking,
    inPicking,
    pendingPacking,
    readyToShip,
    todayPicked,
    todayPacked,
    totalPending: pendingAllocation + pendingPicking + inPicking + pendingPacking,
  };
}

/**
 * Get orders pending WMS action
 */
export async function getOrdersPendingWMS(
  locationId?: string,
  wmsStatus?: string,
  page: number = 1,
  pageSize: number = 20
) {
  const where: any = {};

  if (locationId) where.locationId = locationId;
  if (wmsStatus) where.wmsStatus = wmsStatus;

  // Only orders that need WMS action
  where.status = {
    in: ["CONFIRMED", "ALLOCATED", "PICKING", "PICKED", "PACKING", "PACKED"],
  };

  const [items, total] = await Promise.all([
    prisma.unifiedOrder.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        items: true,
        brand: { select: { code: true, name: true } },
        location: { select: { code: true, name: true } },
        picklists: {
          where: { status: { not: "CANCELLED" } },
          take: 1,
        },
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
