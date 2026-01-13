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

// Amazon SP-API specific types
interface AmazonCredentials extends ChannelCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  roleArn?: string;
  region?: string;
  marketplaceId: string;
  sellerId: string;
}

interface AmazonOrderItem {
  ASIN: string;
  SellerSKU: string;
  OrderItemId: string;
  Title: string;
  QuantityOrdered: number;
  QuantityShipped: number;
  ItemPrice?: { Amount: string; CurrencyCode: string };
  ItemTax?: { Amount: string; CurrencyCode: string };
  PromotionDiscount?: { Amount: string; CurrencyCode: string };
  ShippingPrice?: { Amount: string; CurrencyCode: string };
  ShippingTax?: { Amount: string; CurrencyCode: string };
}

interface AmazonOrder {
  AmazonOrderId: string;
  SellerOrderId?: string;
  PurchaseDate: string;
  LastUpdateDate: string;
  OrderStatus: string;
  FulfillmentChannel: string;
  SalesChannel: string;
  PaymentMethod: string;
  PaymentMethodDetails?: string[];
  MarketplaceId: string;
  BuyerInfo?: {
    BuyerEmail?: string;
    BuyerName?: string;
  };
  ShippingAddress?: {
    Name: string;
    AddressLine1?: string;
    AddressLine2?: string;
    City?: string;
    StateOrRegion?: string;
    PostalCode?: string;
    CountryCode?: string;
    Phone?: string;
  };
  OrderTotal?: {
    Amount: string;
    CurrencyCode: string;
  };
  NumberOfItemsShipped: number;
  NumberOfItemsUnshipped: number;
  IsBusinessOrder: boolean;
  IsPrime: boolean;
  EarliestShipDate?: string;
  LatestShipDate?: string;
}

interface AmazonCatalogItem {
  asin: string;
  attributes?: {
    item_name?: { value: string }[];
    brand?: { value: string }[];
    item_package_weight?: { value: number; unit: string }[];
  };
  identifiers?: {
    identifiers: { identifier: string; identifierType: string }[];
  }[];
  images?: {
    images: { link: string; variant: string }[];
  }[];
  salesRanks?: { rank: number; displayGroupRanks: { displayGroup: string; rank: number }[] }[];
}

// Amazon SP-API Endpoints
const AMAZON_ENDPOINTS: Record<string, { region: string; endpoint: string }> = {
  'A21TJRUUN4KGV': { region: 'eu-west-1', endpoint: 'sellingpartnerapi-eu.amazon.com' }, // India
  'A2EUQ1WTGCTBG2': { region: 'eu-west-1', endpoint: 'sellingpartnerapi-eu.amazon.com' }, // Canada
  'ATVPDKIKX0DER': { region: 'us-east-1', endpoint: 'sellingpartnerapi-na.amazon.com' }, // US
  'A1F83G8C2ARO7P': { region: 'eu-west-1', endpoint: 'sellingpartnerapi-eu.amazon.com' }, // UK
};

export class AmazonIntegration implements IChannelIntegration {
  name = 'Amazon';
  code = 'AMAZON';

