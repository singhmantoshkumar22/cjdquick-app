/**
 * Centralized configuration constants for OMS frontend
 * These match the backend enums and can be easily updated when backend changes
 */

// ============================================================================
// Sales Channels (matches backend Channel enum)
// ============================================================================
export const channelConfig: Record<string, { label: string; color: string }> = {
  AMAZON: { label: "Amazon", color: "bg-orange-500" },
  FLIPKART: { label: "Flipkart", color: "bg-yellow-500" },
  MYNTRA: { label: "Myntra", color: "bg-pink-500" },
  AJIO: { label: "Ajio", color: "bg-purple-500" },
  MEESHO: { label: "Meesho", color: "bg-red-500" },
  NYKAA: { label: "Nykaa", color: "bg-pink-400" },
  TATA_CLIQ: { label: "Tata CLiQ", color: "bg-indigo-500" },
  JIOMART: { label: "JioMart", color: "bg-blue-600" },
  SHOPIFY: { label: "Shopify", color: "bg-green-500" },
  WEBSITE: { label: "Website", color: "bg-blue-500" },
  MANUAL: { label: "Manual", color: "bg-gray-500" },
};

export const channels = Object.keys(channelConfig);

// ============================================================================
// Geographic Delivery Zones (for pincode serviceability)
// ============================================================================
export const deliveryZones = [
  "North",
  "South",
  "East",
  "West",
  "Central",
  "North-East",
];

export const deliveryZoneConfig: Record<string, { label: string; color: string }> = {
  North: { label: "North", color: "bg-blue-500" },
  South: { label: "South", color: "bg-green-500" },
  East: { label: "East", color: "bg-yellow-500" },
  West: { label: "West", color: "bg-orange-500" },
  Central: { label: "Central", color: "bg-purple-500" },
  "North-East": { label: "North-East", color: "bg-pink-500" },
};

// ============================================================================
// QC Types (matches backend QCType enum)
// ============================================================================
export const qcTypeConfig: Record<string, { label: string; color: string }> = {
  INBOUND: { label: "Inbound", color: "bg-blue-500" },
  RETURN: { label: "Return", color: "bg-orange-500" },
  PRODUCTION: { label: "Production", color: "bg-green-500" },
  CYCLE_COUNT: { label: "Cycle Count", color: "bg-purple-500" },
  RANDOM_AUDIT: { label: "Random Audit", color: "bg-yellow-500" },
};

export const qcTypes = Object.keys(qcTypeConfig);

// ============================================================================
// QC Parameter Types
// ============================================================================
export const parameterTypes = [
  { value: "VISUAL", label: "Visual Inspection" },
  { value: "DIMENSIONAL", label: "Dimensional Check" },
  { value: "WEIGHT", label: "Weight Check" },
  { value: "BARCODE", label: "Barcode Scan" },
  { value: "FUNCTIONAL", label: "Functional Test" },
  { value: "PACKAGING", label: "Packaging Check" },
  { value: "LABEL", label: "Label Verification" },
];

// ============================================================================
// Order Status Configuration
// ============================================================================
export const orderStatusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  CREATED: { label: "Created", variant: "outline" },
  CONFIRMED: { label: "Confirmed", variant: "secondary" },
  ALLOCATED: { label: "Allocated", variant: "secondary" },
  PARTIALLY_ALLOCATED: { label: "Partial", variant: "outline" },
  PICKLIST_GENERATED: { label: "Picklist", variant: "secondary" },
  PICKING: { label: "Picking", variant: "secondary" },
  PICKED: { label: "Picked", variant: "secondary" },
  PACKING: { label: "Packing", variant: "secondary" },
  PACKED: { label: "Packed", variant: "default" },
  MANIFESTED: { label: "Manifested", variant: "default" },
  SHIPPED: { label: "Shipped", variant: "default" },
  IN_TRANSIT: { label: "In Transit", variant: "default" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", variant: "default" },
  DELIVERED: { label: "Delivered", variant: "default" },
  RTO_INITIATED: { label: "RTO Initiated", variant: "destructive" },
  RTO_IN_TRANSIT: { label: "RTO Transit", variant: "destructive" },
  RTO_DELIVERED: { label: "RTO Delivered", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  ON_HOLD: { label: "On Hold", variant: "outline" },
};

// ============================================================================
// Payment Modes
// ============================================================================
export const paymentModes = [
  { value: "PREPAID", label: "Prepaid" },
  { value: "COD", label: "Cash on Delivery" },
];

// ============================================================================
// Goods Receipt Status Configuration
// ============================================================================
export const grStatusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-gray-500" },
  PENDING_QC: { label: "Pending QC", color: "bg-yellow-500" },
  QC_IN_PROGRESS: { label: "QC In Progress", color: "bg-blue-500" },
  QC_COMPLETED: { label: "QC Completed", color: "bg-green-500" },
  POSTED: { label: "Posted", color: "bg-green-600" },
  CANCELLED: { label: "Cancelled", color: "bg-red-500" },
};

// ============================================================================
// WMS Zone Types (different from delivery zones - these are warehouse zones)
// ============================================================================
export const warehouseZoneTypes = [
  { value: "SALEABLE", label: "Saleable" },
  { value: "QUARANTINE", label: "Quarantine" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "RETURNS", label: "Returns" },
  { value: "STAGING", label: "Staging" },
  { value: "RECEIVING", label: "Receiving" },
  { value: "SHIPPING", label: "Shipping" },
];
