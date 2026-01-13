// Common types for all channel/marketplace integrations

export interface ChannelCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  shopDomain?: string;  // For Shopify
  sellerId?: string;    // For marketplaces
  marketplaceId?: string;
}

export interface ChannelOrder {
  externalOrderId: string;
  externalOrderNo: string;
  channel: string;
  orderDate: Date;
  paymentMode: 'PREPAID' | 'COD';

  // Customer info
  customerName: string;
  customerPhone: string;
  customerEmail?: string;

  // Shipping address
  shippingAddress: {
    name: string;
    phone: string;
    email?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };

  // Billing address
  billingAddress?: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };

  // Items
  items: {
    externalItemId: string;
    skuCode: string;
    name: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    discount: number;
    totalPrice: number;
  }[];

  // Amounts
  subtotal: number;
  taxAmount: number;
  shippingCharges: number;
  discount: number;
  codCharges?: number;
  totalAmount: number;

  // Status
  status: string;
  fulfillmentStatus?: string;
  paymentStatus?: string;

  // Additional
  tags?: string[];
  notes?: string;
  rawData?: unknown;
}

export interface PullOrdersRequest {
  fromDate?: Date;
  toDate?: Date;
  status?: string[];
  limit?: number;
  cursor?: string;
}

export interface PullOrdersResponse {
  success: boolean;
  orders?: ChannelOrder[];
  totalCount?: number;
  hasMore?: boolean;
  nextCursor?: string;
  error?: string;
}

export interface UpdateOrderStatusRequest {
  externalOrderId: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrierName?: string;
  shipmentDate?: Date;
  fulfillmentId?: string;
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  fulfillmentId?: string;
  error?: string;
}

export interface InventoryUpdateRequest {
  skuCode: string;
  quantity: number;
  locationId?: string;
}

export interface InventoryUpdateResponse {
  success: boolean;
  error?: string;
}

export interface ProductInfo {
  externalId: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  weight?: number;
  barcode?: string;
  images?: string[];
  inventoryQuantity?: number;
  variants?: {
    id: string;
    sku: string;
    price: number;
    inventoryQuantity?: number;
    option1?: string;
    option2?: string;
    option3?: string;
  }[];
}

// Interface that all channel integrations must implement
export interface IChannelIntegration {
  name: string;
  code: string;

  // Authentication
  authenticate(): Promise<boolean>;
  refreshToken?(): Promise<boolean>;

  // Order operations
  pullOrders(request: PullOrdersRequest): Promise<PullOrdersResponse>;
  updateOrderStatus(request: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResponse>;

  // Inventory operations
  updateInventory?(request: InventoryUpdateRequest): Promise<InventoryUpdateResponse>;

  // Product operations
  getProducts?(limit?: number, cursor?: string): Promise<{ success: boolean; products?: ProductInfo[]; nextCursor?: string; error?: string }>;

  // Webhook operations
  verifyWebhook?(payload: string, signature: string): boolean;
  parseWebhookOrder?(payload: unknown): ChannelOrder | null;
}
