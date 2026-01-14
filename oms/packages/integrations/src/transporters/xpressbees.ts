/**
 * Xpressbees Courier Integration
 *
 * Xpressbees is one of India's leading logistics companies.
 * Uses REST API with API key authentication.
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

interface XpressbeesShipmentResponse {
  status: 'success' | 'failure';
  data?: {
    awb_number: string;
    order_id: string;
    courier_name: string;
    label_url?: string;
    expected_delivery_date?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
}

interface XpressbeesTrackingResponse {
  status: 'success' | 'failure';
  data?: {
    awb_number: string;
    current_status: string;
    current_status_code: string;
    delivery_date?: string;
    received_by?: string;
    pod_url?: string;
    tracking_history: {
      status: string;
      status_code: string;
      location: string;
      timestamp: string;
      remarks?: string;
    }[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export class XpressbeesIntegration implements ITransporterIntegration {
  name = 'Xpressbees';
  code = 'XPRESSBEES';

  private client: HttpClient;
  private credentials: TransporterCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private circuitBreaker = createCircuitBreaker({ name: 'xpressbees' });
  private rateLimiter = createRateLimiter({
    name: 'xpressbees',
    ...TransporterRateLimits.XPRESSBEES,
  });

  constructor(credentials: TransporterCredentials) {
    this.credentials = credentials;
    this.client = createHttpClient({
      baseURL: 'https://api.xpressbees.com',
      timeout: 30000,
    });
  }

  async authenticate(): Promise<boolean> {
    return this.circuitBreaker.execute(async () => {
      await this.rateLimiter.acquire();

      try {
        const response = await this.client.post<{
          status: string;
          data?: {
            token: string;
            expires_in: number;
          };
        }>(
          '/api/v1/auth/token',
          {
            email: this.credentials.apiKey,
            password: this.credentials.apiSecret,
          }
        );

        if (response.success && response.data?.data?.token) {
          this.accessToken = response.data.data.token;
          this.tokenExpiry = Date.now() + (response.data.data.expires_in * 1000) - 60000;
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
        throw new Error('Xpressbees authentication failed');
      }
    }
  }

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.ensureAuthenticated();
        await this.rateLimiter.acquire();

        const shipmentPayload = {
          order_number: request.orderNo,
          order_date: request.orderDate.toISOString().split('T')[0],
          payment_type: request.paymentMode.toLowerCase(),
          cod_amount: request.paymentMode === 'COD' ? request.codAmount || request.invoiceValue : 0,
          consignee: {
            name: request.deliveryAddress.name,
            phone: request.deliveryAddress.phone,
            email: request.deliveryAddress.email || '',
            address_line1: request.deliveryAddress.addressLine1,
            address_line2: request.deliveryAddress.addressLine2 || '',
            city: request.deliveryAddress.city,
            state: request.deliveryAddress.state,
            pincode: request.deliveryAddress.pincode,
            country: 'India',
          },
          pickup: {
            name: request.pickupAddress.name,
            phone: request.pickupAddress.phone,
            address_line1: request.pickupAddress.addressLine1,
            address_line2: request.pickupAddress.addressLine2 || '',
            city: request.pickupAddress.city,
            state: request.pickupAddress.state,
            pincode: request.pickupAddress.pincode,
            country: 'India',
          },
          return_address: {
            name: request.pickupAddress.name,
            phone: request.pickupAddress.phone,
            address_line1: request.pickupAddress.addressLine1,
            address_line2: request.pickupAddress.addressLine2 || '',
            city: request.pickupAddress.city,
            state: request.pickupAddress.state,
            pincode: request.pickupAddress.pincode,
            country: 'India',
          },
          package: {
            weight: request.weight,
            length: request.length || 10,
            breadth: request.width || 10,
            height: request.height || 10,
            description: request.items.map((i) => i.name).join(', '),
            declared_value: request.invoiceValue,
          },
          products: request.items.map((item) => ({
            sku: item.skuCode,
            name: item.name,
            quantity: item.quantity,
            price: item.unitPrice,
            hsn: item.hsn || '',
          })),
          invoice: {
            number: request.invoiceNo || request.orderNo,
            date: (request.invoiceDate || new Date()).toISOString().split('T')[0],
            value: request.invoiceValue,
          },
          order_type: request.deliveryType === 'REVERSE' ? 'reverse' : 'forward',
          service_type: request.serviceType?.toLowerCase() || 'express',
          special_instructions: request.remarks || '',
        };

        const response = await this.client.post<XpressbeesShipmentResponse>(
          '/api/v1/shipments',
          shipmentPayload
        );

        if (response.success && response.data?.status === 'success' && response.data?.data?.awb_number) {
          return {
            success: true,
            awbNo: response.data.data.awb_number,
            courierName: 'Xpressbees',
            shipmentId: response.data.data.order_id,
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

        const response = await this.client.get<XpressbeesTrackingResponse>(
          `/api/v1/tracking/${awbNo}`
        );

        if (!response.success || response.data?.status !== 'success' || !response.data?.data) {
          return {
            success: false,
            awbNo,
            error: response.data?.error?.message || response.error || 'Failed to get tracking info',
          };
        }

        const tracking = response.data.data;

        const events: TrackingEvent[] = (tracking.tracking_history || []).map((event) => ({
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
          deliveredAt: tracking.delivery_date ? new Date(tracking.delivery_date) : undefined,
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

        const response = await this.client.post<{ status: string; message?: string }>(
          `/api/v1/shipments/${request.awbNo}/cancel`,
          { reason: request.reason || 'Cancelled by seller' }
        );

        if (response.success && response.data?.status === 'success') {
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
          status: string;
          data?: {
            pincode: string;
            serviceable: boolean;
            cod_available: boolean;
            prepaid_available: boolean;
            tat_days?: number;
            city: string;
            state: string;
            zone: string;
          };
        }>(`/api/v1/serviceability?pincode=${pincode}`);

        if (!response.success || response.data?.status !== 'success' || !response.data?.data) {
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
          courierCodes: ['XPRESSBEES'],
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
          status: string;
          data?: {
            rates: {
              service_type: string;
              base_rate: number;
              cod_charges: number;
              fuel_surcharge: number;
              gst: number;
              total_rate: number;
              tat_days: number;
            }[];
          };
        }>(
          '/api/v1/rates',
          {
            origin_pincode: request.pickupPincode,
            destination_pincode: request.deliveryPincode,
            weight: request.weight,
            length: request.length || 10,
            breadth: request.width || 10,
            height: request.height || 10,
            payment_type: request.paymentMode.toLowerCase(),
            cod_amount: request.codAmount || 0,
          }
        );

        if (!response.success || response.data?.status !== 'success' || !response.data?.data?.rates) {
          return {
            success: false,
            error: response.error || 'Failed to calculate rates',
          };
        }

        return {
          success: true,
          rates: response.data.data.rates.map((rate) => ({
            courierCode: `XPRESSBEES_${rate.service_type.toUpperCase()}`,
            courierName: `Xpressbees ${rate.service_type}`,
            rate: rate.base_rate,
            fuelSurcharge: rate.fuel_surcharge,
            codCharges: rate.cod_charges,
            totalRate: rate.total_rate,
            estimatedDays: rate.tat_days,
          })),
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

        const response = await this.client.get<{ status: string; data?: { label_url: string } }>(
          `/api/v1/shipments/${awbNo}/label`
        );

        if (response.success && response.data?.status === 'success' && response.data?.data?.label_url) {
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

        const response = await this.client.post<{ status: string; data?: { manifest_url: string } }>(
          '/api/v1/manifest',
          { awb_numbers: awbNos }
        );

        if (response.success && response.data?.status === 'success' && response.data?.data?.manifest_url) {
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

export function createXpressbeesIntegration(credentials: TransporterCredentials): XpressbeesIntegration {
  return new XpressbeesIntegration(credentials);
}
