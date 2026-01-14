import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createChannelIntegration,
  ShopifyIntegration,
  FlipkartIntegration,
  AmazonIntegration,
  MyntraIntegration,
  AjioIntegration,
  MeeshoIntegration,
  NykaaIntegration,
  TataCliqIntegration,
  JioMartIntegration,
  type ChannelCredentials,
  type ChannelOrder,
  type PullOrdersRequest,
} from '../channels';

// Mock the http-client module
vi.mock('../http-client', () => ({
  createHttpClient: vi.fn(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    setHeader: vi.fn(),
    removeHeader: vi.fn(),
    baseURL: 'https://test.myshopify.com/admin/api/2024-01',
  })),
  HttpClient: vi.fn(),
}));

describe('Channel Integrations', () => {
  const mockCredentials: ChannelCredentials = {
    apiKey: 'test-api-key',
    apiSecret: 'test-api-secret',
    accessToken: 'test-access-token',
    shopDomain: 'test.myshopify.com',
    sellerId: 'test-seller-id',
    marketplaceId: 'test-marketplace-id',
  };

  describe('createChannelIntegration factory', () => {
    it('should create Shopify integration', () => {
      const integration = createChannelIntegration('SHOPIFY', mockCredentials);
      expect(integration).toBeInstanceOf(ShopifyIntegration);
      expect(integration.name).toBe('Shopify');
      expect(integration.code).toBe('SHOPIFY');
    });

    it('should create Flipkart integration', () => {
      const integration = createChannelIntegration('FLIPKART', mockCredentials);
      expect(integration).toBeInstanceOf(FlipkartIntegration);
      expect(integration.name).toBe('Flipkart');
      expect(integration.code).toBe('FLIPKART');
    });

    it('should create Amazon integration', () => {
      const integration = createChannelIntegration('AMAZON', mockCredentials);
      expect(integration).toBeInstanceOf(AmazonIntegration);
      expect(integration.name).toBe('Amazon');
      expect(integration.code).toBe('AMAZON');
    });

    it('should create Myntra integration', () => {
      const integration = createChannelIntegration('MYNTRA', mockCredentials);
      expect(integration).toBeInstanceOf(MyntraIntegration);
      expect(integration.name).toBe('Myntra');
      expect(integration.code).toBe('MYNTRA');
    });

    it('should create AJIO integration', () => {
      const integration = createChannelIntegration('AJIO', mockCredentials);
      expect(integration).toBeInstanceOf(AjioIntegration);
      expect(integration.name).toBe('AJIO');
      expect(integration.code).toBe('AJIO');
    });

    it('should create Meesho integration', () => {
      const integration = createChannelIntegration('MEESHO', mockCredentials);
      expect(integration).toBeInstanceOf(MeeshoIntegration);
      expect(integration.name).toBe('Meesho');
      expect(integration.code).toBe('MEESHO');
    });

    it('should create Nykaa integration', () => {
      const integration = createChannelIntegration('NYKAA', mockCredentials);
      expect(integration).toBeInstanceOf(NykaaIntegration);
      expect(integration.name).toBe('Nykaa');
      expect(integration.code).toBe('NYKAA');
    });

    it('should create Tata Cliq integration', () => {
      const integration = createChannelIntegration('TATA_CLIQ', mockCredentials);
      expect(integration).toBeInstanceOf(TataCliqIntegration);
      expect(integration.name).toBe('Tata Cliq');
      expect(integration.code).toBe('TATA_CLIQ');
    });

    it('should create JioMart integration', () => {
      const integration = createChannelIntegration('JIOMART', mockCredentials);
      expect(integration).toBeInstanceOf(JioMartIntegration);
      expect(integration.name).toBe('JioMart');
      expect(integration.code).toBe('JIOMART');
    });

    it('should throw error for WooCommerce (not implemented)', () => {
      expect(() => createChannelIntegration('WOOCOMMERCE', mockCredentials)).toThrow(
        'WooCommerce integration not yet implemented'
      );
    });

    it('should throw error for unknown channel', () => {
      expect(() =>
        createChannelIntegration('UNKNOWN' as never, mockCredentials)
      ).toThrow('Unknown channel code');
    });
  });

  describe('ShopifyIntegration', () => {
    let integration: ShopifyIntegration;
    let mockClient: {
      get: ReturnType<typeof vi.fn>;
      post: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
      vi.clearAllMocks();
      const { createHttpClient } = await import('../http-client');
      mockClient = {
        get: vi.fn(),
        post: vi.fn(),
      };
      (createHttpClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);
      integration = new ShopifyIntegration(mockCredentials);
    });

    describe('authenticate', () => {
      it('should return true on successful authentication', async () => {
        mockClient.get.mockResolvedValue({
          success: true,
          data: { shop: { id: 12345 } },
        });

        const result = await integration.authenticate();
        expect(result).toBe(true);
        expect(mockClient.get).toHaveBeenCalledWith('/shop.json');
      });

      it('should return false on failed authentication', async () => {
        mockClient.get.mockResolvedValue({
          success: false,
          error: 'Unauthorized',
        });

        const result = await integration.authenticate();
        expect(result).toBe(false);
      });

      it('should return false on exception', async () => {
        mockClient.get.mockRejectedValue(new Error('Network error'));

        const result = await integration.authenticate();
        expect(result).toBe(false);
      });
    });

    describe('pullOrders', () => {
      const mockShopifyOrders = {
        orders: [
          {
            id: 12345,
            name: '#1001',
            email: 'customer@example.com',
            phone: '+919876543210',
            created_at: '2024-01-15T10:00:00Z',
            financial_status: 'paid',
            fulfillment_status: null,
            total_price: '1500.00',
            subtotal_price: '1400.00',
            total_tax: '50.00',
            total_discounts: '100.00',
            total_shipping_price_set: {
              shop_money: { amount: '50.00' },
            },
            line_items: [
              {
                id: 1,
                sku: 'SKU001',
                name: 'Test Product',
                quantity: 2,
                price: '700.00',
                total_discount: '50.00',
                tax_lines: [{ price: '25.00' }],
              },
            ],
            shipping_address: {
              name: 'John Doe',
              address1: '123 Main St',
              address2: 'Apt 4',
              city: 'Mumbai',
              province: 'Maharashtra',
              zip: '400001',
              country: 'India',
              phone: '+919876543210',
            },
            billing_address: null,
            customer: {
              id: 1,
              email: 'customer@example.com',
              first_name: 'John',
              last_name: 'Doe',
              phone: '+919876543210',
            },
            gateway: 'razorpay',
            tags: 'vip,express',
            note: 'Please deliver before 5 PM',
          },
        ],
      };

      it('should pull orders successfully', async () => {
        mockClient.get.mockResolvedValue({
          success: true,
          data: mockShopifyOrders,
        });

        const request: PullOrdersRequest = {
          fromDate: new Date('2024-01-01'),
          toDate: new Date('2024-01-31'),
          limit: 50,
        };

        const result = await integration.pullOrders(request);

        expect(result.success).toBe(true);
        expect(result.orders).toHaveLength(1);
        expect(result.orders![0].externalOrderId).toBe('12345');
        expect(result.orders![0].externalOrderNo).toBe('#1001');
        expect(result.orders![0].channel).toBe('SHOPIFY');
        expect(result.orders![0].paymentMode).toBe('PREPAID');
        expect(result.orders![0].customerName).toBe('John Doe');
      });

      it('should detect COD orders from gateway', async () => {
        const codOrders = {
          orders: [
            {
              ...mockShopifyOrders.orders[0],
              gateway: 'cash_on_delivery',
            },
          ],
        };

        mockClient.get.mockResolvedValue({
          success: true,
          data: codOrders,
        });

        const result = await integration.pullOrders({});
        expect(result.orders![0].paymentMode).toBe('COD');
      });

      it('should detect COD orders from tags', async () => {
        const codOrders = {
          orders: [
            {
              ...mockShopifyOrders.orders[0],
              gateway: 'other',
              tags: 'cod,priority',
            },
          ],
        };

        mockClient.get.mockResolvedValue({
          success: true,
          data: codOrders,
        });

        const result = await integration.pullOrders({});
        expect(result.orders![0].paymentMode).toBe('COD');
      });

      it('should handle empty orders response', async () => {
        mockClient.get.mockResolvedValue({
          success: true,
          data: { orders: [] },
        });

        const result = await integration.pullOrders({});
        expect(result.success).toBe(true);
        expect(result.orders).toHaveLength(0);
      });

      it('should handle API errors', async () => {
        mockClient.get.mockResolvedValue({
          success: false,
          error: 'API rate limit exceeded',
        });

        const result = await integration.pullOrders({});
        expect(result.success).toBe(false);
        expect(result.error).toBe('API rate limit exceeded');
      });

      it('should handle exceptions', async () => {
        mockClient.get.mockRejectedValue(new Error('Network timeout'));

        const result = await integration.pullOrders({});
        expect(result.success).toBe(false);
        expect(result.error).toBe('Network timeout');
      });

      it('should build query params correctly', async () => {
        mockClient.get.mockResolvedValue({
          success: true,
          data: { orders: [] },
        });

        const request: PullOrdersRequest = {
          fromDate: new Date('2024-01-01T00:00:00Z'),
          toDate: new Date('2024-01-31T23:59:59Z'),
          status: ['open', 'closed'],
          limit: 25,
          cursor: 'page_abc123',
        };

        await integration.pullOrders(request);

        const callUrl = mockClient.get.mock.calls[0][0];
        expect(callUrl).toContain('created_at_min=');
        expect(callUrl).toContain('created_at_max=');
        expect(callUrl).toContain('status=open%2Cclosed');
        expect(callUrl).toContain('limit=25');
        expect(callUrl).toContain('page_info=page_abc123');
      });
    });

    describe('updateOrderStatus', () => {
      it('should update order status successfully', async () => {
        mockClient.post.mockResolvedValue({
          success: true,
          data: {
            fulfillment: {
              id: 98765,
              status: 'success',
            },
          },
        });

        const result = await integration.updateOrderStatus({
          externalOrderId: '12345',
          status: 'shipped',
          trackingNumber: 'TRACK123',
          trackingUrl: 'https://track.example.com/TRACK123',
          carrierName: 'Delhivery',
        });

        expect(result.success).toBe(true);
        expect(result.fulfillmentId).toBe('98765');
        expect(mockClient.post).toHaveBeenCalledWith(
          '/orders/12345/fulfillments.json',
          expect.objectContaining({
            fulfillment: expect.objectContaining({
              tracking_number: 'TRACK123',
              tracking_company: 'Delhivery',
            }),
          })
        );
      });

      it('should handle update failure', async () => {
        mockClient.post.mockResolvedValue({
          success: false,
          error: 'Order already fulfilled',
        });

        const result = await integration.updateOrderStatus({
          externalOrderId: '12345',
          status: 'shipped',
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Order already fulfilled');
      });

      it('should handle exceptions', async () => {
        mockClient.post.mockRejectedValue(new Error('Server error'));

        const result = await integration.updateOrderStatus({
          externalOrderId: '12345',
          status: 'shipped',
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Server error');
      });
    });

    describe('verifyWebhook', () => {
      it('should verify valid webhook signature', () => {
        const payload = '{"id":12345}';
        // Pre-computed HMAC for the payload with secret 'test-api-secret'
        const crypto = require('crypto');
        const expectedSignature = crypto
          .createHmac('sha256', 'test-api-secret')
          .update(payload, 'utf8')
          .digest('base64');

        const result = integration.verifyWebhook(payload, expectedSignature);
        expect(result).toBe(true);
      });

      it('should reject invalid webhook signature', () => {
        const payload = '{"id":12345}';
        const invalidSignature = 'invalid-signature';

        const result = integration.verifyWebhook(payload, invalidSignature);
        expect(result).toBe(false);
      });

      it('should return false if no API secret', () => {
        const integrationNoSecret = new ShopifyIntegration({
          ...mockCredentials,
          apiSecret: undefined,
        });

        const result = integrationNoSecret.verifyWebhook('{}', 'signature');
        expect(result).toBe(false);
      });
    });

    describe('parseWebhookOrder', () => {
      it('should parse valid webhook order', () => {
        const webhookPayload = {
          id: 12345,
          name: '#1001',
          email: 'test@example.com',
          phone: '+919876543210',
          created_at: '2024-01-15T10:00:00Z',
          financial_status: 'paid',
          fulfillment_status: null,
          total_price: '1000.00',
          subtotal_price: '900.00',
          total_tax: '50.00',
          total_discounts: '0',
          total_shipping_price_set: { shop_money: { amount: '50.00' } },
          line_items: [],
          shipping_address: {
            name: 'Test',
            address1: 'Address',
            city: 'City',
            province: 'State',
            zip: '123456',
            country: 'India',
            phone: '+919876543210',
          },
          customer: { first_name: 'Test', last_name: 'User' },
          gateway: 'razorpay',
          tags: '',
          note: null,
        };

        const result = integration.parseWebhookOrder(webhookPayload);
        expect(result).not.toBeNull();
        expect(result?.externalOrderId).toBe('12345');
      });

      it('should return null for invalid payload', () => {
        const result = integration.parseWebhookOrder({});
        expect(result).toBeNull();
      });

      it('should return null on parse error', () => {
        const result = integration.parseWebhookOrder(null);
        expect(result).toBeNull();
      });
    });
  });

  describe('Integration Interface Compliance', () => {
    const integrations = [
      { code: 'SHOPIFY' as const, name: 'Shopify' },
      { code: 'FLIPKART' as const, name: 'Flipkart' },
      { code: 'AMAZON' as const, name: 'Amazon' },
      { code: 'MYNTRA' as const, name: 'Myntra' },
      { code: 'AJIO' as const, name: 'AJIO' },
      { code: 'MEESHO' as const, name: 'Meesho' },
      { code: 'NYKAA' as const, name: 'Nykaa' },
      { code: 'TATA_CLIQ' as const, name: 'Tata Cliq' },
      { code: 'JIOMART' as const, name: 'JioMart' },
    ];

    integrations.forEach(({ code, name }) => {
      describe(`${name} Integration`, () => {
        it('should implement IChannelIntegration interface', () => {
          const integration = createChannelIntegration(code, mockCredentials);

          // Required properties
          expect(integration.name).toBe(name);
          expect(integration.code).toBe(code);

          // Required methods
          expect(typeof integration.authenticate).toBe('function');
          expect(typeof integration.pullOrders).toBe('function');
          expect(typeof integration.updateOrderStatus).toBe('function');
        });

        it('should have authenticate method that returns Promise<boolean>', async () => {
          const integration = createChannelIntegration(code, mockCredentials);
          const result = integration.authenticate();
          expect(result).toBeInstanceOf(Promise);
        });

        it('should have pullOrders method that returns Promise<PullOrdersResponse>', async () => {
          const integration = createChannelIntegration(code, mockCredentials);
          const result = integration.pullOrders({});
          expect(result).toBeInstanceOf(Promise);
        });

        it('should have updateOrderStatus method that returns Promise<UpdateOrderStatusResponse>', async () => {
          const integration = createChannelIntegration(code, mockCredentials);
          const result = integration.updateOrderStatus({
            externalOrderId: 'test',
            status: 'shipped',
          });
          expect(result).toBeInstanceOf(Promise);
        });
      });
    });
  });
});
