/**
 * Ekart (Flipkart Logistics) Integration
 *
 * Ekart is Flipkart's logistics arm, available for third-party sellers.
 * Uses REST API with OAuth2 authentication.
 */

import { HttpClient, createHttpClient } from '../http-client';
import {
  createCircuitBreaker,
  createRateLimiter,
  TransporterRateLimits,
} from '../utils';
import {
  ITransporterIntegration,
  TransporterCredentials,
  CreateShipmentRequest,
  CreateShipmentResponse,
  TrackingResponse,
  TrackingEvent,
  CancelShipmentRequest,
  CancelShipmentResponse,
  PincodeServiceability,
  RateCalculationRequest,
  RateCalculationResponse,
} from './types';

interface EkartShipmentResponse {
  success: boolean;
  data?: {
    tracking_id: string;
    awb_number: string;
    courier_name: string;
    expected_delivery_date?: string;
    label_url?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface EkartTrackingResponse {
  success: boolean;
  data?: {
    tracking_id: string;
    awb_number: string;
    current_status: string;
    current_status_code: string;
    delivered_date?: string;
    received_by?: string;
    events: {
      status: string;
      status_code: string;
      timestamp: string;
      location: string;
      remarks: string;
    }[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export class EkartIntegration implements ITransporterIntegration {
  name = 'Ekart';
  code = 'EKART';

  private client: HttpClient;
  private credentials: TransporterCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private circuitBreaker = createCircuitBreaker({ name: 'ekart' });
  private rateLimiter = createRateLimiter({
    name: 'ekart',
    ...TransporterRateLimits.EKART,
  });

  constructor(credentials: TransporterCredentials) {
    this.credentials = credentials;
    this.client = createHttpClient({
      baseURL: 'https://logistics-api.flipkart.net',
      timeout: 30000,
    });
  }

  async authenticate(): Promise<boolean> {
    return this.circuitBreaker.execute(async () => {
      await this.rateLimiter.acquire();

      try {
        const authString = Buffer.from(
          `${this.credentials.clientId}:${this.credentials.apiSecret}`
        ).toString('base64');

        const response = await this.client.post<{
          access_token: string;
          token_type: string;
          expires_in: number;
        }>(
          '/oauth/token',
          'grant_type=client_credentials',
          {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        if (response.success && response.data?.access_token) {
          this.accessToken = response.data.access_token;
          this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
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
        throw new Error('Ekart authentication failed');
      }
    }
  }

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.ensureAuthenticated();
        await this.rateLimiter.acquire();

        const shipmentPayload = {
          seller_id: this.credentials.vendorCode,
          order_id: request.orderId,
          order_number: request.orderNo,
          order_date: request.orderDate.toISOString(),
          payment_mode: request.paymentMode.toLowerCase(),
          cod_amount: request.paymentMode === 'COD' ? request.codAmount || request.invoiceValue : 0,
          delivery_address: {
            name: request.deliveryAddress.name,
            phone: request.deliveryAddress.phone,
            email: request.deliveryAddress.email || '',
            address_line1: request.deliveryAddress.addressLine1,
            address_line2: request.deliveryAddress.addressLine2 || '',
            city: request.deliveryAddress.city,
            state: request.deliveryAddress.state,
            pincode: request.deliveryAddress.pincode,
            country: request.deliveryAddress.country || 'IN',
          },
          pickup_address: {
            name: request.pickupAddress.name,
            phone: request.pickupAddress.phone,
            address_line1: request.pickupAddress.addressLine1,
            address_line2: request.pickupAddress.addressLine2 || '',
            city: request.pickupAddress.city,
            state: request.pickupAddress.state,
            pincode: request.pickupAddress.pincode,
            country: request.pickupAddress.country || 'IN',
          },
          package: {
            weight: request.weight,
            length: request.length || 10,
            width: request.width || 10,
            height: request.height || 10,
            items: request.items.map((item) => ({
              sku: item.skuCode,
              name: item.name,
              quantity: item.quantity,
              price: item.unitPrice,
              hsn: item.hsn || '',
            })),
          },
          invoice: {
            number: request.invoiceNo || request.orderNo,
            date: (request.invoiceDate || new Date()).toISOString().split('T')[0],
            value: request.invoiceValue,
          },
          service_type: request.serviceType?.toLowerCase() || 'standard',
        };

        const response = await this.client.post<EkartShipmentResponse>(
          '/v1/shipments/create',
          shipmentPayload
        );

        if (response.success && response.data?.data?.awb_number) {
          return {
            success: true,
            awbNo: response.data.data.awb_number,
            courierName: 'Ekart',
            shipmentId: response.data.data.tracking_id,
            labelUrl: response.data.data.label_url,
            estimatedDelivery: response.data.data.expected_delivery_date
              ? new Date(response.data.data.expected_delivery_date)
              : undefined,
          };
        }

        return {
          success: false,
          error: response.data?.error?.message || response.error || 'Failed to create shipment',
          errorCode: response.data?.error?.code,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }

  async trackShipment(awbNo: string): Promise<TrackingResponse> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.ensureAuthenticated();
        await this.rateLimiter.acquire();

        const response = await this.client.get<EkartTrackingResponse>(
          `/v1/shipments/track/${awbNo}`
        );

        if (!response.success || !response.data?.data) {
          return {
            success: false,
            awbNo,
            error: response.data?.error?.message || response.error || 'Failed to get tracking info',
          };
        }

        const tracking = response.data.data;

        const events: TrackingEvent[] = (tracking.events || []).map((event) => ({
          status: event.status,
          statusCode: event.status_code,
          location: event.location,
          timestamp: new Date(event.timestamp),
          remarks: event.remarks,
        }));

        return {
          success: true,
          awbNo,
          currentStatus: tracking.current_status,
          currentStatusCode: tracking.current_status_code,
          deliveredAt: tracking.delivered_date ? new Date(tracking.delivered_date) : undefined,
          deliveredTo: tracking.received_by,
          events,
        };
      } catch (error) {
        return {
          success: false,
          awbNo,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }

  async cancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.ensureAuthenticated();
        await this.rateLimiter.acquire();

        const response = await this.client.post<{ success: boolean; message?: string }>(
          `/v1/shipments/cancel/${request.awbNo}`,
          { reason: request.reason || 'Cancelled by seller' }
        );

        if (response.success && response.data?.success) {
          return {
            success: true,
            message: response.data.message || 'Shipment cancelled successfully',
          };
        }

        return {
          success: false,
          error: response.data?.message || response.error || 'Failed to cancel shipment',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }

  async checkPincodeServiceability(pincode: string): Promise<PincodeServiceability> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.ensureAuthenticated();
        await this.rateLimiter.acquire();

        const response = await this.client.get<{
          success: boolean;
          data?: {
            serviceable: boolean;
            cod_available: boolean;
            prepaid_available: boolean;
            tat_days?: number;
          };
        }>(`/v1/serviceability/check?pincode=${pincode}`);

        if (!response.success || !response.data?.data) {
          return {
            pincode,
            serviceable: false,
            codAvailable: false,
            prepaidAvailable: false,
          };
        }

        const data = response.data.data;

        return {
          pincode,
          serviceable: data.serviceable,
          codAvailable: data.cod_available,
          prepaidAvailable: data.prepaid_available,
          estimatedDays: data.tat_days,
          courierCodes: ['EKART'],
        };
      } catch {
        return {
          pincode,
          serviceable: false,
          codAvailable: false,
          prepaidAvailable: false,
        };
      }
    });
  }

  async calculateRates(request: RateCalculationRequest): Promise<RateCalculationResponse> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.ensureAuthenticated();
        await this.rateLimiter.acquire();

        const response = await this.client.post<{
          success: boolean;
          data?: {
            base_rate: number;
            fuel_surcharge: number;
            cod_charge: number;
            total_rate: number;
            tat_days: number;
          };
        }>(
          '/v1/rates/calculate',
          {
            origin_pincode: request.pickupPincode,
            destination_pincode: request.deliveryPincode,
            weight: request.weight,
            length: request.length || 10,
            width: request.width || 10,
            height: request.height || 10,
            payment_mode: request.paymentMode.toLowerCase(),
            cod_amount: request.codAmount || 0,
          }
        );

        if (!response.success || !response.data?.data) {
          return {
            success: false,
            error: response.error || 'Failed to calculate rates',
          };
        }

        const data = response.data.data;

        return {
          success: true,
          rates: [
            {
              courierCode: 'EKART',
              courierName: 'Ekart',
              rate: data.base_rate,
              fuelSurcharge: data.fuel_surcharge,
              codCharges: data.cod_charge,
              totalRate: data.total_rate,
              estimatedDays: data.tat_days,
            },
          ],
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }

  async generateLabel(awbNo: string): Promise<{ success: boolean; labelUrl?: string; error?: string }> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.ensureAuthenticated();
        await this.rateLimiter.acquire();

        const response = await this.client.get<{ success: boolean; data?: { label_url: string } }>(
          `/v1/shipments/label/${awbNo}`
        );

        if (response.success && response.data?.data?.label_url) {
          return {
            success: true,
            labelUrl: response.data.data.label_url,
          };
        }

        return {
          success: false,
          error: response.error || 'Failed to generate label',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }

  async generateManifest(awbNos: string[]): Promise<{ success: boolean; manifestUrl?: string; error?: string }> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.ensureAuthenticated();
        await this.rateLimiter.acquire();

        const response = await this.client.post<{ success: boolean; data?: { manifest_url: string } }>(
          '/v1/shipments/manifest',
          { awb_numbers: awbNos }
        );

        if (response.success && response.data?.data?.manifest_url) {
          return {
            success: true,
            manifestUrl: response.data.data.manifest_url,
          };
        }

        return {
          success: false,
          error: response.error || 'Failed to generate manifest',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }
}

export function createEkartIntegration(credentials: TransporterCredentials): EkartIntegration {
  return new EkartIntegration(credentials);
}
