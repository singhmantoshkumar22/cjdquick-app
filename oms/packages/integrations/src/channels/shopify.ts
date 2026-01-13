import crypto from 'crypto';
import { HttpClient, createHttpClient } from '../http-client';
import {
  IChannelIntegration,
  ChannelCredentials,
  ChannelOrder,
  PullOrdersRequest,
  PullOrdersResponse,
  UpdateOrderStatusRequest,
  UpdateOrderStatusResponse,
  InventoryUpdateRequest,
  InventoryUpdateResponse,
  ProductInfo,
} from './types';

interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  total_discounts: string;
  total_shipping_price_set: {
    shop_money: { amount: string };
  };
  line_items: {
    id: number;
    sku: string;
    name: string;
    quantity: number;
    price: string;
    total_discount: string;
    tax_lines: { price: string }[];
  }[];
  shipping_address: {
    name: string;
    address1: string;
    address2: string | null;
    city: string;
    province: string;
    zip: string;
    country: string;
    phone: string;
  };
  billing_address: {
    name: string;
    address1: string;
    address2: string | null;
    city: string;
    province: string;
    zip: string;
    country: string;
    phone: string;
  } | null;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  gateway: string;
  tags: string;
  note: string | null;
}

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  variants: {
    id: number;
    sku: string;
    price: string;
    compare_at_price: string | null;
    weight: number;
    barcode: string | null;
    inventory_quantity: number;
    option1: string | null;
    option2: string | null;
    option3: string | null;
  }[];
  images: { src: string }[];
}

export class ShopifyIntegration implements IChannelIntegration {
  name = 'Shopify';
  code = 'SHOPIFY';

  private client: HttpClient;
  private credentials: ChannelCredentials;

