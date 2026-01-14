/**
 * Shadowfax Courier Integration
 *
 * Shadowfax is a hyperlocal and intercity logistics platform.
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

interface ShadowfaxShipmentResponse {
  status: 'success' | 'failure';
  data?: {
    awb_number: string;
    order_id: string;
    expected_delivery_date?: string;
    label_url?: string;
    courier_name: string;
  };
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
}

interface ShadowfaxTrackingResponse {
  status: 'success' | 'failure';
  data?: {
    awb_number: string;
    order_id: string;
    current_status: string;
    current_status_code: string;
    delivery_date?: string;
    received_by?: string;
    pod_image_url?: string;
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

export class ShadowfaxIntegration implements ITransporterIntegration {
  name = 'Shadowfax';
  code = 'SHADOWFAX';

  private client: HttpClient;
  private credentials: TransporterCredentials;
  private circuitBreaker = createCircuitBreaker({ name: 'shadowfax' });
  private rateLimiter = createRateLimiter({
    name: 'shadowfax',
    ...TransporterRateLimits.SHADOWFAX,
  });

  constructor(credentials: TransporterCredentials) {
    this.credentials = credentials;
    this.client = createHttpClient({
      baseURL: 'https://api.shadowfax.in',
      timeout: 30000,
      headers: {
        'Authorization': `Token ${credentials.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async authenticate(): Promise<boolean> {
    return this.circuitBreaker.execute(async () => {
      await this.rateLimiter.acquire();

      try {
        const response = await this.client.get<{ status: string; data?: { client_id: string } }>(
          '/v2/clients/profile'
        );
        return response.success && response.data?.status === 'success';
      } catch {
        return false;
      }
    });
  }

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.rateLimiter.acquire();

        const shipmentPayload = {
          client_order_id: request.orderId,
          order_number: request.orderNo,
          order_date: request.orderDate.toISOString(),
          payment_type: request.paymentMode.toLowerCase(),
          cod_amount: request.paymentMode === 'COD' ? request.codAmount || request.invoiceValue : 0,
          delivery_details: {
            name: request.deliveryAddress.name,
            phone: request.deliveryAddress.phone,
            email: request.deliveryAddress.email || '',
            address: request.deliveryAddress.addressLine1,
            address_2: request.deliveryAddress.addressLine2 || '',
            city: request.deliveryAddress.city,
            state: request.deliveryAddress.state,
            pincode: request.deliveryAddress.pincode,
            latitude: null,
            longitude: null,
          },
          pickup_details: {
            name: request.pickupAddress.name,
            phone: request.pickupAddress.phone,
            address: request.pickupAddress.addressLine1,
            address_2: request.pickupAddress.addressLine2 || '',
            city: request.pickupAddress.city,
            state: request.pickupAddress.state,
            pincode: request.pickupAddress.pincode,
          },
          package_details: {
            weight: request.weight,
            length: request.length || 10,
            breadth: request.width || 10,
            height: request.height || 10,
            description: request.items.map((i) => i.name).join(', '),
          },
          items: request.items.map((item) => ({
            sku: item.skuCode,
            name: item.name,
            quantity: item.quantity,
            price: item.unitPrice,
            hsn_code: item.hsn || '',
          })),
          invoice: {
            number: request.invoiceNo || request.orderNo,
            date: (request.invoiceDate || new Date()).toISOString().split('T')[0],
            value: request.invoiceValue,
          },
          delivery_type: request.deliveryType?.toLowerCase() || 'forward',
          service_type: request.serviceType?.toLowerCase() || 'standard',
          special_instructions: request.remarks || '',
        };

        const response = await this.client.post<ShadowfaxShipmentResponse>(
          '/v3/orders/create',
          shipmentPayload
        );

        if (response.success && response.data?.status === 'success' && response.data?.data?.awb_number) {
          return {
            success: true,
            awbNo: response.data.data.awb_number,
            courierName: 'Shadowfax',
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
        await this.rateLimiter.acquire();

        const response = await this.client.get<ShadowfaxTrackingResponse>(
          `/v3/orders/track?awb_number=${awbNo}`
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
        await this.rateLimiter.acquire();

        const response = await this.client.post<{ status: string; message?: string }>(
          '/v3/orders/cancel',
          {
            awb_number: request.awbNo,
            cancellation_reason: request.reason || 'Cancelled by seller',
          }
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
        await this.rateLimiter.acquire();

        const response = await this.client.get<{
          status: string;
          data?: {
            serviceable: boolean;
            cod_enabled: boolean;
            prepaid_enabled: boolean;
            estimated_tat?: number;
            service_types: string[];
          };
        }>(`/v2/serviceability/check?pincode=${pincode}`);

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
          codAvailable: data.cod_enabled,
          prepaidAvailable: data.prepaid_enabled,
          estimatedDays: data.estimated_tat,
          courierCodes: ['SHADOWFAX'],
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
        await this.rateLimiter.acquire();

        const response = await this.client.post<{
          status: string;
          data?: {
            rates: {
              service_type: string;
              base_rate: number;
              cod_charge: number;
              fuel_surcharge: number;
              total_rate: number;
              estimated_tat: number;
            }[];
          };
        }>(
          '/v2/rates/calculate',
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
            courierCode: `SHADOWFAX_${rate.service_type.toUpperCase()}`,
            courierName: `Shadowfax ${rate.service_type}`,
            rate: rate.base_rate,
            fuelSurcharge: rate.fuel_surcharge,
            codCharges: rate.cod_charge,
            totalRate: rate.total_rate,
            estimatedDays: rate.estimated_tat,
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
        await this.rateLimiter.acquire();

        const response = await this.client.get<{ status: string; data?: { label_url: string } }>(
          `/v3/orders/label?awb_number=${awbNo}`
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
        await this.rateLimiter.acquire();

        const response = await this.client.post<{ status: string; data?: { manifest_url: string } }>(
          '/v3/orders/manifest',
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

export function createShadowfaxIntegration(credentials: TransporterCredentials): ShadowfaxIntegration {
  return new ShadowfaxIntegration(credentials);
}
