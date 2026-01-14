/**
 * Myntra Marketplace Integration
 *
 * Myntra is owned by Flipkart and uses a similar API structure.
 * Sellers can integrate via the Flipkart Seller API with Myntra-specific endpoints.
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

interface MyntraOrderItem {
  orderItemId: string;
  orderId: string;
  orderDate: string;
  orderState: string;
  sku: string;
  styleId: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  discount: number;
  taxAmount: number;
  totalPrice: number;
  shippingCharge: number;
  paymentType: 'PREPAID' | 'COD';
  dispatchByDate: string;
  sla: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
}

interface MyntraOrdersResponse {
  status: string;
  orderItems: MyntraOrderItem[];
  hasMore: boolean;
  nextCursor?: string;
}

export class MyntraIntegration implements IChannelIntegration {
  name = 'Myntra';
  code = 'MYNTRA';

  private client: HttpClient;
  private credentials: ChannelCredentials;
  private accessToken: string | null = null;
  private circuitBreaker = createCircuitBreaker({ name: 'myntra' });
  private rateLimiter = createRateLimiter({
    name: 'myntra',
    ...MarketplaceRateLimits.MYNTRA,
  });

  constructor(credentials: ChannelCredentials) {
    this.credentials = credentials;
    this.client = createHttpClient({
      baseURL: 'https://api.flipkart.net/sellers/myntra',
      timeout: 30000,
    });
  }

  async authenticate(): Promise<boolean> {
    return this.circuitBreaker.execute(async () => {
      await this.rateLimiter.acquire();

      try {
        const authString = Buffer.from(
          `${this.credentials.apiKey}:${this.credentials.apiSecret}`
        ).toString('base64');

        const response = await this.client.post<{
          access_token: string;
          token_type: string;
          expires_in: number;
        }>(
          '/oauth/token',
          'grant_type=client_credentials&scope=Myntra_Seller_Api',
          {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        if (response.success && response.data?.access_token) {
          this.accessToken = response.data.access_token;
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
    if (!this.accessToken) {
      const success = await this.authenticate();
      if (!success) {
        throw new Error('Myntra authentication failed');
      }
    }
  }

  async pullOrders(request: PullOrdersRequest): Promise<PullOrdersResponse> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.ensureAuthenticated();
        await this.rateLimiter.acquire();

        const states = request.status || ['APPROVED', 'PACKED', 'READY_TO_DISPATCH'];
        const allOrders: ChannelOrder[] = [];

        for (const state of states) {
          const params = new URLSearchParams();
          params.append('orderState', state);

          if (request.fromDate) {
            params.append('fromDate', request.fromDate.toISOString());
          }
          if (request.toDate) {
            params.append('toDate', request.toDate.toISOString());
          }
          if (request.limit) {
            params.append('pageSize', request.limit.toString());
          }
          if (request.cursor) {
            params.append('cursor', request.cursor);
          }

          const response = await this.client.get<MyntraOrdersResponse>(
            `/v1/orders?${params.toString()}`
          );

          if (response.success && response.data?.orderItems) {
            const orders = this.transformOrders(response.data.orderItems);
            allOrders.push(...orders);
          }
        }

        return {
          success: true,
          orders: allOrders,
          totalCount: allOrders.length,
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

  private transformOrders(orderItems: MyntraOrderItem[]): ChannelOrder[] {
    const orderMap = new Map<string, MyntraOrderItem[]>();

    for (const item of orderItems) {
      const existing = orderMap.get(item.orderId) || [];
      existing.push(item);
      orderMap.set(item.orderId, existing);
    }

    const orders: ChannelOrder[] = [];

    for (const [orderId, items] of orderMap) {
      const firstItem = items[0];
      const isCOD = firstItem.paymentType === 'COD';

      const subtotal = items.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);
      const taxAmount = items.reduce((sum, i) => sum + i.taxAmount, 0);
      const discount = items.reduce((sum, i) => sum + i.discount, 0);
      const shipping = items.reduce((sum, i) => sum + (i.shippingCharge || 0), 0);
      const total = items.reduce((sum, i) => sum + i.totalPrice, 0);

      orders.push({
        externalOrderId: orderId,
        externalOrderNo: orderId,
        channel: 'MYNTRA',
        orderDate: new Date(firstItem.orderDate),
        paymentMode: isCOD ? 'COD' : 'PREPAID',

        customerName: firstItem.customerDetails?.name || '',
        customerPhone: firstItem.customerDetails?.phone || '',
        customerEmail: firstItem.customerDetails?.email,

        shippingAddress: {
          name: firstItem.customerDetails?.name || '',
          phone: firstItem.customerDetails?.phone || '',
          email: firstItem.customerDetails?.email,
          addressLine1: firstItem.customerDetails?.address?.line1 || '',
          addressLine2: firstItem.customerDetails?.address?.line2,
          city: firstItem.customerDetails?.address?.city || '',
          state: firstItem.customerDetails?.address?.state || '',
          pincode: firstItem.customerDetails?.address?.pincode || '',
          country: 'India',
        },

        items: items.map((item) => ({
          externalItemId: item.orderItemId,
          skuCode: item.sku,
          name: `${item.productName} - ${item.size} - ${item.color}`,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
          taxAmount: item.taxAmount,
          discount: item.discount,
          totalPrice: item.totalPrice,
        })),

        subtotal,
        taxAmount,
        shippingCharges: shipping,
        discount,
        totalAmount: total,

        status: firstItem.orderState,
        fulfillmentStatus: firstItem.orderState,
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

        if (request.status === 'PACKED' || request.status === 'packed') {
          const packPayload = {
            orderItems: [
              {
                orderItemId: request.externalOrderId,
                packedDate: new Date().toISOString(),
                invoiceNumber: request.fulfillmentId || `INV-${request.externalOrderId}`,
              },
            ],
          };

          const packResponse = await this.client.post<{ status: string }>(
            '/v1/orders/pack',
            packPayload
          );

          if (!packResponse.success) {
            return {
              success: false,
              error: packResponse.error || 'Failed to mark as packed',
            };
          }
        }

        if (request.trackingNumber) {
          const dispatchPayload = {
            orderItems: [
              {
                orderItemId: request.externalOrderId,
                trackingId: request.trackingNumber,
                courierName: request.carrierName || 'Self-Ship',
                dispatchDate: (request.shipmentDate || new Date()).toISOString(),
              },
            ],
          };

          const dispatchResponse = await this.client.post<{ status: string }>(
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
            error: dispatchResponse.error || 'Failed to mark as dispatched',
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
          inventoryUpdates: [
            {
              sku: request.skuCode,
              quantity: request.quantity,
              fulfillmentCenterId: request.locationId,
            },
          ],
        };

        const response = await this.client.post<{ status: string }>(
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
      .digest('base64');

    return hmac === signature;
  }

  parseWebhookOrder(payload: unknown): ChannelOrder | null {
    try {
      const data = payload as { orderItems?: MyntraOrderItem[] };
      if (!data.orderItems?.length) return null;
      const orders = this.transformOrders(data.orderItems);
      return orders[0] || null;
    } catch {
      return null;
    }
  }
}

export function createMyntraIntegration(credentials: ChannelCredentials): MyntraIntegration {
  return new MyntraIntegration(credentials);
}
