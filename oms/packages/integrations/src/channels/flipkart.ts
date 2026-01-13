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
} from './types';

interface FlipkartOrder {
  orderItemId: string;
  orderId: string;
  orderDate: string;
  cancellationDate: string | null;
  orderState: string;
  sku: string;
  fsn: string;
  quantity: number;
  priceComponents: {
    sellingPrice: number;
    totalPrice: number;
    shippingCharge: number;
    customerPrice: number;
  };
  paymentType: string;
  dispatchByDate: string;
  dispatchAfterDate: string;
  sla: string;
  shipmentType: string;
  buyerDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: {
      addressLine1: string;
      addressLine2: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  subShipments: string[];
  isReplacement: boolean;
  serviceProfile: string;
  courierReturn: string;
}

interface FlipkartOrdersResponse {
  orderItems: FlipkartOrder[];
  hasMore: boolean;
  nextPageUrl: string | null;
}

export class FlipkartIntegration implements IChannelIntegration {
  name = 'Flipkart';
  code = 'FLIPKART';

  private client: HttpClient;
  private credentials: ChannelCredentials;
  private accessToken: string | null = null;

  constructor(credentials: ChannelCredentials) {
    this.credentials = credentials;
    this.client = createHttpClient({
      baseURL: 'https://api.flipkart.net/sellers',
      timeout: 30000,
    });
  }

  async authenticate(): Promise<boolean> {
    try {
      // Flipkart uses OAuth2 with client credentials
      const authString = Buffer.from(
        `${this.credentials.apiKey}:${this.credentials.apiSecret}`
      ).toString('base64');

      const response = await this.client.post<{
        access_token: string;
        token_type: string;
        expires_in: number;
      }>(
        '/oauth/token',
        'grant_type=client_credentials&scope=Seller_Api',
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
  }

  async refreshToken(): Promise<boolean> {
    return this.authenticate();
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken) {
      const success = await this.authenticate();
      if (!success) {
        throw new Error('Flipkart authentication failed');
      }
    }
  }

  async pullOrders(request: PullOrdersRequest): Promise<PullOrdersResponse> {
    try {
      await this.ensureAuthenticated();

      const states = request.status || ['APPROVED', 'PACKED', 'READY_TO_DISPATCH'];
      const allOrders: ChannelOrder[] = [];

      for (const state of states) {
        const params = new URLSearchParams();
        params.append('orderStates', state);

        if (request.fromDate) {
          params.append('orderDate_from', request.fromDate.toISOString());
        }
        if (request.toDate) {
          params.append('orderDate_to', request.toDate.toISOString());
        }

        const response = await this.client.get<FlipkartOrdersResponse>(
          `/v3/shipments/filter/?${params.toString()}`
        );

        if (response.success && response.data?.orderItems) {
          const orders = this.groupOrderItems(response.data.orderItems);
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
  }

  private groupOrderItems(orderItems: FlipkartOrder[]): ChannelOrder[] {
    // Group order items by orderId
    const orderMap = new Map<string, FlipkartOrder[]>();

    for (const item of orderItems) {
      const existing = orderMap.get(item.orderId) || [];
      existing.push(item);
      orderMap.set(item.orderId, existing);
    }

    const orders: ChannelOrder[] = [];

    for (const [orderId, items] of orderMap) {
      const firstItem = items[0];
      const isCOD = firstItem.paymentType?.toUpperCase() === 'COD';

      const subtotal = items.reduce((sum, i) => sum + i.priceComponents.sellingPrice * i.quantity, 0);
      const shipping = items.reduce((sum, i) => sum + (i.priceComponents.shippingCharge || 0), 0);
      const total = items.reduce((sum, i) => sum + i.priceComponents.totalPrice, 0);

      orders.push({
        externalOrderId: orderId,
        externalOrderNo: orderId,
        channel: 'FLIPKART',
        orderDate: new Date(firstItem.orderDate),
        paymentMode: isCOD ? 'COD' : 'PREPAID',

        customerName: `${firstItem.buyerDetails?.firstName || ''} ${firstItem.buyerDetails?.lastName || ''}`.trim(),
        customerPhone: firstItem.buyerDetails?.phone || '',
        customerEmail: firstItem.buyerDetails?.email,

        shippingAddress: {
          name: `${firstItem.buyerDetails?.firstName || ''} ${firstItem.buyerDetails?.lastName || ''}`.trim(),
          phone: firstItem.buyerDetails?.phone || '',
          email: firstItem.buyerDetails?.email,
          addressLine1: firstItem.buyerDetails?.address?.addressLine1 || '',
          addressLine2: firstItem.buyerDetails?.address?.addressLine2 || undefined,
          city: firstItem.buyerDetails?.address?.city || '',
          state: firstItem.buyerDetails?.address?.state || '',
          pincode: firstItem.buyerDetails?.address?.pincode || '',
          country: 'India',
        },

        items: items.map((item) => ({
          externalItemId: item.orderItemId,
          skuCode: item.sku,
          name: item.sku, // Flipkart doesn't return product name in order API
          quantity: item.quantity,
          unitPrice: item.priceComponents.sellingPrice,
          taxAmount: 0, // Included in price
          discount: 0,
          totalPrice: item.priceComponents.sellingPrice * item.quantity,
        })),

        subtotal,
        taxAmount: 0,
        shippingCharges: shipping,
        discount: 0,
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
    try {
      await this.ensureAuthenticated();

      // Mark as packed
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
          '/v2/shipments/packing',
          packPayload
        );

        if (!packResponse.success) {
          return {
            success: false,
            error: packResponse.error || 'Failed to mark as packed',
          };
        }
      }

      // Mark as dispatched with tracking
      if (request.trackingNumber) {
        const dispatchPayload = {
          orderItems: [
            {
              orderItemId: request.externalOrderId,
              trackingId: request.trackingNumber,
              dispatchDate: (request.shipmentDate || new Date()).toISOString(),
            },
          ],
        };

        const dispatchResponse = await this.client.post<{ status: string }>(
          '/v2/shipments/dispatch',
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
      const data = payload as { orderItems?: FlipkartOrder[] };
      if (!data.orderItems?.length) return null;
      const orders = this.groupOrderItems(data.orderItems);
      return orders[0] || null;
    } catch {
      return null;
    }
  }
}

// Factory function
export function createFlipkartIntegration(credentials: ChannelCredentials): FlipkartIntegration {
  return new FlipkartIntegration(credentials);
}
