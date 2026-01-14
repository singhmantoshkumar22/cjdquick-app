/**
 * Nykaa Seller Integration
 *
 * Nykaa is India's largest beauty and wellness platform.
 * Uses OAuth2 with REST API for seller integrations.
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

interface NykaaOrderItem {
  orderItemId: string;
  orderId: string;
  createdDate: string;
  status: string;
  sellerSkuCode: string;
  nykaaSkuId: string;
  productName: string;
  brand: string;
  shade?: string;
  size?: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  discount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
  paymentType: 'PREPAID' | 'COD';
  dispatchSla: string;
  dispatchBy: string;
  shippingAddress: {
    name: string;
    email?: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  billingAddress?: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    gstin?: string;
  };
}

interface NykaaOrdersResponse {
  success: boolean;
  message: string;
  data: {
    orderItems: NykaaOrderItem[];
    pagination: {
      total: number;
      page: number;
      size: number;
      totalPages: number;
    };
  };
}

export class NykaaIntegration implements IChannelIntegration {
  name = 'Nykaa';
  code = 'NYKAA';

  private client: HttpClient;
  private credentials: ChannelCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private circuitBreaker = createCircuitBreaker({ name: 'nykaa' });
  private rateLimiter = createRateLimiter({
    name: 'nykaa',
    ...MarketplaceRateLimits.NYKAA,
  });

  constructor(credentials: ChannelCredentials) {
    this.credentials = credentials;
    this.client = createHttpClient({
      baseURL: 'https://seller-api.nykaa.com',
      timeout: 30000,
    });
  }

  async authenticate(): Promise<boolean> {
    return this.circuitBreaker.execute(async () => {
      await this.rateLimiter.acquire();

      try {
        const response = await this.client.post<{
          success: boolean;
          data: {
            accessToken: string;
            expiresIn: number;
          };
        }>(
          '/auth/token',
          {
            clientId: this.credentials.apiKey,
            clientSecret: this.credentials.apiSecret,
            sellerId: this.credentials.sellerId,
          }
        );

        if (response.success && response.data?.data?.accessToken) {
          this.accessToken = response.data.data.accessToken;
          this.tokenExpiry = Date.now() + (response.data.data.expiresIn * 1000) - 60000;
          this.client.setHeader('Authorization', `Bearer ${this.accessToken}`);
          this.client.setHeader('X-Seller-Id', this.credentials.sellerId || '');
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
        throw new Error('Nykaa authentication failed');
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
          params.append('status', 'CREATED,CONFIRMED,PACKED');
        }

        if (request.fromDate) {
          params.append('fromDate', request.fromDate.toISOString());
        }
        if (request.toDate) {
          params.append('toDate', request.toDate.toISOString());
        }
        params.append('size', (request.limit || 50).toString());
        if (request.cursor) {
          params.append('page', request.cursor);
        }

        const response = await this.client.get<NykaaOrdersResponse>(
          `/v1/orders?${params.toString()}`
        );

        if (response.success && response.data?.data?.orderItems) {
          const orders = this.transformOrders(response.data.data.orderItems);
          const pagination = response.data.data.pagination;
          return {
            success: true,
            orders,
            totalCount: pagination.total,
            hasMore: pagination.page < pagination.totalPages,
            nextCursor: pagination.page < pagination.totalPages
              ? (pagination.page + 1).toString()
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

  private transformOrders(orderItems: NykaaOrderItem[]): ChannelOrder[] {
    const orderMap = new Map<string, NykaaOrderItem[]>();

    for (const item of orderItems) {
      const existing = orderMap.get(item.orderId) || [];
      existing.push(item);
      orderMap.set(item.orderId, existing);
    }

    const orders: ChannelOrder[] = [];

    for (const [orderId, items] of orderMap) {
      const firstItem = items[0];
      const isCOD = firstItem.paymentType === 'COD';

      const subtotal = items.reduce((sum, i) => sum + i.taxableValue, 0);
      const taxAmount = items.reduce((sum, i) => sum + i.totalTax, 0);
      const discount = items.reduce((sum, i) => sum + i.discount, 0);
      const total = items.reduce((sum, i) => sum + i.totalAmount, 0);

      const shipping = firstItem.shippingAddress;
      const billing = firstItem.billingAddress;

      orders.push({
        externalOrderId: orderId,
        externalOrderNo: orderId,
        channel: 'NYKAA',
        orderDate: new Date(firstItem.createdDate),
        paymentMode: isCOD ? 'COD' : 'PREPAID',

        customerName: shipping?.name || '',
        customerPhone: shipping?.phone || '',
        customerEmail: shipping?.email,

        shippingAddress: {
          name: shipping?.name || '',
          phone: shipping?.phone || '',
          email: shipping?.email,
          addressLine1: shipping?.addressLine1 || '',
          addressLine2: shipping?.addressLine2,
          city: shipping?.city || '',
          state: shipping?.state || '',
          pincode: shipping?.pincode || '',
          country: 'India',
        },

        billingAddress: billing ? {
          name: billing.name,
          phone: shipping?.phone || '',
          addressLine1: billing.addressLine1,
          addressLine2: billing.addressLine2,
          city: billing.city,
          state: billing.state,
          pincode: billing.pincode,
          country: 'India',
        } : undefined,

        items: items.map((item) => ({
          externalItemId: item.orderItemId,
          skuCode: item.sellerSkuCode,
          name: [item.brand, item.productName, item.shade, item.size]
            .filter(Boolean)
            .join(' - '),
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
          taxAmount: item.totalTax,
          discount: item.discount,
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

        // Confirm order
        if (request.status === 'CONFIRMED') {
          const confirmResponse = await this.client.post<{ success: boolean }>(
            '/v1/orders/confirm',
            { orderItemIds: [request.externalOrderId] }
          );

          if (!confirmResponse.success) {
            return {
              success: false,
              error: confirmResponse.error || 'Failed to confirm order',
            };
          }
        }

        // Pack order
        if (request.status === 'PACKED') {
          const packPayload = {
            orderItemId: request.externalOrderId,
            invoiceNumber: request.fulfillmentId,
            invoiceDate: new Date().toISOString(),
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

        // Dispatch with tracking
        if (request.trackingNumber) {
          const dispatchPayload = {
            orderItemId: request.externalOrderId,
            awbNumber: request.trackingNumber,
            courierName: request.carrierName || 'Self-Ship',
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
          updates: [
            {
              sellerSkuCode: request.skuCode,
              quantity: request.quantity,
              warehouseCode: request.locationId,
            },
          ],
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
      const data = payload as { orderItems?: NykaaOrderItem[] };
      if (!data.orderItems?.length) return null;
      const orders = this.transformOrders(data.orderItems);
      return orders[0] || null;
    } catch {
      return null;
    }
  }
}

export function createNykaaIntegration(credentials: ChannelCredentials): NykaaIntegration {
  return new NykaaIntegration(credentials);
}
