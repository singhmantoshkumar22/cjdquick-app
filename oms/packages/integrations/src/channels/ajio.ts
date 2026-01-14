/**
 * AJIO Marketplace Integration
 *
 * AJIO is a fashion e-commerce platform by Reliance Retail.
 * Uses OAuth2 authentication with REST APIs.
 */

import crypto from 'crypto';
import { HttpClient, createHttpClient } from '../http-client';
import {
  createCircuitBreaker,
  createRateLimiter,
  MarketplaceRateLimits,
} from '../utils';
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
} from './types';

interface AjioOrderItem {
  orderItemId: string;
  orderId: string;
  createdAt: string;
  status: string;
  articleCode: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  discountAmount: number;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  paymentMethod: 'PREPAID' | 'COD';
  deliverySlotStart: string;
  deliverySlotEnd: string;
  shippingDetails: {
    customerName: string;
    email: string;
    mobile: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
}

interface AjioOrdersResponse {
  success: boolean;
  data: {
    orders: AjioOrderItem[];
    pagination: {
      totalRecords: number;
      currentPage: number;
      totalPages: number;
      hasNext: boolean;
    };
  };
}

export class AjioIntegration implements IChannelIntegration {
  name = 'AJIO';
  code = 'AJIO';

  private client: HttpClient;
  private credentials: ChannelCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private circuitBreaker = createCircuitBreaker({ name: 'ajio' });
  private rateLimiter = createRateLimiter({
    name: 'ajio',
    ...MarketplaceRateLimits.AJIO,
  });

  constructor(credentials: ChannelCredentials) {
    this.credentials = credentials;
    this.client = createHttpClient({
      baseURL: 'https://seller-api.ajio.com',
      timeout: 30000,
    });
  }

  async authenticate(): Promise<boolean> {
    return this.circuitBreaker.execute(async () => {
      await this.rateLimiter.acquire();

      try {
        const response = await this.client.post<{
          access_token: string;
          token_type: string;
          expires_in: number;
        }>(
          '/oauth/token',
          {
            client_id: this.credentials.apiKey,
            client_secret: this.credentials.apiSecret,
            grant_type: 'client_credentials',
          }
        );

        if (response.success && response.data?.access_token) {
          this.accessToken = response.data.access_token;
          this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer
          this.client.setHeader('Authorization', `Bearer ${this.accessToken}`);
          return true;
        }

        return false;
      } catch {
        return false;
      }
    });
  }

  async refreshToken(): Promise<boolean> {
    return this.authenticate();
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      const success = await this.authenticate();
      if (!success) {
        throw new Error('AJIO authentication failed');
      }
    }
  }

  async pullOrders(request: PullOrdersRequest): Promise<PullOrdersResponse> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.ensureAuthenticated();
        await this.rateLimiter.acquire();

        const params = new URLSearchParams();

        if (request.status?.length) {
          params.append('status', request.status.join(','));
        } else {
          params.append('status', 'PENDING,CONFIRMED,PACKED');
        }

        if (request.fromDate) {
          params.append('fromDate', request.fromDate.toISOString().split('T')[0]);
        }
        if (request.toDate) {
          params.append('toDate', request.toDate.toISOString().split('T')[0]);
        }
        if (request.limit) {
          params.append('pageSize', request.limit.toString());
        }
        if (request.cursor) {
          params.append('page', request.cursor);
        }

        const response = await this.client.get<AjioOrdersResponse>(
          `/v1/orders?${params.toString()}`
        );

        if (response.success && response.data?.data?.orders) {
          const orders = this.transformOrders(response.data.data.orders);
          return {
            success: true,
            orders,
            totalCount: response.data.data.pagination.totalRecords,
            hasMore: response.data.data.pagination.hasNext,
            nextCursor: response.data.data.pagination.hasNext
              ? (response.data.data.pagination.currentPage + 1).toString()
              : undefined,
          };
        }

        return {
          success: true,
          orders: [],
          totalCount: 0,
          hasMore: false,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }

  private transformOrders(orderItems: AjioOrderItem[]): ChannelOrder[] {
    const orderMap = new Map<string, AjioOrderItem[]>();

    for (const item of orderItems) {
      const existing = orderMap.get(item.orderId) || [];
      existing.push(item);
      orderMap.set(item.orderId, existing);
    }

    const orders: ChannelOrder[] = [];

    for (const [orderId, items] of orderMap) {
      const firstItem = items[0];
      const isCOD = firstItem.paymentMethod === 'COD';

      const subtotal = items.reduce((sum, i) => sum + i.taxableAmount, 0);
      const taxAmount = items.reduce((sum, i) => sum + i.gstAmount, 0);
      const discount = items.reduce((sum, i) => sum + i.discountAmount, 0);
      const total = items.reduce((sum, i) => sum + i.totalAmount, 0);

      orders.push({
        externalOrderId: orderId,
        externalOrderNo: orderId,
        channel: 'AJIO',
        orderDate: new Date(firstItem.createdAt),
        paymentMode: isCOD ? 'COD' : 'PREPAID',

        customerName: firstItem.shippingDetails?.customerName || '',
        customerPhone: firstItem.shippingDetails?.mobile || '',
        customerEmail: firstItem.shippingDetails?.email,

        shippingAddress: {
          name: firstItem.shippingDetails?.customerName || '',
          phone: firstItem.shippingDetails?.mobile || '',
          email: firstItem.shippingDetails?.email,
          addressLine1: firstItem.shippingDetails?.addressLine1 || '',
          addressLine2: [
            firstItem.shippingDetails?.addressLine2,
            firstItem.shippingDetails?.landmark,
          ].filter(Boolean).join(', ') || undefined,
          city: firstItem.shippingDetails?.city || '',
          state: firstItem.shippingDetails?.state || '',
          pincode: firstItem.shippingDetails?.pincode || '',
          country: 'India',
        },

        items: items.map((item) => ({
          externalItemId: item.orderItemId,
          skuCode: item.articleCode,
          name: `${item.productName} - ${item.size} - ${item.color}`,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
          taxAmount: item.gstAmount,
          discount: item.discountAmount,
          totalPrice: item.totalAmount,
        })),

        subtotal,
        taxAmount,
        shippingCharges: 0,
        discount,
        totalAmount: total,

        status: firstItem.status,
        fulfillmentStatus: firstItem.status,
        paymentStatus: isCOD ? 'pending' : 'paid',

        rawData: items,
      });
    }

    return orders;
  }

  async updateOrderStatus(request: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResponse> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.ensureAuthenticated();
        await this.rateLimiter.acquire();

        if (request.status === 'CONFIRMED') {
          const confirmPayload = {
            orderItemId: request.externalOrderId,
            confirmedDate: new Date().toISOString(),
          };

          const confirmResponse = await this.client.post<{ success: boolean }>(
            '/v1/orders/confirm',
            confirmPayload
          );

          if (!confirmResponse.success) {
            return {
              success: false,
              error: confirmResponse.error || 'Failed to confirm order',
            };
          }
        }

        if (request.status === 'PACKED') {
          const packPayload = {
            orderItemId: request.externalOrderId,
            packedDate: new Date().toISOString(),
            invoiceNumber: request.fulfillmentId,
          };

          const packResponse = await this.client.post<{ success: boolean }>(
            '/v1/orders/pack',
            packPayload
          );

          if (!packResponse.success) {
            return {
              success: false,
              error: packResponse.error || 'Failed to pack order',
            };
          }
        }

        if (request.trackingNumber) {
          const dispatchPayload = {
            orderItemId: request.externalOrderId,
            trackingNumber: request.trackingNumber,
            carrierName: request.carrierName || 'Self-Ship',
            dispatchDate: (request.shipmentDate || new Date()).toISOString(),
          };

          const dispatchResponse = await this.client.post<{ success: boolean }>(
            '/v1/orders/dispatch',
            dispatchPayload
          );

          if (dispatchResponse.success) {
            return {
              success: true,
              fulfillmentId: request.trackingNumber,
            };
          }

          return {
            success: false,
            error: dispatchResponse.error || 'Failed to dispatch order',
          };
        }

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }

  async updateInventory(request: InventoryUpdateRequest): Promise<InventoryUpdateResponse> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.ensureAuthenticated();
        await this.rateLimiter.acquire();

        const payload = {
          articleCode: request.skuCode,
          quantity: request.quantity,
          warehouseCode: request.locationId,
        };

        const response = await this.client.post<{ success: boolean }>(
          '/v1/inventory/update',
          payload
        );

        return {
          success: response.success,
          error: response.error,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }

  verifyWebhook(payload: string, signature: string): boolean {
    if (!this.credentials.apiSecret) {
      return false;
    }

    const hmac = crypto
      .createHmac('sha256', this.credentials.apiSecret)
      .update(payload, 'utf8')
      .digest('hex');

    return hmac === signature;
  }

  parseWebhookOrder(payload: unknown): ChannelOrder | null {
    try {
      const data = payload as { orders?: AjioOrderItem[] };
      if (!data.orders?.length) return null;
      const orders = this.transformOrders(data.orders);
      return orders[0] || null;
    } catch {
      return null;
    }
  }
}

export function createAjioIntegration(credentials: ChannelCredentials): AjioIntegration {
  return new AjioIntegration(credentials);
}