  constructor(credentials: ChannelCredentials) {
    this.credentials = credentials;
    this.client = createHttpClient({
      baseURL: `https://${credentials.shopDomain}/admin/api/2024-01`,
      timeout: 30000,
      headers: {
        'X-Shopify-Access-Token': credentials.accessToken || '',
        'Content-Type': 'application/json',
      },
    });
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await this.client.get<{ shop: { id: number } }>('/shop.json');
      return response.success && !!response.data?.shop?.id;
    } catch {
      return false;
    }
  }

  async pullOrders(request: PullOrdersRequest): Promise<PullOrdersResponse> {
    try {
      const params = new URLSearchParams();

      if (request.fromDate) {
        params.append('created_at_min', request.fromDate.toISOString());
      }
      if (request.toDate) {
        params.append('created_at_max', request.toDate.toISOString());
      }
      if (request.status && request.status.length > 0) {
        params.append('status', request.status.join(','));
      }
      if (request.limit) {
        params.append('limit', request.limit.toString());
      }
      if (request.cursor) {
        params.append('page_info', request.cursor);
      }

      const url = `/orders.json?${params.toString()}`;
      const response = await this.client.get<{ orders: ShopifyOrder[] }>(url);

      if (!response.success || !response.data?.orders) {
        return {
          success: false,
          error: response.error || 'Failed to fetch orders',
        };
      }

      const orders: ChannelOrder[] = response.data.orders.map((order) => this.mapOrder(order));

      return {
        success: true,
        orders,
        totalCount: orders.length,
        hasMore: orders.length === (request.limit || 50),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private mapOrder(order: ShopifyOrder): ChannelOrder {
    const isCOD = order.gateway?.toLowerCase().includes('cod') ||
                  order.gateway?.toLowerCase().includes('cash') ||
                  order.tags?.toLowerCase().includes('cod');

    return {
      externalOrderId: order.id.toString(),
      externalOrderNo: order.name,
      channel: 'SHOPIFY',
      orderDate: new Date(order.created_at),
      paymentMode: isCOD ? 'COD' : 'PREPAID',

      customerName: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() ||
                    order.shipping_address?.name || 'Unknown',
      customerPhone: order.customer?.phone || order.shipping_address?.phone || '',
      customerEmail: order.email || order.customer?.email,

      shippingAddress: {
        name: order.shipping_address?.name || '',
        phone: order.shipping_address?.phone || order.customer?.phone || '',
        addressLine1: order.shipping_address?.address1 || '',
        addressLine2: order.shipping_address?.address2 || undefined,
        city: order.shipping_address?.city || '',
        state: order.shipping_address?.province || '',
        pincode: order.shipping_address?.zip || '',
        country: order.shipping_address?.country || 'India',
      },

      billingAddress: order.billing_address ? {
        name: order.billing_address.name,
        phone: order.billing_address.phone || order.customer?.phone || '',
        addressLine1: order.billing_address.address1,
        addressLine2: order.billing_address.address2 || undefined,
        city: order.billing_address.city,
        state: order.billing_address.province,
        pincode: order.billing_address.zip,
        country: order.billing_address.country || 'India',
      } : undefined,

      items: order.line_items.map((item) => ({
        externalItemId: item.id.toString(),
        skuCode: item.sku || `SHOPIFY-${item.id}`,
        name: item.name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.price),
        taxAmount: item.tax_lines?.reduce((sum, t) => sum + parseFloat(t.price || '0'), 0) || 0,
        discount: parseFloat(item.total_discount || '0'),
        totalPrice: parseFloat(item.price) * item.quantity - parseFloat(item.total_discount || '0'),
      })),

      subtotal: parseFloat(order.subtotal_price),
      taxAmount: parseFloat(order.total_tax),
      shippingCharges: parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0'),
      discount: parseFloat(order.total_discounts),
      totalAmount: parseFloat(order.total_price),

      status: order.financial_status,
      fulfillmentStatus: order.fulfillment_status || 'unfulfilled',
      paymentStatus: order.financial_status,

      tags: order.tags ? order.tags.split(',').map((t) => t.trim()) : [],
      notes: order.note || undefined,
      rawData: order,
    };
  }

  async updateOrderStatus(request: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResponse> {
    try {
      // Create a fulfillment in Shopify
      const fulfillmentPayload = {
        fulfillment: {
          location_id: null, // Will use default location
          tracking_number: request.trackingNumber,
          tracking_url: request.trackingUrl,
          tracking_company: request.carrierName,
          notify_customer: true,
        },
      };

      const response = await this.client.post<{
        fulfillment: { id: number; status: string };
      }>(
        `/orders/${request.externalOrderId}/fulfillments.json`,
        fulfillmentPayload
      );

      if (response.success && response.data?.fulfillment?.id) {
        return {
          success: true,
          fulfillmentId: response.data.fulfillment.id.toString(),
        };
      }

      return {
        success: false,
        error: response.error || 'Failed to update order status',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateInventory(request: InventoryUpdateRequest): Promise<InventoryUpdateResponse> {
    try {
      // First, find the inventory item ID by SKU
      const productsResponse = await this.client.get<{ products: ShopifyProduct[] }>(
        `/products.json?fields=id,variants`
      );

      if (!productsResponse.success || !productsResponse.data?.products) {
        return {
          success: false,
          error: 'Failed to fetch products',
        };
      }

      let inventoryItemId: number | null = null;

      for (const product of productsResponse.data.products) {
        for (const variant of product.variants) {
          if (variant.sku === request.skuCode) {
            // Get inventory item ID from variant
            const variantResponse = await this.client.get<{
              variant: { inventory_item_id: number };
            }>(`/variants/${variant.id}.json`);

            if (variantResponse.data?.variant?.inventory_item_id) {
              inventoryItemId = variantResponse.data.variant.inventory_item_id;
              break;
            }
          }
        }
        if (inventoryItemId) break;
      }

      if (!inventoryItemId) {
        return {
          success: false,
          error: `SKU ${request.skuCode} not found in Shopify`,
        };
      }

      // Get location ID
      const locationsResponse = await this.client.get<{
        locations: { id: number }[];
      }>('/locations.json');

      const locationId = locationsResponse.data?.locations?.[0]?.id;

      if (!locationId) {
        return {
          success: false,
          error: 'No location found in Shopify',
        };
      }

      // Set inventory level
      const response = await this.client.post<{
        inventory_level: { available: number };
      }>('/inventory_levels/set.json', {
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available: request.quantity,
      });

      if (response.success) {
        return { success: true };
      }

      return {
        success: false,
        error: response.error || 'Failed to update inventory',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getProducts(
    limit: number = 50,
    cursor?: string
  ): Promise<{ success: boolean; products?: ProductInfo[]; nextCursor?: string; error?: string }> {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (cursor) {
        params.append('page_info', cursor);
      }

      const response = await this.client.get<{ products: ShopifyProduct[] }>(
        `/products.json?${params.toString()}`
      );

      if (!response.success || !response.data?.products) {
        return {
          success: false,
          error: response.error || 'Failed to fetch products',
        };
      }

      const products: ProductInfo[] = response.data.products.map((product) => ({
        externalId: product.id.toString(),
        sku: product.variants[0]?.sku || `SHOPIFY-${product.id}`,
        name: product.title,
        description: product.body_html?.replace(/<[^>]*>/g, '') || undefined,
        price: parseFloat(product.variants[0]?.price || '0'),
        compareAtPrice: product.variants[0]?.compare_at_price
          ? parseFloat(product.variants[0].compare_at_price)
          : undefined,
        weight: product.variants[0]?.weight,
        barcode: product.variants[0]?.barcode || undefined,
        images: product.images?.map((img) => img.src),
        inventoryQuantity: product.variants[0]?.inventory_quantity,
        variants: product.variants.map((v) => ({
          id: v.id.toString(),
          sku: v.sku,
          price: parseFloat(v.price),
          inventoryQuantity: v.inventory_quantity,
          option1: v.option1 || undefined,
          option2: v.option2 || undefined,
          option3: v.option3 || undefined,
        })),
      }));

      return {
        success: true,
        products,
        nextCursor: products.length === limit ? 'next' : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  verifyWebhook(payload: string, signature: string): boolean {
    if (!this.credentials.apiSecret) {
      return false;
    }

    const hmac = crypto
      .createHmac('sha256', this.credentials.apiSecret)
      .update(payload, 'utf8')
      .digest('base64');

    return hmac === signature;
  }

  parseWebhookOrder(payload: unknown): ChannelOrder | null {
    try {
      const order = payload as ShopifyOrder;
      if (!order.id) return null;
      return this.mapOrder(order);
    } catch {
      return null;
    }
  }
}

// Factory function
export function createShopifyIntegration(credentials: ChannelCredentials): ShopifyIntegration {
  return new ShopifyIntegration(credentials);
}