  private client: HttpClient;
  private credentials: AmazonCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(credentials: ChannelCredentials) {
    this.credentials = credentials as AmazonCredentials;

    const marketplaceConfig = AMAZON_ENDPOINTS[this.credentials.marketplaceId] ||
      AMAZON_ENDPOINTS['A21TJRUUN4KGV']; // Default to India

    this.client = createHttpClient({
      baseURL: `https://${marketplaceConfig.endpoint}`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-amz-access-token': '',
      },
    });
  }

  async authenticate(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return this.accessToken !== null;
    } catch (error) {
      console.error('Amazon authentication failed:', error);
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    return this.authenticate();
  }

  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Request new token from LWA (Login with Amazon)
    const lwaClient = createHttpClient({
      baseURL: 'https://api.amazon.com',
      timeout: 10000,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const tokenResponse = await lwaClient.post<{
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token?: string;
    }>('/auth/o2/token', new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.credentials.refreshToken,
      client_id: this.credentials.clientId,
      client_secret: this.credentials.clientSecret,
    }).toString());

    if (!tokenResponse.success || !tokenResponse.data?.access_token) {
      throw new Error('Failed to obtain access token from Amazon');
    }

    this.accessToken = tokenResponse.data.access_token;
    this.tokenExpiry = new Date(Date.now() + (tokenResponse.data.expires_in - 60) * 1000);

    // Update client headers
    this.client = createHttpClient({
      baseURL: this.client.baseURL || `https://${AMAZON_ENDPOINTS['A21TJRUUN4KGV'].endpoint}`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-amz-access-token': this.accessToken,
      },
    });

    return this.accessToken;
  }

  async pullOrders(request: PullOrdersRequest): Promise<PullOrdersResponse> {
    try {
      await this.getAccessToken();

      const params = new URLSearchParams();
      params.append('MarketplaceIds', this.credentials.marketplaceId);

      if (request.fromDate) {
        params.append('CreatedAfter', request.fromDate.toISOString());
      }
      if (request.toDate) {
        params.append('CreatedBefore', request.toDate.toISOString());
      }
      if (request.status && request.status.length > 0) {
        params.append('OrderStatuses', request.status.join(','));
      }
      if (request.cursor) {
        params.append('NextToken', request.cursor);
      }

      const response = await this.client.get<{
        payload: {
          Orders: AmazonOrder[];
          NextToken?: string;
        };
      }>(`/orders/v0/orders?${params.toString()}`);

      if (!response.success || !response.data?.payload?.Orders) {
        return {
          success: false,
          error: response.error || 'Failed to fetch orders from Amazon',
        };
      }

      // Fetch order items for each order
      const ordersWithItems: ChannelOrder[] = [];

      for (const order of response.data.payload.Orders) {
        const itemsResponse = await this.client.get<{
          payload: { OrderItems: AmazonOrderItem[] };
        }>(`/orders/v0/orders/${order.AmazonOrderId}/orderItems`);

        const items = itemsResponse.data?.payload?.OrderItems || [];
        ordersWithItems.push(this.mapOrder(order, items));
      }

      return {
        success: true,
        orders: ordersWithItems,
        totalCount: ordersWithItems.length,
        hasMore: !!response.data.payload.NextToken,
        nextCursor: response.data.payload.NextToken,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private mapOrder(order: AmazonOrder, items: AmazonOrderItem[]): ChannelOrder {
    const isCOD = order.PaymentMethod === 'COD' ||
      order.PaymentMethodDetails?.some(m => m.toLowerCase().includes('cod'));

    const subtotal = items.reduce((sum, item) =>
      sum + parseFloat(item.ItemPrice?.Amount || '0'), 0);
    const taxAmount = items.reduce((sum, item) =>
      sum + parseFloat(item.ItemTax?.Amount || '0'), 0);
    const discount = items.reduce((sum, item) =>
      sum + parseFloat(item.PromotionDiscount?.Amount || '0'), 0);
    const shippingCharges = items.reduce((sum, item) =>
      sum + parseFloat(item.ShippingPrice?.Amount || '0'), 0);

    return {
      externalOrderId: order.AmazonOrderId,
      externalOrderNo: order.AmazonOrderId,
      channel: 'AMAZON',
      orderDate: new Date(order.PurchaseDate),
      paymentMode: isCOD ? 'COD' : 'PREPAID',

      customerName: order.BuyerInfo?.BuyerName || order.ShippingAddress?.Name || 'Amazon Customer',
      customerPhone: order.ShippingAddress?.Phone || '',
      customerEmail: order.BuyerInfo?.BuyerEmail,

      shippingAddress: {
        name: order.ShippingAddress?.Name || '',
        phone: order.ShippingAddress?.Phone || '',
        addressLine1: order.ShippingAddress?.AddressLine1 || '',
        addressLine2: order.ShippingAddress?.AddressLine2,
        city: order.ShippingAddress?.City || '',
        state: order.ShippingAddress?.StateOrRegion || '',
        pincode: order.ShippingAddress?.PostalCode || '',
        country: order.ShippingAddress?.CountryCode || 'IN',
      },

      items: items.map((item) => ({
        externalItemId: item.OrderItemId,
        skuCode: item.SellerSKU || item.ASIN,
        name: item.Title,
        quantity: item.QuantityOrdered,
        unitPrice: parseFloat(item.ItemPrice?.Amount || '0') / item.QuantityOrdered,
        taxAmount: parseFloat(item.ItemTax?.Amount || '0'),
        discount: parseFloat(item.PromotionDiscount?.Amount || '0'),
        totalPrice: parseFloat(item.ItemPrice?.Amount || '0'),
      })),

      subtotal,
      taxAmount,
      shippingCharges,
      discount,
      totalAmount: parseFloat(order.OrderTotal?.Amount || '0'),

      status: order.OrderStatus,
      fulfillmentStatus: order.NumberOfItemsUnshipped > 0 ? 'unfulfilled' : 'fulfilled',
      paymentStatus: isCOD ? 'pending' : 'paid',

      tags: [
        order.IsPrime ? 'prime' : null,
        order.IsBusinessOrder ? 'b2b' : null,
        order.FulfillmentChannel,
      ].filter(Boolean) as string[],

      rawData: order,
    };
  }

  async updateOrderStatus(request: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResponse> {
    try {
      await this.getAccessToken();

      // For Amazon, we need to confirm shipment via Feeds API
      const feedContent = this.generateShipmentFeed(request);

      const feedResponse = await this.client.post<{
        payload: { feedId: string };
      }>('/feeds/2021-06-30/feeds', {
        feedType: 'POST_ORDER_FULFILLMENT_DATA',
        marketplaceIds: [this.credentials.marketplaceId],
        inputFeedDocumentId: await this.uploadFeedDocument(feedContent),
      });

      if (!feedResponse.success || !feedResponse.data?.payload?.feedId) {
        return {
          success: false,
          error: feedResponse.error || 'Failed to submit shipment feed',
        };
      }

      return {
        success: true,
        fulfillmentId: feedResponse.data.payload.feedId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private generateShipmentFeed(request: UpdateOrderStatusRequest): string {
    // Generate XML feed for shipment confirmation
    const shipDate = (request.shipmentDate || new Date()).toISOString().split('T')[0];

    return `<?xml version="1.0" encoding="UTF-8"?>
<AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">
  <Header>
    <DocumentVersion>1.01</DocumentVersion>
    <MerchantIdentifier>${this.credentials.sellerId}</MerchantIdentifier>
  </Header>
  <MessageType>OrderFulfillment</MessageType>
  <Message>
    <MessageID>1</MessageID>
    <OrderFulfillment>
      <AmazonOrderID>${request.externalOrderId}</AmazonOrderID>
      <FulfillmentDate>${shipDate}</FulfillmentDate>
      <FulfillmentData>
        <CarrierName>${request.carrierName || 'Other'}</CarrierName>
        <ShippingMethod>Standard</ShippingMethod>
        <ShipperTrackingNumber>${request.trackingNumber || ''}</ShipperTrackingNumber>
      </FulfillmentData>
    </OrderFulfillment>
  </Message>
</AmazonEnvelope>`;
  }

  private async uploadFeedDocument(content: string): Promise<string> {
    // Create feed document
    const createDocResponse = await this.client.post<{
      payload: {
        feedDocumentId: string;
        url: string;
      };
    }>('/feeds/2021-06-30/documents', {
      contentType: 'text/xml; charset=UTF-8',
    });

    if (!createDocResponse.success || !createDocResponse.data?.payload) {
      throw new Error('Failed to create feed document');
    }

    // Upload content to the presigned URL
    const uploadClient = createHttpClient({
      baseURL: '',
      timeout: 30000,
    });

    await uploadClient.put(createDocResponse.data.payload.url, content, {
      headers: { 'Content-Type': 'text/xml; charset=UTF-8' },
    });

    return createDocResponse.data.payload.feedDocumentId;
  }

  async updateInventory(request: InventoryUpdateRequest): Promise<InventoryUpdateResponse> {
    try {
      await this.getAccessToken();

      // Generate inventory feed
      const feedContent = `<?xml version="1.0" encoding="UTF-8"?>
<AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">
  <Header>
    <DocumentVersion>1.01</DocumentVersion>
    <MerchantIdentifier>${this.credentials.sellerId}</MerchantIdentifier>
  </Header>
  <MessageType>Inventory</MessageType>
  <Message>
    <MessageID>1</MessageID>
    <Inventory>
      <SKU>${request.skuCode}</SKU>
      <Quantity>${request.quantity}</Quantity>
    </Inventory>
  </Message>
</AmazonEnvelope>`;

      const feedResponse = await this.client.post<{
        payload: { feedId: string };
      }>('/feeds/2021-06-30/feeds', {
        feedType: 'POST_INVENTORY_AVAILABILITY_DATA',
        marketplaceIds: [this.credentials.marketplaceId],
        inputFeedDocumentId: await this.uploadFeedDocument(feedContent),
      });

      if (!feedResponse.success || !feedResponse.data?.payload?.feedId) {
        return {
          success: false,
          error: feedResponse.error || 'Failed to submit inventory feed',
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

  async getProducts(
    limit: number = 50,
    cursor?: string
  ): Promise<{ success: boolean; products?: ProductInfo[]; nextCursor?: string; error?: string }> {
    try {
      await this.getAccessToken();

      // Use Catalog Items API
      const params = new URLSearchParams({
        marketplaceIds: this.credentials.marketplaceId,
        sellerId: this.credentials.sellerId,
        includedData: 'attributes,identifiers,images',
        pageSize: limit.toString(),
      });

      if (cursor) {
        params.append('pageToken', cursor);
      }

      const response = await this.client.get<{
        items: AmazonCatalogItem[];
        pagination?: { nextToken?: string };
      }>(`/catalog/2022-04-01/items?${params.toString()}`);

      if (!response.success || !response.data?.items) {
        return {
          success: false,
          error: response.error || 'Failed to fetch products',
        };
      }

      const products: ProductInfo[] = response.data.items.map((item) => ({
        externalId: item.asin,
        sku: item.identifiers?.[0]?.identifiers?.[0]?.identifier || item.asin,
        name: item.attributes?.item_name?.[0]?.value || item.asin,
        description: item.attributes?.brand?.[0]?.value,
        price: 0, // Price not available in catalog API
        weight: item.attributes?.item_package_weight?.[0]?.value,
        images: item.images?.flatMap(i => i.images?.map(img => img.link) || []),
      }));

      return {
        success: true,
        products,
        nextCursor: response.data.pagination?.nextToken,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  verifyWebhook(payload: string, signature: string): boolean {
    // Amazon uses different signature mechanism for notifications
    // This is a placeholder - actual implementation depends on notification type
    if (!this.credentials.clientSecret) {
      return false;
    }

    const hmac = crypto
      .createHmac('sha256', this.credentials.clientSecret)
      .update(payload)
      .digest('base64');

    return hmac === signature;
  }

  parseWebhookOrder(payload: unknown): ChannelOrder | null {
    try {
      const notification = payload as {
        NotificationType: string;
        Payload: {
          OrderChangeNotification?: {
            AmazonOrderId: string;
            OrderChangeType: string;
            Summary: AmazonOrder;
          };
        };
      };

      if (notification.Payload?.OrderChangeNotification?.Summary) {
        const order = notification.Payload.OrderChangeNotification.Summary;
        return this.mapOrder(order, []);
      }

      return null;
    } catch {
      return null;
    }
  }
}

// Factory function
export function createAmazonIntegration(credentials: ChannelCredentials): AmazonIntegration {
  return new AmazonIntegration(credentials);
}
