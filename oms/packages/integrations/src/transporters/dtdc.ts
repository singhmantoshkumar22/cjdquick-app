/**
 * DTDC Courier Integration
 *
 * DTDC is one of India's largest courier and parcel services.
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

interface DTDCShipmentResponse {
  responseCode: string;
  responseMessage: string;
  data?: {
    consignmentNumber: string;
    referenceNumber: string;
    serviceType: string;
    expectedDeliveryDate?: string;
    labelUrl?: string;
  };
  error?: {
    errorCode: string;
    errorMessage: string;
  };
}

interface DTDCTrackingResponse {
  responseCode: string;
  responseMessage: string;
  data?: {
    consignmentNumber: string;
    currentStatus: string;
    currentStatusCode: string;
    deliveryDate?: string;
    receivedBy?: string;
    signatureUrl?: string;
    trackingEvents: {
      status: string;
      statusCode: string;
      location: string;
      dateTime: string;
      remarks?: string;
    }[];
  };
}

export class DTDCIntegration implements ITransporterIntegration {
  name = 'DTDC';
  code = 'DTDC';

  private client: HttpClient;
  private credentials: TransporterCredentials;
  private circuitBreaker = createCircuitBreaker({ name: 'dtdc' });
  private rateLimiter = createRateLimiter({
    name: 'dtdc',
    ...TransporterRateLimits.DTDC,
  });

  constructor(credentials: TransporterCredentials) {
    this.credentials = credentials;
    this.client = createHttpClient({
      baseURL: 'https://api.dtdc.com',
      timeout: 30000,
      headers: {
        'X-API-Key': credentials.apiKey || '',
        'X-Customer-Code': credentials.accountCode || '',
        'Content-Type': 'application/json',
      },
    });
  }

  async authenticate(): Promise<boolean> {
    return this.circuitBreaker.execute(async () => {
      await this.rateLimiter.acquire();

      try {
        const response = await this.client.get<{ responseCode: string; data?: { customerId: string } }>(
          '/v1/customer/profile'
        );
        return response.success && response.data?.responseCode === 'SUCCESS';
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
          customerCode: this.credentials.accountCode,
          referenceNumber: request.orderNo,
          orderDate: request.orderDate.toISOString().split('T')[0],
          serviceType: request.serviceType === 'EXPRESS' ? 'PRIORITY' : 'LITE',
          paymentType: request.paymentMode,
          codAmount: request.paymentMode === 'COD' ? request.codAmount || request.invoiceValue : 0,
          consignee: {
            name: request.deliveryAddress.name,
            phone: request.deliveryAddress.phone,
            email: request.deliveryAddress.email || '',
            address1: request.deliveryAddress.addressLine1,
            address2: request.deliveryAddress.addressLine2 || '',
            city: request.deliveryAddress.city,
            state: request.deliveryAddress.state,
            pincode: request.deliveryAddress.pincode,
            country: 'INDIA',
          },
          consignor: {
            name: request.pickupAddress.name,
            phone: request.pickupAddress.phone,
            address1: request.pickupAddress.addressLine1,
            address2: request.pickupAddress.addressLine2 || '',
            city: request.pickupAddress.city,
            state: request.pickupAddress.state,
            pincode: request.pickupAddress.pincode,
            country: 'INDIA',
          },
          package: {
            weight: request.weight,
            length: request.length || 10,
            breadth: request.width || 10,
            height: request.height || 10,
            declaredValue: request.invoiceValue,
            contentDescription: request.items.map((i) => i.name).join(', '),
          },
          invoice: {
            number: request.invoiceNo || request.orderNo,
            date: (request.invoiceDate || new Date()).toISOString().split('T')[0],
            value: request.invoiceValue,
          },
          items: request.items.map((item) => ({
            sku: item.skuCode,
            description: item.name,
            quantity: item.quantity,
            unitValue: item.unitPrice,
            hsnCode: item.hsn || '',
          })),
          shipmentType: request.deliveryType === 'REVERSE' ? 'RETURN' : 'FORWARD',
          specialInstructions: request.remarks || '',
        };

        const response = await this.client.post<DTDCShipmentResponse>(
          '/v1/shipment/create',
          shipmentPayload
        );

        if (response.success && response.data?.responseCode === 'SUCCESS' && response.data?.data?.consignmentNumber) {
          return {
            success: true,
            awbNo: response.data.data.consignmentNumber,
            courierName: 'DTDC',
            shipmentId: response.data.data.referenceNumber,
            labelUrl: response.data.data.labelUrl,
            estimatedDelivery: response.data.data.expectedDeliveryDate
              ? new Date(response.data.data.expectedDeliveryDate)
              : undefined,
          };
        }

        return {
          success: false,
          error: response.data?.error?.errorMessage || response.error || 'Failed to create shipment',
          errorCode: response.data?.error?.errorCode,
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

        const response = await this.client.get<DTDCTrackingResponse>(
          `/v1/tracking/${awbNo}`
        );

        if (!response.success || response.data?.responseCode !== 'SUCCESS' || !response.data?.data) {
          return {
            success: false,
            awbNo,
            error: response.error || 'Failed to get tracking info',
          };
        }

        const tracking = response.data.data;

        const events: TrackingEvent[] = (tracking.trackingEvents || []).map((event) => ({
          status: event.status,
          statusCode: event.statusCode,
          location: event.location,
          timestamp: new Date(event.dateTime),
          remarks: event.remarks,
        }));

        return {
          success: true,
          awbNo,
          currentStatus: tracking.currentStatus,
          currentStatusCode: tracking.currentStatusCode,
          deliveredAt: tracking.deliveryDate ? new Date(tracking.deliveryDate) : undefined,
          deliveredTo: tracking.receivedBy,
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

        const response = await this.client.post<{ responseCode: string; responseMessage?: string }>(
          '/v1/shipment/cancel',
          {
            consignmentNumber: request.awbNo,
            cancellationReason: request.reason || 'Cancelled by seller',
          }
        );

        if (response.success && response.data?.responseCode === 'SUCCESS') {
          return {
            success: true,
            message: response.data.responseMessage || 'Shipment cancelled successfully',
          };
        }

        return {
          success: false,
          error: response.data?.responseMessage || response.error || 'Failed to cancel shipment',
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
          responseCode: string;
          data?: {
            serviceable: boolean;
            codEnabled: boolean;
            prepaidEnabled: boolean;
            tat?: number;
            serviceTypes: string[];
          };
        }>(`/v1/serviceability/${pincode}`);

        if (!response.success || response.data?.responseCode !== 'SUCCESS' || !response.data?.data) {
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
          codAvailable: data.codEnabled,
          prepaidAvailable: data.prepaidEnabled,
          estimatedDays: data.tat,
          courierCodes: ['DTDC'],
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
          responseCode: string;
          data?: {
            rates: {
              serviceType: string;
              freightCharge: number;
              codCharge: number;
              fuelSurcharge: number;
              serviceTax: number;
              totalCharge: number;
              estimatedTat: number;
            }[];
          };
        }>(
          '/v1/rates/calculate',
          {
            originPincode: request.pickupPincode,
            destinationPincode: request.deliveryPincode,
            weight: request.weight,
            length: request.length || 10,
            breadth: request.width || 10,
            height: request.height || 10,
            paymentType: request.paymentMode,
            declaredValue: request.codAmount || 0,
          }
        );

        if (!response.success || response.data?.responseCode !== 'SUCCESS' || !response.data?.data?.rates) {
          return {
            success: false,
            error: response.error || 'Failed to calculate rates',
          };
        }

        return {
          success: true,
          rates: response.data.data.rates.map((rate) => ({
            courierCode: `DTDC_${rate.serviceType.toUpperCase()}`,
            courierName: `DTDC ${rate.serviceType}`,
            rate: rate.freightCharge,
            fuelSurcharge: rate.fuelSurcharge,
            codCharges: rate.codCharge,
            totalRate: rate.totalCharge,
            estimatedDays: rate.estimatedTat,
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

        const response = await this.client.get<{ responseCode: string; data?: { labelUrl: string } }>(
          `/v1/shipment/label/${awbNo}`
        );

        if (response.success && response.data?.responseCode === 'SUCCESS' && response.data?.data?.labelUrl) {
          return {
            success: true,
            labelUrl: response.data.data.labelUrl,
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

        const response = await this.client.post<{ responseCode: string; data?: { manifestUrl: string } }>(
          '/v1/manifest/generate',
          { consignmentNumbers: awbNos }
        );

        if (response.success && response.data?.responseCode === 'SUCCESS' && response.data?.data?.manifestUrl) {
          return {
            success: true,
            manifestUrl: response.data.data.manifestUrl,
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

export function createDTDCIntegration(credentials: TransporterCredentials): DTDCIntegration {
  return new DTDCIntegration(credentials);
}
