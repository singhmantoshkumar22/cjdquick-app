import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTransporterIntegration,
  DelhiveryIntegration,
  ShiprocketIntegration,
  BlueDartIntegration,
  EkartIntegration,
  ShadowfaxIntegration,
  DTDCIntegration,
  EcomExpressIntegration,
  XpressbeesIntegration,
  type TransporterCredentials,
  type CreateShipmentRequest,
  type CancelShipmentRequest,
  type RateCalculationRequest,
} from '../transporters';

// Mock the http-client module
vi.mock('../http-client', () => ({
  createHttpClient: vi.fn(() => ({
    get: vi.fn().mockResolvedValue({ success: false }),
    post: vi.fn().mockResolvedValue({ success: false }),
    put: vi.fn().mockResolvedValue({ success: false }),
    patch: vi.fn().mockResolvedValue({ success: false }),
    delete: vi.fn().mockResolvedValue({ success: false }),
    setHeader: vi.fn(),
    removeHeader: vi.fn(),
    baseURL: 'https://api.test.com',
  })),
  HttpClient: vi.fn(),
}));

describe('Transporter Integrations', () => {
  const mockCredentials: TransporterCredentials = {
    apiKey: 'test-api-key',
    apiSecret: 'test-api-secret',
    clientId: 'test-client-id',
    accessToken: 'test-access-token',
    accountCode: 'test-account-code',
    vendorCode: 'test-vendor-code',
  };

  const mockShipmentRequest: CreateShipmentRequest = {
    orderId: 'ORDER-001',
    orderNo: 'ORD-2024-001',
    orderDate: new Date('2024-01-15'),
    paymentMode: 'PREPAID',
    pickupAddress: {
      name: 'Warehouse',
      phone: '+919876543210',
      addressLine1: '123 Warehouse St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
    deliveryAddress: {
      name: 'John Doe',
      phone: '+919876543211',
      email: 'john@example.com',
      addressLine1: '456 Customer Ave',
      addressLine2: 'Apt 7',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
    },
    weight: 0.5,
    length: 20,
    width: 15,
    height: 10,
    items: [
      {
        skuCode: 'SKU001',
        name: 'Test Product',
        quantity: 2,
        unitPrice: 500,
        weight: 0.25,
        hsn: '12345678',
      },
    ],
    invoiceNo: 'INV-001',
    invoiceDate: new Date('2024-01-15'),
    invoiceValue: 1000,
    deliveryType: 'FORWARD',
    serviceType: 'EXPRESS',
  };

  describe('createTransporterIntegration factory', () => {
    it('should create Shiprocket integration', () => {
      const integration = createTransporterIntegration('SHIPROCKET', mockCredentials);
      expect(integration).toBeInstanceOf(ShiprocketIntegration);
      expect(integration.name).toBe('Shiprocket');
      expect(integration.code).toBe('SHIPROCKET');
    });

    it('should create Delhivery integration', () => {
      const integration = createTransporterIntegration('DELHIVERY', mockCredentials);
      expect(integration).toBeInstanceOf(DelhiveryIntegration);
      expect(integration.name).toBe('Delhivery');
      expect(integration.code).toBe('DELHIVERY');
    });

    it('should create BlueDart integration', () => {
      const integration = createTransporterIntegration('BLUEDART', mockCredentials);
      expect(integration).toBeInstanceOf(BlueDartIntegration);
      expect(integration.name).toBe('BlueDart');
      expect(integration.code).toBe('BLUEDART');
    });

    it('should create Ekart integration', () => {
      const integration = createTransporterIntegration('EKART', mockCredentials);
      expect(integration).toBeInstanceOf(EkartIntegration);
      expect(integration.name).toBe('Ekart');
      expect(integration.code).toBe('EKART');
    });

    it('should create Shadowfax integration', () => {
      const integration = createTransporterIntegration('SHADOWFAX', mockCredentials);
      expect(integration).toBeInstanceOf(ShadowfaxIntegration);
      expect(integration.name).toBe('Shadowfax');
      expect(integration.code).toBe('SHADOWFAX');
    });

    it('should create DTDC integration', () => {
      const integration = createTransporterIntegration('DTDC', mockCredentials);
      expect(integration).toBeInstanceOf(DTDCIntegration);
      expect(integration.name).toBe('DTDC');
      expect(integration.code).toBe('DTDC');
    });

    it('should create Ecom Express integration', () => {
      const integration = createTransporterIntegration('ECOM_EXPRESS', mockCredentials);
      expect(integration).toBeInstanceOf(EcomExpressIntegration);
      expect(integration.name).toBe('Ecom Express');
      expect(integration.code).toBe('ECOM_EXPRESS');
    });

    it('should create Xpressbees integration', () => {
      const integration = createTransporterIntegration('XPRESSBEES', mockCredentials);
      expect(integration).toBeInstanceOf(XpressbeesIntegration);
      expect(integration.name).toBe('Xpressbees');
      expect(integration.code).toBe('XPRESSBEES');
    });

    it('should throw error for unknown transporter', () => {
      expect(() =>
        createTransporterIntegration('UNKNOWN' as never, mockCredentials)
      ).toThrow('Unknown transporter code');
    });
  });

  describe('DelhiveryIntegration', () => {
    let integration: DelhiveryIntegration;
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
      integration = new DelhiveryIntegration(mockCredentials);
    });

    describe('authenticate', () => {
      it('should return true on successful authentication', async () => {
        mockClient.get.mockResolvedValue({
          success: true,
          data: { status: true },
        });

        const result = await integration.authenticate();
        expect(result).toBe(true);
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

    describe('createShipment', () => {
      it('should create shipment successfully', async () => {
        mockClient.post.mockResolvedValue({
          success: true,
          data: {
            success: true,
            packages: [
              {
                waybill: 'DEL123456789',
                status: 'success',
                remarks: 'Shipment created',
                refnum: 'ORD-2024-001',
              },
            ],
            package_count: 1,
          },
        });

        const result = await integration.createShipment(mockShipmentRequest);

        expect(result.success).toBe(true);
        expect(result.awbNo).toBe('DEL123456789');
        expect(result.courierName).toBe('Delhivery');
      });

      it('should handle COD shipment', async () => {
        const codRequest = {
          ...mockShipmentRequest,
          paymentMode: 'COD' as const,
          codAmount: 1000,
        };

        mockClient.post.mockResolvedValue({
          success: true,
          data: {
            success: true,
            packages: [{ waybill: 'DEL123456789' }],
          },
        });

        const result = await integration.createShipment(codRequest);
        expect(result.success).toBe(true);

        // Verify COD amount was included in the request
        const callData = mockClient.post.mock.calls[0][1];
        expect(callData).toContain('cod_amount');
      });

      it('should handle shipment creation failure', async () => {
        mockClient.post.mockResolvedValue({
          success: true,
          data: {
            success: false,
            packages: [
              {
                waybill: '',
                status: 'failed',
                remarks: 'Invalid pincode',
              },
            ],
          },
        });

        const result = await integration.createShipment(mockShipmentRequest);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid pincode');
      });

      it('should handle API errors', async () => {
        mockClient.post.mockResolvedValue({
          success: false,
          error: 'API rate limit exceeded',
        });

        const result = await integration.createShipment(mockShipmentRequest);

        expect(result.success).toBe(false);
        expect(result.error).toContain('rate limit');
      });

      it('should handle exceptions', async () => {
        mockClient.post.mockRejectedValue(new Error('Network timeout'));

        const result = await integration.createShipment(mockShipmentRequest);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Network timeout');
      });
    });

    describe('trackShipment', () => {
      it('should track shipment successfully', async () => {
        mockClient.get.mockResolvedValue({
          success: true,
          data: {
            ShipmentData: [
              {
                Shipment: {
                  AWB: 'DEL123456789',
                  Status: {
                    Status: 'Delivered',
                    StatusCode: 'DL',
                    StatusDateTime: '2024-01-17T14:30:00',
                    StatusLocation: 'Delhi',
                    Instructions: 'Package delivered',
                  },
                  Scans: [
                    {
                      ScanDetail: {
                        Scan: 'Delivered',
                        ScanDateTime: '2024-01-17T14:30:00',
                        ScannedLocation: 'Delhi Hub',
                        Instructions: 'Delivered to customer',
                      },
                    },
                    {
                      ScanDetail: {
                        Scan: 'Out for Delivery',
                        ScanDateTime: '2024-01-17T09:00:00',
                        ScannedLocation: 'Delhi Hub',
                        Instructions: 'With delivery agent',
                      },
                    },
                  ],
                  DestRecieveDate: '2024-01-17T14:30:00',
                  RecievedBy: 'John Doe',
                },
              },
            ],
          },
        });

        const result = await integration.trackShipment('DEL123456789');

        expect(result.success).toBe(true);
        expect(result.awbNo).toBe('DEL123456789');
        expect(result.currentStatus).toBe('Delivered');
        expect(result.currentStatusCode).toBe('DL');
        expect(result.deliveredTo).toBe('John Doe');
        expect(result.events).toHaveLength(2);
        expect(result.events![0].status).toBe('Delivered');
      });

      it('should handle tracking not found', async () => {
        mockClient.get.mockResolvedValue({
          success: true,
          data: { ShipmentData: [] },
        });

        const result = await integration.trackShipment('INVALID123');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to get tracking');
      });

      it('should handle API errors', async () => {
        mockClient.get.mockResolvedValue({
          success: false,
          error: 'Invalid AWB number',
        });

        const result = await integration.trackShipment('INVALID');

        expect(result.success).toBe(false);
      });

      it('should handle exceptions', async () => {
        mockClient.get.mockRejectedValue(new Error('Service unavailable'));

        const result = await integration.trackShipment('DEL123456789');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Service unavailable');
      });
    });

    describe('cancelShipment', () => {
      it('should cancel shipment successfully', async () => {
        mockClient.post.mockResolvedValue({
          success: true,
          data: { status: true },
        });

        const result = await integration.cancelShipment({
          awbNo: 'DEL123456789',
          reason: 'Customer request',
        });

        expect(result.success).toBe(true);
        expect(result.message).toBe('Shipment cancelled successfully');
      });

      it('should handle cancellation failure', async () => {
        mockClient.post.mockResolvedValue({
          success: true,
          data: {
            status: false,
            remark: 'Shipment already in transit',
          },
        });

        const result = await integration.cancelShipment({ awbNo: 'DEL123456789' });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Shipment already in transit');
      });

      it('should handle exceptions', async () => {
        mockClient.post.mockRejectedValue(new Error('Server error'));

        const result = await integration.cancelShipment({ awbNo: 'DEL123456789' });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Server error');
      });
    });

    describe('checkPincodeServiceability', () => {
      it('should check pincode serviceability successfully', async () => {
        mockClient.get.mockResolvedValue({
          success: true,
          data: {
            delivery_codes: [
              {
                postal_code: {
                  pin: '110001',
                  pre_paid: 'Y',
                  cash: 'Y',
                  cod: 'Y',
                  pickup: 'Y',
                  repl: 'N',
                  is_oda: 'N',
                },
              },
            ],
          },
        });

        const result = await integration.checkPincodeServiceability('110001');

        expect(result.serviceable).toBe(true);
        expect(result.codAvailable).toBe(true);
        expect(result.prepaidAvailable).toBe(true);
        expect(result.pincode).toBe('110001');
      });

      it('should handle non-serviceable pincode', async () => {
        mockClient.get.mockResolvedValue({
          success: true,
          data: {
            delivery_codes: [
              {
                postal_code: {
                  pin: '999999',
                  pre_paid: 'N',
                  cash: 'N',
                  cod: 'N',
                  pickup: 'N',
                },
              },
            ],
          },
        });

        const result = await integration.checkPincodeServiceability('999999');

        expect(result.serviceable).toBe(false);
        expect(result.codAvailable).toBe(false);
        expect(result.prepaidAvailable).toBe(false);
      });

      it('should handle pincode not found', async () => {
        mockClient.get.mockResolvedValue({
          success: true,
          data: { delivery_codes: [] },
        });

        const result = await integration.checkPincodeServiceability('000000');

        expect(result.serviceable).toBe(false);
      });

      it('should handle exceptions gracefully', async () => {
        mockClient.get.mockRejectedValue(new Error('Network error'));

        const result = await integration.checkPincodeServiceability('110001');

        expect(result.serviceable).toBe(false);
        expect(result.codAvailable).toBe(false);
      });
    });

    describe('calculateRates', () => {
      it('should calculate rates successfully', async () => {
        mockClient.get.mockResolvedValue({
          success: true,
          data: {
            status: true,
            charges: {
              charge: 75,
              cod_charge: 25,
            },
          },
        });

        const request: RateCalculationRequest = {
          pickupPincode: '400001',
          deliveryPincode: '110001',
          weight: 0.5,
          paymentMode: 'COD',
          codAmount: 1000,
        };

        const result = await integration.calculateRates(request);

        expect(result.success).toBe(true);
        expect(result.rates).toHaveLength(1);
        expect(result.rates![0].courierCode).toBe('DELHIVERY');
        expect(result.rates![0].rate).toBe(75);
        expect(result.rates![0].codCharges).toBe(25);
        expect(result.rates![0].totalRate).toBe(100);
      });

      it('should handle rate calculation failure', async () => {
        mockClient.get.mockResolvedValue({
          success: false,
          error: 'Pincode not serviceable',
        });

        const request: RateCalculationRequest = {
          pickupPincode: '400001',
          deliveryPincode: '999999',
          weight: 0.5,
          paymentMode: 'PREPAID',
        };

        const result = await integration.calculateRates(request);

        expect(result.success).toBe(false);
      });

      it('should handle exceptions', async () => {
        mockClient.get.mockRejectedValue(new Error('Service error'));

        const result = await integration.calculateRates({
          pickupPincode: '400001',
          deliveryPincode: '110001',
          weight: 1,
          paymentMode: 'PREPAID',
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Service error');
      });
    });

    describe('generateLabel', () => {
      it('should generate label successfully', async () => {
        mockClient.get.mockResolvedValue({
          success: true,
          data: {
            packages: [
              {
                pdf_download_link: 'https://delhivery.com/label/DEL123.pdf',
              },
            ],
          },
        });

        const result = await integration.generateLabel('DEL123456789');

        expect(result.success).toBe(true);
        expect(result.labelUrl).toBe('https://delhivery.com/label/DEL123.pdf');
      });

      it('should handle label generation failure', async () => {
        mockClient.get.mockResolvedValue({
          success: true,
          data: { packages: [] },
        });

        const result = await integration.generateLabel('INVALID');

        expect(result.success).toBe(false);
      });

      it('should handle exceptions', async () => {
        mockClient.get.mockRejectedValue(new Error('PDF generation failed'));

        const result = await integration.generateLabel('DEL123456789');

        expect(result.success).toBe(false);
        expect(result.error).toBe('PDF generation failed');
      });
    });
  });

  describe('Integration Interface Compliance', () => {
    const transporters = [
      { code: 'SHIPROCKET' as const, name: 'Shiprocket' },
      { code: 'DELHIVERY' as const, name: 'Delhivery' },
      { code: 'BLUEDART' as const, name: 'BlueDart' },
      { code: 'EKART' as const, name: 'Ekart' },
      { code: 'SHADOWFAX' as const, name: 'Shadowfax' },
      { code: 'DTDC' as const, name: 'DTDC' },
      { code: 'ECOM_EXPRESS' as const, name: 'Ecom Express' },
      { code: 'XPRESSBEES' as const, name: 'Xpressbees' },
    ];

    transporters.forEach(({ code, name }) => {
      describe(`${name} Integration`, () => {
        it('should implement ITransporterIntegration interface', () => {
          const integration = createTransporterIntegration(code, mockCredentials);

          // Required properties
          expect(integration.name).toBe(name);
          expect(integration.code).toBe(code);

          // Required methods
          expect(typeof integration.authenticate).toBe('function');
          expect(typeof integration.createShipment).toBe('function');
          expect(typeof integration.trackShipment).toBe('function');
          expect(typeof integration.cancelShipment).toBe('function');
        });

        it('should have authenticate method that returns Promise<boolean>', async () => {
          const integration = createTransporterIntegration(code, mockCredentials);
          const result = integration.authenticate().catch(() => false);
          expect(result).toBeInstanceOf(Promise);
          // Wait for promise to settle to avoid unhandled rejection
          await result;
        });

        it('should have createShipment method that returns Promise<CreateShipmentResponse>', async () => {
          const integration = createTransporterIntegration(code, mockCredentials);
          const result = integration.createShipment(mockShipmentRequest).catch(() => ({ success: false }));
          expect(result).toBeInstanceOf(Promise);
          await result;
        });

        it('should have trackShipment method that returns Promise<TrackingResponse>', async () => {
          const integration = createTransporterIntegration(code, mockCredentials);
          const result = integration.trackShipment('TEST123').catch(() => ({ success: false }));
          expect(result).toBeInstanceOf(Promise);
          await result;
        });

        it('should have cancelShipment method that returns Promise<CancelShipmentResponse>', async () => {
          const integration = createTransporterIntegration(code, mockCredentials);
          const result = integration.cancelShipment({ awbNo: 'TEST123' }).catch(() => ({ success: false }));
          expect(result).toBeInstanceOf(Promise);
          await result;
        });
      });
    });
  });

  describe('ShiprocketIntegration', () => {
    let integration: ShiprocketIntegration;
    let mockClient: {
      get: ReturnType<typeof vi.fn>;
      post: ReturnType<typeof vi.fn>;
      setHeader: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
      vi.clearAllMocks();
      const { createHttpClient } = await import('../http-client');
      mockClient = {
        get: vi.fn(),
        post: vi.fn(),
        setHeader: vi.fn(),
      };
      (createHttpClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);
      integration = new ShiprocketIntegration(mockCredentials);
    });

    describe('authenticate', () => {
      it('should authenticate and store token', async () => {
        mockClient.post.mockResolvedValue({
          success: true,
          data: {
            token: 'shiprocket-auth-token-123',
            expires_at: '2024-12-31T23:59:59Z',
          },
        });

        const result = await integration.authenticate();
        expect(result).toBe(true);
        expect(mockClient.setHeader).toHaveBeenCalledWith(
          'Authorization',
          'Bearer shiprocket-auth-token-123'
        );
      });

      it('should return false on auth failure', async () => {
        mockClient.post.mockResolvedValue({
          success: false,
          error: 'Invalid credentials',
        });

        const result = await integration.authenticate();
        expect(result).toBe(false);
      });
    });

    describe('createShipment', () => {
      it('should create order and assign AWB', async () => {
        // First call - authenticate
        mockClient.post.mockResolvedValueOnce({
          success: true,
          data: { token: 'auth-token' },
        });

        // Second call - create order
        mockClient.post.mockResolvedValueOnce({
          success: true,
          data: {
            order_id: 12345,
            shipment_id: 67890,
          },
        });

        // Third call - assign AWB
        mockClient.post.mockResolvedValueOnce({
          success: true,
          data: {
            awb_assign_status: 1,
            response: {
              data: {
                awb_code: 'SR123456789',
                courier_company_id: 1,
                courier_name: 'Delhivery',
              },
            },
          },
        });

        // Fourth call - generate label
        mockClient.post.mockResolvedValueOnce({
          success: true,
          data: {
            label_url: 'https://shiprocket.com/label/123.pdf',
          },
        });

        const result = await integration.createShipment(mockShipmentRequest);

        expect(result.success).toBe(true);
        expect(result.awbNo).toBe('SR123456789');
        expect(result.courierName).toBe('Delhivery');
      });

      it('should handle order creation failure', async () => {
        mockClient.post.mockResolvedValueOnce({
          success: true,
          data: { token: 'auth-token' },
        });

        mockClient.post.mockResolvedValueOnce({
          success: false,
          error: 'Order creation failed',
        });

        const result = await integration.createShipment(mockShipmentRequest);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Order creation failed');
      });

      it('should handle AWB assignment failure', async () => {
        mockClient.post.mockResolvedValueOnce({
          success: true,
          data: { token: 'auth-token' },
        });

        mockClient.post.mockResolvedValueOnce({
          success: true,
          data: { order_id: 12345, shipment_id: 67890 },
        });

        mockClient.post.mockResolvedValueOnce({
          success: false,
          error: 'No courier available',
        });

        const result = await integration.createShipment(mockShipmentRequest);
        expect(result.success).toBe(false);
      });
    });
  });
});
