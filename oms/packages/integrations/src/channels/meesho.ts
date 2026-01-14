/**
 * Meesho Supplier Integration
 *
 * Meesho is a social commerce platform for resellers.
 * Uses REST API with API key authentication.
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

interface MeeshoOrder {
  orderId: string;
  subOrderId: string;
  orderCreatedAt: string;
  orderStatus: string;
  productId: string;
  sku: string;
  productName: string;
  variation: string;
  quantity: number;
  supplierPrice: number;
  platformFee: number;
  gst: number;
  shippingCharge: number;
  codCharge: number;
  netAmount: number;
  paymentMode: 'PREPAID' | 'COD';
  expectedDispatchDate: string;
  customerDetails: {
    name: string;
    mobile: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  labelGenerated: boolean;
  labelUrl?: string;
}

interface MeeshoOrdersResponse {
  success: boolean;
  data: {
    orders: MeeshoOrder[];
    totalCount: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export class MeeshoIntegration implements IChannelIntegration {
  name = 'Meesho';
  code = 'MEESHO';

  private client: HttpClient;
  private credentials: ChannelCredentials;
  private circuitBreaker = createCircuitBreaker({ name: 'meesho' });
  private rateLimiter = createRateLimiter({
    name: 'meesho',
    ...MarketplaceRateLimits.MEESHO,
  });

  constructor(credentials: ChannelCredentials) {
    this.credentials = credentials;
    this.client = createHttpClient({
      baseURL: 'https://supplier-api.meesho.com',
      timeout: 30000,
      headers: {
        'X-API-Key': credentials.apiKey || '',
        'X-Supplier-Id': credentials.sellerId || '',
      },
    });
  }

  async authenticate(): Promise<boolean> {
    return this.circuitBreaker.execute(async () => {
      await this.rateLimiter.acquire();

      try {
        // Meesho uses API key authentication, verify by making a test call
        const response = await this.client.get<{ success: boolean; supplierId: string }>(
          '/v1/supplier/profile'
        );

        return response.success;
      } catch {
        return false;
      }
    });
  }

  async pullOrders(request: PullOrdersRequest): Promise<PullOrdersResponse> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.rateLimiter.acquire();

        const params = new URLSearchParams();

        if (request.status?.length) {
          params.append('status', request.status.join(','));
        } else {
          params.append('status', 'PENDING,CONFIRMED,PACKED');
        }

        if (request.fromDate) {
          params.append('fromDate', request.fromDate.toISOString());
        }
        if (request.toDate) {
          params.append('toDate', request.toDate.toISOString());
        }
        params.append('limit', (request.limit || 50).toString());
        if (request.cursor) {
          params.append('page', request.cursor);
        }

        const response = await this.client.get<MeeshoOrdersResponse>(
          `/v2/orders?${params.toString()}`
        );

        if (response.success && response.data?.data?.orders) {
          const orders = this.transformOrders(response.data.data.orders);
          return {
            success: true,
            orders,
            totalCount: response.data.data.totalCount,
            hasMore: response.data.data.hasMore,
            nextCursor: response.data.data.hasMore
              ? (response.data.data.page + 1).toString()
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

  private transformOrders(meeshoOrders: MeeshoOrder[]): ChannelOrder[] {
    // Group sub-orders by main order ID
    const orderMap = new Map<string, MeeshoOrder[]>();

    for (const order of meeshoOrders) {
      const existing = orderMap.get(order.orderId) || [];
      existing.push(order);
      orderMap.set(order.orderId, existing);
    }

    const orders: ChannelOrder[] = [];

    for (const [orderId, subOrders] of orderMap) {
      const firstOrder = subOrders[0];
      const isCOD = firstOrder.paymentMode === 'COD';

      const subtotal = subOrders.reduce((sum, o) => sum + o.supplierPrice * o.quantity, 0);
      const taxAmount = subOrders.reduce((sum, o) => sum + o.gst, 0);
      const shipping = subOrders.reduce((sum, o) => sum + o.shippingCharge, 0);
      const codCharges = subOrders.reduce((sum, o) => sum + (o.codCharge || 0), 0);
      const total = subOrders.reduce((sum, o) => sum + o.netAmount, 0);

      const addr = firstOrder.customerDetails;

      orders.push({
        externalOrderId: orderId,
        externalOrderNo: orderId,
        channel: 'MEESHO',
        orderDate: new Date(firstOrder.orderCreatedAt),
        paymentMode: isCOD ? 'COD' : 'PREPAID',

        customerName: addr?.name || '',
        customerPhone: addr?.mobile || '',

        shippingAddress: {
          name: addr?.name || '',
          phone: addr?.mobile || '',
          addressLine1: addr?.address || '',
          addressLine2: addr?.landmark,
          city: addr?.city || '',
          state: addr?.state || '',
          pincode: addr?.pincode || '',
          country: 'India',
        },

        items: subOrders.map((order) => ({
          externalItemId: order.subOrderId,
          skuCode: order.sku,
          name: `${order.productName}${order.variation ? ` - ${order.variation}` : ''}`,
          quantity: order.quantity,
          unitPrice: order.supplierPrice,
          taxAmount: order.gst,
          discount: 0,
          totalPrice: order.netAmount,
        })),

        subtotal,
        taxAmount,
        shippingCharges: shipping,
        discount: 0,
        codCharges: isCOD ? codCharges : undefined,
        totalAmount: total,

        status: firstOrder.orderStatus,
        fulfillmentStatus: firstOrder.orderStatus,
        paymentStatus: isCOD ? 'pending' : 'paid',

        rawData: subOrders,
      });
    }

    return orders;
  }

  async updateOrderStatus(request: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResponse> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.rateLimiter.acquire();

        // Confirm order
        if (request.status === 'CONFIRMED') {
          const confirmResponse = await this.client.post<{ success: boolean }>(
            '/v2/orders/confirm',
            { subOrderIds: [request.externalOrderId] }
          );

          if (!confirmResponse.success) {
            return {
              success: false,
              error: confirmResponse.error || 'Failed to confirm order',
            };
          }
        }

        // Pack and generate label
        if (request.status === 'PACKED') {
          const packResponse = await this.client.post<{ success: boolean; labelUrl?: string }>(
            '/v2/orders/pack',
            {
              subOrderId: request.externalOrderId,
              invoiceNumber: request.fulfillmentId,
            }
          );

          if (!packResponse.success) {
            return {
              success: false,
              error: packResponse.error || 'Failed to pack order',
            };
          }
        }

        // Ship with AWB
        if (request.trackingNumber) {
          const shipPayload = {
            subOrderId: request.externalOrderId,
            awbNumber: request.trackingNumber,
            courierName: request.carrierName || 'Self-Ship',
            pickupDate: (request.shipmentDate || new Date()).toISOString(),
          };

          const shipResponse = await this.client.post<{ success: boolean }>(
            '/v2/orders/ship',
            shipPayload
          );

          if (shipResponse.success) {
            return {
              success: true,
              fulfillmentId: request.trackingNumber,
            };
          }

          return {
            success: false,
            error: shipResponse.error || 'Failed to ship order',
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
        await this.rateLimiter.acquire();

        const payload = {
          sku: request.skuCode,
          quantity: request.quantity,
        };

        const response = await this.client.post<{ success: boolean }>(
          '/v2/inventory/update',
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
      const data = payload as { orders?: MeeshoOrder[] };
      if (!data.orders?.length) return null;
      const orders = this.transformOrders(data.orders);
      return orders[0] || null;
    } catch {
      return null;
    }
  }
}

export function createMeeshoIntegration(credentials: ChannelCredentials): MeeshoIntegration {
  return new MeeshoIntegration(credentials);
}
