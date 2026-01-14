/**
 * Ecom Express Courier Integration
 *
 * Ecom Express is a leading e-commerce focused logistics company.
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

interface EcomExpressShipmentResponse {
  success: boolean;
  shipments?: {
    awb: string;
    order_number: string;
    reason?: string;
    label_url?: string;
    expected_date?: string;
  }[];
  errors?: {
    code: string;
    message: string;
    order_number?: string;
  }[];
}

interface EcomExpressTrackingResponse {
  success: boolean;
  data?: {
    awb: string;
    status: string;
    status_code: string;
    delivery_date?: string;
    received_by?: string;
    scans: {
      scan_type: string;
      scan_datetime: string;
      location: string;
      city: string;
      remarks?: string;
    }[];
  };
  error?: string;
}

export class EcomExpressIntegration implements ITransporterIntegration {
  name = 'Ecom Express';
  code = 'ECOM_EXPRESS';

  private client: HttpClient;
  private credentials: TransporterCredentials;
  private circuitBreaker = createCircuitBreaker({ name: 'ecomexpress' });
  private rateLimiter = createRateLimiter({
    name: 'ecomexpress',
    ...TransporterRateLimits.ECOM_EXPRESS,
  });

  constructor(credentials: TransporterCredentials) {
    this.credentials = credentials;
    this.client = createHttpClient({
      baseURL: 'https://api.ecomexpress.in',
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async authenticate(): Promise<boolean> {
    return this.circuitBreaker.execute(async () => {
      await this.rateLimiter.acquire();

      try {
        const response = await this.client.get<{ success: boolean; data?: { vendor_code: string } }>(
          '/apiv2/vendor/profile/'
        );
        return response.success === true && !!response.data;
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
          AWB_NUMBER: '', // Auto-generate
          ORDER_NUMBER: request.orderNo,
          PRODUCT: request.serviceType === 'EXPRESS' ? 'EXPRESS' : 'STANDARD',
          PAYMENT_MODE: request.paymentMode,
          COLLECTABLE_VALUE: request.paymentMode === 'COD' ? request.codAmount || request.invoiceValue : 0,
          DECLARED_VALUE: request.invoiceValue,
          CONSIGNEE: request.deliveryAddress.name,
          CONSIGNEE_ADDRESS1: request.deliveryAddress.addressLine1,
          CONSIGNEE_ADDRESS2: request.deliveryAddress.addressLine2 || '',
          CONSIGNEE_CITY: request.deliveryAddress.city,
          CONSIGNEE_STATE: request.deliveryAddress.state,
          CONSIGNEE_PINCODE: request.deliveryAddress.pincode,
          CONSIGNEE_MOBILE: request.deliveryAddress.phone,
          CONSIGNEE_EMAIL: request.deliveryAddress.email || '',
          PICKUP_NAME: request.pickupAddress.name,
          PICKUP_ADDRESS1: request.pickupAddress.addressLine1,
          PICKUP_ADDRESS2: request.pickupAddress.addressLine2 || '',
          PICKUP_CITY: request.pickupAddress.city,
          PICKUP_STATE: request.pickupAddress.state,
          PICKUP_PINCODE: request.pickupAddress.pincode,
          PICKUP_MOBILE: request.pickupAddress.phone,
          RETURN_NAME: request.pickupAddress.name,
          RETURN_ADDRESS1: request.pickupAddress.addressLine1,
          RETURN_ADDRESS2: request.pickupAddress.addressLine2 || '',
          RETURN_CITY: request.pickupAddress.city,
          RETURN_STATE: request.pickupAddress.state,
          RETURN_PINCODE: request.pickupAddress.pincode,
          RETURN_MOBILE: request.pickupAddress.phone,
          ACTUAL_WEIGHT: request.weight.toFixed(2),
          LENGTH: request.length || 10,
          BREADTH: request.width || 10,
          HEIGHT: request.height || 10,
          ITEM_DESCRIPTION: request.items.map((i) => i.name).join(', '),
          QUANTITY: request.items.reduce((sum, i) => sum + i.quantity, 0),
          GST_TAX_CGSTN: '',
          GST_TAX_NAME: '',
          INVOICE_NUMBER: request.invoiceNo || request.orderNo,
          INVOICE_DATE: (request.invoiceDate || new Date()).toISOString().split('T')[0],
          INVOICE_VALUE: request.invoiceValue,
          SELLER_TIN: '',
          shipment_type: request.deliveryType === 'REVERSE' ? 'REVERSE' : 'FORWARD',
        };

        const response = await this.client.post<EcomExpressShipmentResponse>(
          '/apiv2/manifest_awb/',
          { shipments: [shipmentPayload] }
        );

        if (response.success && response.data?.shipments?.[0]?.awb) {
          const shipment = response.data.shipments[0];
          return {
            success: true,
            awbNo: shipment.awb,
            courierName: 'Ecom Express',
            shipmentId: shipment.order_number,
            labelUrl: shipment.label_url,
            estimatedDelivery: shipment.expected_date
              ? new Date(shipment.expected_date)
              : undefined,
          };
        }

        const errorMsg = response.data?.errors?.[0]?.message || response.error || 'Failed to create shipment';
        return {
          success: false,
          error: errorMsg,
          errorCode: response.data?.errors?.[0]?.code,
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

        const response = await this.client.get<EcomExpressTrackingResponse>(
          `/apiv2/track_awb/?awb=${awbNo}`
        );

        if (!response.success || !response.data?.data) {
          return {
            success: false,
            awbNo,
            error: response.data?.error || response.error || 'Failed to get tracking info',
          };
        }

        const tracking = response.data.data;

        const events: TrackingEvent[] = (tracking.scans || []).map((scan) => ({
          status: scan.scan_type,
          location: `${scan.location}, ${scan.city}`,
          timestamp: new Date(scan.scan_datetime),
          remarks: scan.remarks,
        }));

        return {
          success: true,
          awbNo,
          currentStatus: tracking.status,
          currentStatusCode: tracking.status_code,
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

        const response = await this.client.post<{ success: boolean; message?: string }>(
          '/apiv2/cancel_awb/',
          {
            awbs: [request.awbNo],
            reason: request.reason || 'Cancelled by seller',
          }
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
        await this.rateLimiter.acquire();

        const response = await this.client.get<{
          success: boolean;
          data?: {
            pincode: string;
            is_serviceable: boolean;
            cod_available: boolean;
            prepaid_available: boolean;
            estimated_tat?: number;
            city: string;
            state: string;
          };
        }>(`/apiv2/pincodes/?pincode=${pincode}`);

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
          serviceable: data.is_serviceable,
          codAvailable: data.cod_available,
          prepaidAvailable: data.prepaid_available,
          estimatedDays: data.estimated_tat,
          courierCodes: ['ECOM_EXPRESS'],
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
          success: boolean;
          data?: {
            base_rate: number;
            cod_charges: number;
            fuel_surcharge: number;
            handling_charges: number;
            total_rate: number;
            estimated_tat: number;
          };
        }>(
          '/apiv2/calculate_rate/',
          {
            origin_pincode: request.pickupPincode,
            destination_pincode: request.deliveryPincode,
            weight: request.weight,
            length: request.length || 10,
            breadth: request.width || 10,
            height: request.height || 10,
            payment_mode: request.paymentMode,
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
              courierCode: 'ECOM_EXPRESS',
              courierName: 'Ecom Express',
              rate: data.base_rate,
              fuelSurcharge: data.fuel_surcharge,
              codCharges: data.cod_charges,
              totalRate: data.total_rate,
              estimatedDays: data.estimated_tat,
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
        await this.rateLimiter.acquire();

        const response = await this.client.get<{ success: boolean; data?: { label_url: string } }>(
          `/apiv2/fetch_awb/?awb=${awbNo}&format=pdf`
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
        await this.rateLimiter.acquire();

        const response = await this.client.post<{ success: boolean; data?: { manifest_url: string } }>(
          '/apiv2/create_manifest/',
          { awbs: awbNos }
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

export function createEcomExpressIntegration(credentials: TransporterCredentials): EcomExpressIntegration {
  return new EcomExpressIntegration(credentials);
}
