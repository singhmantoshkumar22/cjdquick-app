/**
 * Unified Finance Service
 *
 * Handles financial operations for unified orders:
 * - Invoice generation
 * - COD reconciliation
 * - Remittance management
 * - Payment tracking
 */

import { prisma } from "@cjdquick/database";

// =============================================================================
// TYPES
// =============================================================================

export interface GenerateInvoiceParams {
  brandId: string;
  periodStart: Date;
  periodEnd: Date;
  includeDelivered?: boolean;
  includeRto?: boolean;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  brandId: string;
  periodStart: Date;
  periodEnd: Date;
  totalShipments: number;
  deliveredCount: number;
  rtoCount: number;
  freightCharges: number;
  codCharges: number;
  otherCharges: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
}

export interface CODReconcileParams {
  brandId: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface RemittanceParams {
  brandId: string;
  periodStart: Date;
  periodEnd: Date;
  deductions?: {
    freightCharges?: number;
    codFee?: number;
    rtoCharges?: number;
    adjustments?: number;
  };
}

// =============================================================================
// SEQUENCE GENERATION
// =============================================================================

async function generateInvoiceNumber(): Promise<string> {
  const sequence = await prisma.sequenceGenerator.upsert({
    where: { name: "invoice" },
    update: { currentValue: { increment: 1 } },
    create: { name: "invoice", prefix: "INV", currentValue: 1, paddingLength: 8 },
  });

  const paddedNumber = String(sequence.currentValue).padStart(sequence.paddingLength, "0");
  const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");

  return `INV-${yearMonth}-${paddedNumber}`;
}

async function generateRemittanceNumber(): Promise<string> {
  const sequence = await prisma.sequenceGenerator.upsert({
    where: { name: "remittance" },
    update: { currentValue: { increment: 1 } },
    create: { name: "remittance", prefix: "REM", currentValue: 1, paddingLength: 8 },
  });

  const paddedNumber = String(sequence.currentValue).padStart(sequence.paddingLength, "0");
  const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");

  return `REM-${yearMonth}-${paddedNumber}`;
}

// =============================================================================
// INVOICE GENERATION
// =============================================================================

/**
 * Generate invoice for a brand's shipments in a period
 */
export async function generateInvoice(params: GenerateInvoiceParams): Promise<InvoiceSummary> {
  const {
    brandId,
    periodStart,
    periodEnd,
    includeDelivered = true,
    includeRto = true,
  } = params;

  // Get brand details
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  // Build status filter
  const statusFilter: string[] = [];
  if (includeDelivered) statusFilter.push("DELIVERED");
  if (includeRto) statusFilter.push("RTO_DELIVERED");

  // Get orders in period
  const orders = await prisma.unifiedOrder.findMany({
    where: {
      brandId,
      status: { in: statusFilter },
      deliveredAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
  });

  if (orders.length === 0) {
    throw new Error("No orders found in the specified period");
  }

  // Calculate totals
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const rtoOrders = orders.filter((o) => o.status === "RTO_DELIVERED");

  const freightCharges = orders.reduce((sum, o) => sum + (o.shippingCost || 0), 0);
  const codCharges = orders.reduce((sum, o) => sum + (o.codCharges || 0), 0);
  const otherCharges = 0; // Add handling charges etc. if needed

  const subtotal = freightCharges + codCharges + otherCharges;
  const taxRate = 0.18; // 18% GST
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  const invoiceNumber = await generateInvoiceNumber();

  // Create invoice
  const invoice = await prisma.invoiceNew.create({
    data: {
      invoiceNumber,
      brandId,
      periodStart,
      periodEnd,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
      totalShipments: orders.length,
      deliveredCount: deliveredOrders.length,
      rtoCount: rtoOrders.length,
      freightCharges,
      codCharges,
      otherCharges,
      subtotal,
      taxAmount,
      totalAmount,
      balanceAmount: totalAmount,
      status: "DRAFT",
    },
  });

  // Update orders with invoice reference
  await prisma.unifiedOrder.updateMany({
    where: { id: { in: orders.map((o) => o.id) } },
    data: {
      invoiceNo: invoiceNumber,
      invoiceDate: new Date(),
    },
  });

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    brandId: invoice.brandId,
    periodStart: invoice.periodStart!,
    periodEnd: invoice.periodEnd!,
    totalShipments: invoice.totalShipments,
    deliveredCount: invoice.deliveredCount,
    rtoCount: invoice.rtoCount,
    freightCharges: invoice.freightCharges,
    codCharges: invoice.codCharges,
    otherCharges: invoice.otherCharges,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    status: invoice.status,
  };
}

/**
 * Get invoice details
 */
export async function getInvoiceDetails(invoiceId: string) {
  const invoice = await prisma.invoiceNew.findUnique({
    where: { id: invoiceId },
    include: {
      brand: {
        select: {
          code: true,
          name: true,
          contactPerson: true,
          contactEmail: true,
          contactPhone: true,
        },
      },
    },
  });

  return invoice;
}

/**
 * List invoices
 */
export async function listInvoices(params: {
  brandId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  pageSize?: number;
}) {
  const { brandId, status, fromDate, toDate, page = 1, pageSize = 20 } = params;

  const where: any = {};
  if (brandId) where.brandId = brandId;
  if (status) where.status = status;
  if (fromDate || toDate) {
    where.invoiceDate = {};
    if (fromDate) where.invoiceDate.gte = fromDate;
    if (toDate) where.invoiceDate.lte = toDate;
  }

  const [items, total] = await Promise.all([
    prisma.invoiceNew.findMany({
      where,
      orderBy: { invoiceDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        brand: { select: { code: true, name: true } },
      },
    }),
    prisma.invoiceNew.count({ where }),
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
 * Update invoice status
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: string,
  paidAmount?: number
) {
  const invoice = await prisma.invoiceNew.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const updateData: any = { status };

  if (paidAmount !== undefined) {
    updateData.paidAmount = paidAmount;
    updateData.balanceAmount = invoice.totalAmount - paidAmount;
  }

  return prisma.invoiceNew.update({
    where: { id: invoiceId },
    data: updateData,
  });
}

// =============================================================================
// COD RECONCILIATION
// =============================================================================

/**
 * Get COD orders pending reconciliation
 */
export async function getCODPendingReconciliation(params: {
  brandId?: string;
  locationId?: string;
  transporterId?: string;
  fromDate?: Date;
  toDate?: Date;
}) {
  const { brandId, locationId, transporterId, fromDate, toDate } = params;

  const where: any = {
    paymentMode: "COD",
    status: "DELIVERED",
    codCollected: { lt: prisma.unifiedOrder.fields.codAmount },
  };

  if (brandId) where.brandId = brandId;
  if (locationId) where.locationId = locationId;
  if (transporterId) where.transporterId = transporterId;
  if (fromDate || toDate) {
    where.deliveredAt = {};
    if (fromDate) where.deliveredAt.gte = fromDate;
    if (toDate) where.deliveredAt.lte = toDate;
  }

  const orders = await prisma.unifiedOrder.findMany({
    where,
    select: {
      id: true,
      orderNumber: true,
      awbNumber: true,
      customerName: true,
      codAmount: true,
      codCollected: true,
      deliveredAt: true,
      transporter: { select: { code: true, name: true } },
      brand: { select: { code: true, name: true } },
    },
    orderBy: { deliveredAt: "asc" },
  });

  const totalExpected = orders.reduce((sum, o) => sum + (o.codAmount || 0), 0);
  const totalCollected = orders.reduce((sum, o) => sum + (o.codCollected || 0), 0);

  return {
    orders,
    summary: {
      orderCount: orders.length,
      totalExpected,
      totalCollected,
      pendingAmount: totalExpected - totalCollected,
    },
  };
}

/**
 * Mark COD as collected
 */
export async function markCODCollected(
  orderId: string,
  collectedAmount: number,
  paymentMode: string,
  paymentRef?: string
) {
  const order = await prisma.unifiedOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.paymentMode !== "COD") {
    throw new Error("Order is not a COD order");
  }

  if (collectedAmount > (order.codAmount || 0)) {
    throw new Error("Collected amount cannot exceed COD amount");
  }

  await prisma.unifiedOrder.update({
    where: { id: orderId },
    data: {
      codCollected: collectedAmount,
    },
  });

  return prisma.unifiedOrder.findUnique({
    where: { id: orderId },
    include: { transporter: true, brand: true },
  });
}

/**
 * Bulk mark COD collected
 */
export async function bulkMarkCODCollected(
  collections: { orderId: string; collectedAmount: number; paymentMode: string; paymentRef?: string }[]
) {
  const results: any[] = [];
  const errors: any[] = [];

  for (const collection of collections) {
    try {
      const result = await markCODCollected(
        collection.orderId,
        collection.collectedAmount,
        collection.paymentMode,
        collection.paymentRef
      );
      results.push(result);
    } catch (err: any) {
      errors.push({ orderId: collection.orderId, error: err.message });
    }
  }

  return {
    success: errors.length === 0,
    processed: results.length,
    failed: errors.length,
    results,
    errors,
  };
}

// =============================================================================
// REMITTANCE
// =============================================================================

/**
 * Generate COD remittance for a brand
 */
export async function generateRemittance(params: RemittanceParams) {
  const { brandId, periodStart, periodEnd, deductions = {} } = params;

  // Get brand
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  // Get delivered COD orders in period
  const orders = await prisma.unifiedOrder.findMany({
    where: {
      brandId,
      paymentMode: "COD",
      status: "DELIVERED",
      deliveredAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
  });

  if (orders.length === 0) {
    throw new Error("No COD orders found in the specified period");
  }

  // Calculate gross COD
  const grossCodCollected = orders.reduce((sum, o) => sum + (o.codCollected || o.codAmount || 0), 0);

  // Calculate deductions
  const freightCharges = deductions.freightCharges || 0;
  const codFee = deductions.codFee || 0;
  const rtoCharges = deductions.rtoCharges || 0;
  const adjustments = deductions.adjustments || 0;
  const totalDeductions = freightCharges + codFee + rtoCharges + adjustments;

  const netRemittance = grossCodCollected - totalDeductions;

  const remittanceNumber = await generateRemittanceNumber();

  // Create remittance record using CODRemittance (legacy model)
  const remittance = await prisma.cODRemittance.create({
    data: {
      remittanceNumber,
      clientId: brandId, // Using brandId as clientId for compatibility
      periodStart,
      periodEnd,
      grossCodCollected,
      deductions: totalDeductions,
      netRemittance,
      deductionDetails: JSON.stringify({
        freightCharges,
        codFee,
        rtoCharges,
        adjustments,
      }),
      shipmentCount: orders.length,
      deliveredCount: orders.length,
      rtoCount: 0,
      status: "PENDING",
    },
  });

  return {
    id: remittance.id,
    remittanceNumber: remittance.remittanceNumber,
    brandId,
    periodStart,
    periodEnd,
    grossCodCollected,
    deductions: totalDeductions,
    netRemittance,
    shipmentCount: orders.length,
    status: remittance.status,
  };
}

/**
 * List remittances
 */
export async function listRemittances(params: {
  brandId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  pageSize?: number;
}) {
  const { brandId, status, fromDate, toDate, page = 1, pageSize = 20 } = params;

  const where: any = {};
  if (brandId) where.clientId = brandId;
  if (status) where.status = status;
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) where.createdAt.lte = toDate;
  }

  const [items, total] = await Promise.all([
    prisma.cODRemittance.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cODRemittance.count({ where }),
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
 * Process remittance payment
 */
export async function processRemittancePayment(
  remittanceId: string,
  paymentMode: string,
  paymentRef: string
) {
  const remittance = await prisma.cODRemittance.findUnique({
    where: { id: remittanceId },
  });

  if (!remittance) {
    throw new Error("Remittance not found");
  }

  if (remittance.status === "PAID") {
    throw new Error("Remittance already paid");
  }

  return prisma.cODRemittance.update({
    where: { id: remittanceId },
    data: {
      status: "PAID",
      paymentMode,
      paymentRef,
      paidAt: new Date(),
    },
  });
}

// =============================================================================
// FINANCE DASHBOARD
// =============================================================================

/**
 * Get finance dashboard stats
 */
export async function getFinanceDashboardStats(brandId?: string) {
  const brandFilter = brandId ? { brandId } : {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  // Invoice stats
  const [
    pendingInvoices,
    overdueInvoices,
    thisMonthBilled,
    lastMonthBilled,
  ] = await Promise.all([
    prisma.invoiceNew.aggregate({
      where: { ...brandFilter, status: { in: ["DRAFT", "SENT"] } },
      _sum: { balanceAmount: true },
      _count: true,
    }),
    prisma.invoiceNew.aggregate({
      where: { ...brandFilter, status: "OVERDUE" },
      _sum: { balanceAmount: true },
      _count: true,
    }),
    prisma.invoiceNew.aggregate({
      where: {
        ...brandFilter,
        invoiceDate: { gte: thisMonthStart },
      },
      _sum: { totalAmount: true },
    }),
    prisma.invoiceNew.aggregate({
      where: {
        ...brandFilter,
        invoiceDate: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { totalAmount: true },
    }),
  ]);

  // COD stats
  const [codPending, codCollectedToday] = await Promise.all([
    prisma.unifiedOrder.aggregate({
      where: {
        ...brandFilter,
        paymentMode: "COD",
        status: "DELIVERED",
      },
      _sum: { codAmount: true, codCollected: true },
      _count: true,
    }),
    prisma.unifiedOrder.aggregate({
      where: {
        ...brandFilter,
        paymentMode: "COD",
        status: "DELIVERED",
        deliveredAt: { gte: today },
      },
      _sum: { codCollected: true },
    }),
  ]);

  // Remittance stats
  const [pendingRemittances, paidThisMonth] = await Promise.all([
    prisma.cODRemittance.aggregate({
      where: brandId ? { clientId: brandId, status: "PENDING" } : { status: "PENDING" },
      _sum: { netRemittance: true },
      _count: true,
    }),
    prisma.cODRemittance.aggregate({
      where: {
        ...(brandId ? { clientId: brandId } : {}),
        status: "PAID",
        paidAt: { gte: thisMonthStart },
      },
      _sum: { netRemittance: true },
    }),
  ]);

  const codExpected = codPending._sum.codAmount || 0;
  const codCollected = codPending._sum.codCollected || 0;

  return {
    invoices: {
      pendingCount: pendingInvoices._count,
      pendingAmount: pendingInvoices._sum.balanceAmount || 0,
      overdueCount: overdueInvoices._count,
      overdueAmount: overdueInvoices._sum.balanceAmount || 0,
      thisMonthBilled: thisMonthBilled._sum.totalAmount || 0,
      lastMonthBilled: lastMonthBilled._sum.totalAmount || 0,
    },
    cod: {
      pendingCount: codPending._count,
      expectedAmount: codExpected,
      collectedAmount: codCollected,
      pendingAmount: codExpected - codCollected,
      collectedToday: codCollectedToday._sum.codCollected || 0,
    },
    remittances: {
      pendingCount: pendingRemittances._count,
      pendingAmount: pendingRemittances._sum.netRemittance || 0,
      paidThisMonth: paidThisMonth._sum.netRemittance || 0,
    },
  };
}

/**
 * Get revenue breakdown by transporter
 */
export async function getRevenueByTransporter(
  periodStart: Date,
  periodEnd: Date,
  brandId?: string
) {
  const where: any = {
    status: "DELIVERED",
    deliveredAt: {
      gte: periodStart,
      lte: periodEnd,
    },
  };

  if (brandId) where.brandId = brandId;

  const orders = await prisma.unifiedOrder.groupBy({
    by: ["transporterId"],
    where,
    _sum: {
      shippingCost: true,
      codCharges: true,
    },
    _count: true,
  });

  // Get transporter names
  const transporterIds = orders.map((o) => o.transporterId).filter(Boolean) as string[];
  const transporters = await prisma.transporter.findMany({
    where: { id: { in: transporterIds } },
    select: { id: true, code: true, name: true },
  });

  const transporterMap = new Map(transporters.map((t) => [t.id, t]));

  return orders.map((o) => ({
    transporterId: o.transporterId,
    transporterCode: o.transporterId ? transporterMap.get(o.transporterId)?.code : "N/A",
    transporterName: o.transporterId ? transporterMap.get(o.transporterId)?.name : "Unknown",
    shipmentCount: o._count,
    freightRevenue: o._sum.shippingCost || 0,
    codRevenue: o._sum.codCharges || 0,
    totalRevenue: (o._sum.shippingCost || 0) + (o._sum.codCharges || 0),
  }));
}

// =============================================================================
// CLAIMS MANAGEMENT
// =============================================================================

async function generateClaimNumber(): Promise<string> {
  const sequence = await prisma.sequenceGenerator.upsert({
    where: { name: "shipment_claim" },
    update: { currentValue: { increment: 1 } },
    create: { name: "shipment_claim", prefix: "CLM", currentValue: 1, paddingLength: 6 },
  });

  const paddedNumber = String(sequence.currentValue).padStart(sequence.paddingLength, "0");
  const year = new Date().getFullYear();

  return `CLM-${year}-${paddedNumber}`;
}

export interface FileClaimParams {
  brandId: string;
  orderId?: string;
  orderNumber: string;
  awbNumber: string;
  claimType: string;
  reason: string;
  description?: string;
  declaredValue: number;
  claimAmount: number;
  photos?: string[];
  documents?: string[];
  filedBy: string;
}

/**
 * File a new shipment claim
 */
export async function fileClaim(params: FileClaimParams) {
  const {
    brandId,
    orderId,
    orderNumber,
    awbNumber,
    claimType,
    reason,
    description,
    declaredValue,
    claimAmount,
    photos,
    documents,
    filedBy,
  } = params;

  // Verify brand exists
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  // Check if claim already exists for this order
  const existingClaim = await prisma.shipmentClaim.findFirst({
    where: {
      brandId,
      orderNumber,
      status: { notIn: ["REJECTED", "SETTLED"] },
    },
  });

  if (existingClaim) {
    throw new Error("A claim already exists for this order");
  }

  const claimNumber = await generateClaimNumber();

  const claim = await prisma.shipmentClaim.create({
    data: {
      claimNumber,
      brandId,
      orderId,
      orderNumber,
      awbNumber,
      claimType,
      reason,
      description,
      declaredValue,
      claimAmount,
      photos: photos ? JSON.stringify(photos) : null,
      documents: documents ? JSON.stringify(documents) : null,
      filedBy,
      status: "UNDER_REVIEW",
    },
    include: {
      brand: {
        select: { code: true, name: true },
      },
    },
  });

  return claim;
}

/**
 * List claims for a brand
 */
export async function listClaims(params: {
  brandId?: string;
  status?: string;
  claimType?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  pageSize?: number;
}) {
  const { brandId, status, claimType, fromDate, toDate, page = 1, pageSize = 20 } = params;

  const where: any = {};
  if (brandId) where.brandId = brandId;
  if (status) where.status = status;
  if (claimType) where.claimType = claimType;
  if (fromDate || toDate) {
    where.filedAt = {};
    if (fromDate) where.filedAt.gte = fromDate;
    if (toDate) where.filedAt.lte = toDate;
  }

  const [items, total] = await Promise.all([
    prisma.shipmentClaim.findMany({
      where,
      orderBy: { filedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        brand: { select: { code: true, name: true } },
      },
    }),
    prisma.shipmentClaim.count({ where }),
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
 * Get claim details
 */
export async function getClaimDetails(claimId: string) {
  return prisma.shipmentClaim.findUnique({
    where: { id: claimId },
    include: {
      brand: {
        select: { code: true, name: true, contactPerson: true, contactEmail: true, contactPhone: true },
      },
    },
  });
}

/**
 * Update claim status (admin)
 */
export async function updateClaimStatus(
  claimId: string,
  status: string,
  reviewedBy: string,
  approvedAmount?: number,
  rejectionReason?: string
) {
  const claim = await prisma.shipmentClaim.findUnique({
    where: { id: claimId },
  });

  if (!claim) {
    throw new Error("Claim not found");
  }

  const updateData: any = {
    status,
    reviewedBy,
    reviewedAt: new Date(),
  };

  if (status === "APPROVED") {
    updateData.approvedAmount = approvedAmount || claim.claimAmount;
    updateData.approvedBy = reviewedBy;
    updateData.approvedAt = new Date();
  }

  if (status === "REJECTED" && rejectionReason) {
    updateData.rejectionReason = rejectionReason;
  }

  if (status === "SETTLED") {
    updateData.settledAt = new Date();
  }

  return prisma.shipmentClaim.update({
    where: { id: claimId },
    data: updateData,
    include: {
      brand: { select: { code: true, name: true } },
    },
  });
}

/**
 * Get claims dashboard stats
 */
export async function getClaimsDashboardStats(brandId?: string) {
  const brandFilter = brandId ? { brandId } : {};
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [underReview, approved, rejected, settledThisMonth] = await Promise.all([
    prisma.shipmentClaim.aggregate({
      where: { ...brandFilter, status: "UNDER_REVIEW" },
      _count: true,
      _sum: { claimAmount: true },
    }),
    prisma.shipmentClaim.aggregate({
      where: {
        ...brandFilter,
        status: "APPROVED",
        approvedAt: { gte: thirtyDaysAgo },
      },
      _count: true,
      _sum: { approvedAmount: true },
    }),
    prisma.shipmentClaim.aggregate({
      where: {
        ...brandFilter,
        status: "REJECTED",
        reviewedAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    }),
    prisma.shipmentClaim.aggregate({
      where: {
        ...brandFilter,
        status: "SETTLED",
        settledAt: { gte: thirtyDaysAgo },
      },
      _count: true,
      _sum: { approvedAmount: true },
    }),
  ]);

  return {
    underReview: {
      count: underReview._count,
      amount: underReview._sum.claimAmount || 0,
    },
    approved: {
      count: approved._count,
      amount: approved._sum.approvedAmount || 0,
    },
    rejected: {
      count: rejected._count,
    },
    settledThisMonth: {
      count: settledThisMonth._count,
      amount: settledThisMonth._sum.approvedAmount || 0,
    },
  };
}
