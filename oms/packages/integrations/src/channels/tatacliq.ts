/**
 * Tata Cliq Seller Integration
 *
 * Tata Cliq is a premium e-commerce platform by Tata Group.
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

interface TataCliqOrderLine {
  lineId: string;
  orderId: string;
  orderDate: string;
  lineStatus: string;
  sellerSku: string;
  tatacliqSku: string;
  productTitle: string;
  brand: string;
  size?: string;
  color?: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  discountValue: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  paymentMode: 'PREPAID' | 'COD';
  fulfillmentType: 'TATACLIQ_FULFILLED' | 'SELLER_FULFILLED';
  promisedDeliveryDate: string;
  cutOffTime: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
}

interface TataCliqOrdersResponse {
  status: 'SUCCESS' | 'ERROR';
  message?: string;
  data: {
    orderLines: TataCliqOrderLine[];
    paging: {
      totalRecords: number;
      pageNumber: number;
      pageSize: number;
      totalPages: number;
    };
  };
}

export class TataCliqIntegration implements IChannelIntegration {
  name = 'Tata Cliq';
  code = 'TATA_CLIQ';

  private client: HttpClient;
  private credentials: ChannelCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private circuitBreaker = createCircuitBreaker({ name: 'tatacliq' });
  private rateLimiter = createRateLimiter({
    name: 'tatacliq',
    ...MarketplaceRateLimits.TATA_CLIQ,
  });

  constructor(credentials: ChannelCredentials) {
    this.credentials = credentials;
    this.client = createHttpClient({
      baseURL: 'https://seller-api.tatacliq.com',
      timeout: 30000,
    });
  }

  async authenticate(): Promise<boolean> {
    return this.circuitBreaker.execute(async () => {
      await this.rateLimiter.acquire();

      try {
        const response = await this.client.post<{
          status: string;
          data: {
            accessToken: string;
            tokenType: string;
            expiresIn: number;
          };
        }>(
          '/oauth/v1/token',
          {
            clientId: this.credentials.apiKey,
            clientSecret: this.credentials.apiSecret,
            grantType: 'client_credentials',
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
        throw new Error('Tata Cliq authentication failed');
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
          params.append('lineStatus', request.status.join(','));
        } else {
          params.append('lineStatus', 'CREATED,CONFIRMED,PACKED');
        }

        if (request.fromDate) {
          params.append('fromDate', request.fromDate.toISOString().split('T')[0]);
        }
        if (request.toDate) {
          params.append('toDate', request.toDate.toISOString().split('T')[0]);
        }
        params.append('pageSize', (request.limit || 50).toString());
        if (request.cursor) {
          params.append('pageNumber', request.cursor);
        }

        const response = await this.client.get<TataCliqOrdersResponse>(
          `/seller/v1/orders?${params.toString()}`
        );

        if (response.success && response.data?.data?.orderLines) {
          const orders = this.transformOrders(response.data.data.orderLines);
          const paging = response.data.data.paging;
          return {
            success: true,
            orders,
            totalCount: paging.totalRecords,
            hasMore: paging.pageNumber < paging.totalPages,
            nextCursor: paging.pageNumber < paging.totalPages
              ? (paging.pageNumber + 1).toString()
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

  private transformOrders(orderLines: TataCliqOrderLine[]): ChannelOrder[] {
    const orderMap = new Map<string, TataCliqOrderLine[]>();

    for (const line of orderLines) {
      const existing = orderMap.get(line.orderId) || [];
      existing.push(line);
      orderMap.set(line.orderId, existing);
    }

    const orders: ChannelOrder[] = [];

    for (const [orderId, lines] of orderMap) {
      const firstLine = lines[0];
      const isCOD = firstLine.paymentMode === 'COD';

      const subtotal = lines.reduce((sum, l) => sum + l.taxableAmount, 0);
      const taxAmount = lines.reduce((sum, l) => sum + l.gstAmount, 0);
      const discount = lines.reduce((sum, l) => sum + l.discountValue, 0);
      const total = lines.reduce((sum, l) => sum + l.totalAmount, 0);

      const addr = firstLine.shippingAddress;
      const fullName = [addr?.firstName, addr?.lastName].filter(Boolean).join(' ');

      orders.push({
        externalOrderId: orderId,
        externalOrderNo: orderId,
        channel: 'TATA_CLIQ',
        orderDate: new Date(firstLine.orderDate),
        paymentMode: isCOD ? 'COD' : 'PREPAID',

        customerName: fullName,
        customerPhone: addr?.phone || '',
        customerEmail: addr?.email,

        shippingAddress: {
          name: fullName,
          phone: addr?.phone || '',
          email: addr?.email,
          addressLine1: addr?.addressLine1 || '',
          addressLine2: [addr?.addressLine2, addr?.landmark]
            .filter(Boolean)
            .join(', ') || undefined,
          city: addr?.city || '',
          state: addr?.state || '',
          pincode: addr?.pincode || '',
          country: 'India',
        },

        items: lines.map((line) => ({
          externalItemId: line.lineId,
          skuCode: line.sellerSku,
          name: [line.brand, line.productTitle, line.size, line.color]
            .filter(Boolean)
            .join(' - '),
          quantity: line.quantity,
          unitPrice: line.sellingPrice,
          taxAmount: line.gstAmount,
          discount: line.discountValue,
          totalPrice: line.totalAmount,
        })),

        subtotal,
        taxAmount,
        shippingCharges: 0,
        discount,
        totalAmount: total,

        status: firstLine.lineStatus,
        fulfillmentStatus: firstLine.lineStatus,
        paymentStatus: isCOD ? 'pending' : 'paid',

        rawData: lines,
      });
    }

    return orders;
  }

  async updateOrderStatus(request: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResponse> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.ensureAuthenticated();
        await this.rateLimiter.acquire();

        // Confirm order line
        if (request.status === 'CONFIRMED') {
          const confirmResponse = await this.client.post<{ status: string }>(
            '/seller/v1/orders/confirm',
            { lineIds: [request.externalOrderId] }
          );

          if (confirmResponse.data?.status !== 'SUCCESS') {
            return {
              success: false,
              error: confirmResponse.error || 'Failed to confirm order',
            };
          }
        }

        // Pack order line
        if (request.status === 'PACKED') {
          const packPayload = {
            lineId: request.externalOrderId,
            invoiceNumber: request.fulfillmentId,
            invoiceDate: new Date().toISOString().split('T')[0],
          };

          const packResponse = await this.client.post<{ status: string }>(
            '/seller/v1/orders/pack',
            packPayload
          );

          if (packResponse.data?.status !== 'SUCCESS') {
            return {
              success: false,
              error: packResponse.error || 'Failed to pack order',
            };
          }
        }

        // Dispatch with AWB
        if (request.trackingNumber) {
          const dispatchPayload = {
            lineId: request.externalOrderId,
            awbNumber: request.trackingNumber,
            courierPartner: request.carrierName || 'Self-Ship',
            dispatchDate: (request.shipmentDate || new Date()).toISOString().split('T')[0],
          };

          const dispatchResponse = await this.client.post<{ status: string }>(
            '/seller/v1/orders/dispatch',
            dispatchPayload
          );

          if (dispatchResponse.data?.status === 'SUCCESS') {
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
          inventoryUpdates: [
            {
              sellerSku: request.skuCode,
              quantity: request.quantity,
              warehouseCode: request.locationId,
            },
          ],
        };

        const response = await this.client.post<{ status: string }>(
          '/seller/v1/inventory/update',
          payload
        );

        return {
          success: response.data?.status === 'SUCCESS',
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
      const data = payload as { orderLines?: TataCliqOrderLine[] };
      if (!data.orderLines?.length) return null;
      const orders = this.transformOrders(data.orderLines);
      return orders[0] || null;
    } catch {
      return null;
    }
  }
}

export function createTataCliqIntegration(credentials: ChannelCredentials): TataCliqIntegration {
  return new TataCliqIntegration(credentials);
}
