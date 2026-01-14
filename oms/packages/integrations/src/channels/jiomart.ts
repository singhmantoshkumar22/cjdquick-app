/**
 * JioMart Seller Integration
 *
 * JioMart is an e-commerce platform by Reliance Retail.
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

interface JioMartOrderItem {
  orderItemId: string;
  orderId: string;
  orderPlacedAt: string;
  itemStatus: string;
  sellerSku: string;
  jioSku: string;
  productName: string;
  category: string;
  variant?: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  discount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  totalTax: number;
  itemTotal: number;
  paymentType: 'PREPAID' | 'COD';
  deliverySlot: {
    slotStart: string;
    slotEnd: string;
  };
  dispatchBefore: string;
  customerInfo: {
    name: string;
    email?: string;
    mobile: string;
    alternateMobile?: string;
  };
  deliveryAddress: {
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    addressType: 'HOME' | 'OFFICE' | 'OTHER';
  };
}

interface JioMartOrdersResponse {
  responseCode: string;
  responseMessage: string;
  data: {
    orderItems: JioMartOrderItem[];
    pagination: {
      totalItems: number;
      currentPage: number;
      itemsPerPage: number;
      totalPages: number;
      hasNextPage: boolean;
    };
  };
}

export class JioMartIntegration implements IChannelIntegration {
  name = 'JioMart';
  code = 'JIOMART';

  private client: HttpClient;
  private credentials: ChannelCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private circuitBreaker = createCircuitBreaker({ name: 'jiomart' });
  private rateLimiter = createRateLimiter({
    name: 'jiomart',
    ...MarketplaceRateLimits.JIOMART,
  });

  constructor(credentials: ChannelCredentials) {
    this.credentials = credentials;
    this.client = createHttpClient({
      baseURL: 'https://seller-api.jiomart.com',
      timeout: 30000,
    });
  }

  async authenticate(): Promise<boolean> {
    return this.circuitBreaker.execute(async () => {
      await this.rateLimiter.acquire();

      try {
        const response = await this.client.post<{
          responseCode: string;
          data: {
            accessToken: string;
            tokenType: string;
            expiresIn: number;
          };
        }>(
          '/auth/v1/token',
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
        throw new Error('JioMart authentication failed');
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
          params.append('itemStatus', request.status.join(','));
        } else {
          params.append('itemStatus', 'PENDING,ACCEPTED,PACKED');
        }

        if (request.fromDate) {
          params.append('fromDate', request.fromDate.toISOString());
        }
        if (request.toDate) {
          params.append('toDate', request.toDate.toISOString());
        }
        params.append('itemsPerPage', (request.limit || 50).toString());
        if (request.cursor) {
          params.append('page', request.cursor);
        }

        const response = await this.client.get<JioMartOrdersResponse>(
          `/seller/v1/orders?${params.toString()}`
        );

        if (response.success && response.data?.data?.orderItems) {
          const orders = this.transformOrders(response.data.data.orderItems);
          const pagination = response.data.data.pagination;
          return {
            success: true,
            orders,
            totalCount: pagination.totalItems,
            hasMore: pagination.hasNextPage,
            nextCursor: pagination.hasNextPage
              ? (pagination.currentPage + 1).toString()
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

  private transformOrders(orderItems: JioMartOrderItem[]): ChannelOrder[] {
    const orderMap = new Map<string, JioMartOrderItem[]>();

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
      const total = items.reduce((sum, i) => sum + i.itemTotal, 0);

      const customer = firstItem.customerInfo;
      const addr = firstItem.deliveryAddress;

      orders.push({
        externalOrderId: orderId,
        externalOrderNo: orderId,
        channel: 'JIOMART',
        orderDate: new Date(firstItem.orderPlacedAt),
        paymentMode: isCOD ? 'COD' : 'PREPAID',

        customerName: customer?.name || '',
        customerPhone: customer?.mobile || '',
        customerEmail: customer?.email,

        shippingAddress: {
          name: customer?.name || '',
          phone: customer?.mobile || '',
          email: customer?.email,
          addressLine1: addr?.addressLine1 || '',
          addressLine2: [addr?.addressLine2, addr?.landmark]
            .filter(Boolean)
            .join(', ') || undefined,
          city: addr?.city || '',
          state: addr?.state || '',
          pincode: addr?.pincode || '',
          country: 'India',
        },

        items: items.map((item) => ({
          externalItemId: item.orderItemId,
          skuCode: item.sellerSku,
          name: item.variant
            ? `${item.productName} - ${item.variant}`
            : item.productName,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
          taxAmount: item.totalTax,
          discount: item.discount,
          totalPrice: item.itemTotal,
        })),

        subtotal,
        taxAmount,
        shippingCharges: 0,
        discount,
        totalAmount: total,

        status: firstItem.itemStatus,
        fulfillmentStatus: firstItem.itemStatus,
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

        // Accept order item
        if (request.status === 'ACCEPTED') {
          const acceptResponse = await this.client.post<{ responseCode: string }>(
            '/seller/v1/orders/accept',
            { orderItemIds: [request.externalOrderId] }
          );

          if (acceptResponse.data?.responseCode !== 'SUCCESS') {
            return {
              success: false,
              error: acceptResponse.error || 'Failed to accept order',
            };
          }
        }

        // Pack order item
        if (request.status === 'PACKED') {
          const packPayload = {
            orderItemId: request.externalOrderId,
            invoiceNumber: request.fulfillmentId,
            invoiceDate: new Date().toISOString(),
          };

          const packResponse = await this.client.post<{ responseCode: string }>(
            '/seller/v1/orders/pack',
            packPayload
          );

          if (packResponse.data?.responseCode !== 'SUCCESS') {
            return {
              success: false,
              error: packResponse.error || 'Failed to pack order',
            };
          }
        }

        // Ready to ship with AWB
        if (request.trackingNumber) {
          const shipPayload = {
            orderItemId: request.externalOrderId,
            awbNumber: request.trackingNumber,
            logisticsPartner: request.carrierName || 'Self-Ship',
            handoverDate: (request.shipmentDate || new Date()).toISOString(),
          };

          const shipResponse = await this.client.post<{ responseCode: string }>(
            '/seller/v1/orders/ready-to-ship',
            shipPayload
          );

          if (shipResponse.data?.responseCode === 'SUCCESS') {
            return {
              success: true,
              fulfillmentId: request.trackingNumber,
            };
          }

          return {
            success: false,
            error: shipResponse.error || 'Failed to mark ready to ship',
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
              sellerSku: request.skuCode,
              availableQuantity: request.quantity,
              warehouseId: request.locationId,
            },
          ],
        };

        const response = await this.client.post<{ responseCode: string }>(
          '/seller/v1/inventory/update',
          payload
        );

        return {
          success: response.data?.responseCode === 'SUCCESS',
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
      const data = payload as { orderItems?: JioMartOrderItem[] };
      if (!data.orderItems?.length) return null;
      const orders = this.transformOrders(data.orderItems);
      return orders[0] || null;
    } catch {
      return null;
    }
  }
}

export function createJioMartIntegration(credentials: ChannelCredentials): JioMartIntegration {
  return new JioMartIntegration(credentials);
}
