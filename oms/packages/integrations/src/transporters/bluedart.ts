/**
 * BlueDart Courier Integration
 *
 * BlueDart is India's leading express delivery company.
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

interface BlueDartShipmentResponse {
  IsError: boolean;
  AWBNo?: string;
  TokenNumber?: string;
  ErrorMessage?: string;
  DestinationArea?: string;
  DestinationLocation?: string;
}

interface BlueDartTrackingResponse {
  TrackingDetails: {
    AWBNo: string;
    Status: string;
    StatusCode: string;
    StatusDate: string;
    StatusTime: string;
    Location: string;
    Scans: {
      ScanCode: string;
      ScanDate: string;
      ScanTime: string;
      ScanLocation: string;
      ScannedBy: string;
      Remarks: string;
    }[];
    DeliveryDate?: string;
    DeliveryTime?: string;
    ReceivedBy?: string;
  };
}

export class BlueDartIntegration implements ITransporterIntegration {
  name = 'BlueDart';
  code = 'BLUEDART';

  private client: HttpClient;
  private credentials: TransporterCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private circuitBreaker = createCircuitBreaker({ name: 'bluedart' });
  private rateLimiter = createRateLimiter({
    name: 'bluedart',
    ...TransporterRateLimits.BLUEDART,
  });

  constructor(credentials: TransporterCredentials) {
    this.credentials = credentials;
    this.client = createHttpClient({
      baseURL: 'https://api.bluedart.com',
      timeout: 60000,
    });
  }

  async authenticate(): Promise<boolean> {
    return this.circuitBreaker.execute(async () => {
      await this.rateLimiter.acquire();

      try {
        const response = await this.client.post<{
          access_token: string;
          token_type: string;
          expires_in: number;
        }>(
          '/oauth/token',
          {
            grant_type: 'client_credentials',
            client_id: this.credentials.clientId,
            client_secret: this.credentials.apiSecret,
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
        throw new Error('BlueDart authentication failed');
      }
    }
  }

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.ensureAuthenticated();
        await this.rateLimiter.acquire();

        const shipmentPayload = {
          Request: {
            Consignee: {
              ConsigneeName: request.deliveryAddress.name,
              ConsigneeAddress1: request.deliveryAddress.addressLine1,
              ConsigneeAddress2: request.deliveryAddress.addressLine2 || '',
              ConsigneePincode: request.deliveryAddress.pincode,
              ConsigneeMobile: request.deliveryAddress.phone,
              ConsigneeEmail: request.deliveryAddress.email || '',
            },
            Shipper: {
              CustomerCode: this.credentials.accountCode,
              CustomerName: request.pickupAddress.name,
              CustomerAddress1: request.pickupAddress.addressLine1,
              CustomerAddress2: request.pickupAddress.addressLine2 || '',
              CustomerPincode: request.pickupAddress.pincode,
              CustomerMobile: request.pickupAddress.phone,
            },
            Services: {
              ProductCode: 'A', // Air Express
              ProductType: request.paymentMode === 'COD' ? 'COD' : 'Prepaid',
              PieceCount: '1',
              ActualWeight: request.weight.toFixed(2),
              CreditReferenceNo: request.orderNo,
              InvoiceNo: request.invoiceNo || request.orderNo,
              InvoiceDate: (request.invoiceDate || new Date()).toISOString().split('T')[0],
              DeclaredValue: request.invoiceValue.toFixed(2),
              CodAmount: request.paymentMode === 'COD' ? (request.codAmount || request.invoiceValue).toFixed(2) : '0',
              Dimensions: {
                Length: (request.length || 10).toString(),
                Breadth: (request.width || 10).toString(),
                Height: (request.height || 10).toString(),
              },
            },
          },
        };

        const response = await this.client.post<BlueDartShipmentResponse>(
          '/API-QA/AWBGeneration/GenerateWayBill',
          shipmentPayload
        );

        if (response.success && !response.data?.IsError && response.data?.AWBNo) {
          return {
            success: true,
            awbNo: response.data.AWBNo,
            courierName: 'BlueDart',
            shipmentId: response.data.TokenNumber,
          };
        }

        return {
          success: false,
          error: response.data?.ErrorMessage || response.error || 'Failed to create shipment',
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

        const response = await this.client.get<BlueDartTrackingResponse>(
          `/API-QA/Tracking/GetTrackingDetails?AWBNo=${awbNo}`
        );

        if (!response.success || !response.data?.TrackingDetails) {
          return {
            success: false,
            awbNo,
            error: response.error || 'Failed to get tracking info',
          };
        }

        const tracking = response.data.TrackingDetails;
        const scans = tracking.Scans || [];

        const events: TrackingEvent[] = scans.map((scan) => ({
          status: scan.ScanCode,
          statusCode: scan.ScanCode,
          location: scan.ScanLocation,
          timestamp: new Date(`${scan.ScanDate} ${scan.ScanTime}`),
          remarks: scan.Remarks,
        }));

        return {
          success: true,
          awbNo,
          currentStatus: tracking.Status,
          currentStatusCode: tracking.StatusCode,
          deliveredAt: tracking.DeliveryDate
            ? new Date(`${tracking.DeliveryDate} ${tracking.DeliveryTime}`)
            : undefined,
          deliveredTo: tracking.ReceivedBy,
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

        const response = await this.client.post<{ Success: boolean; Message?: string }>(
          '/API-QA/AWBGeneration/CancelWayBill',
          {
            AWBNo: request.awbNo,
            Reason: request.reason || 'Cancelled by seller',
          }
        );

        if (response.success && response.data?.Success) {
          return {
            success: true,
            message: 'Shipment cancelled successfully',
          };
        }

        return {
          success: false,
          error: response.data?.Message || response.error || 'Failed to cancel shipment',
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
          Serviceable: boolean;
          CODEnabled: boolean;
          PrepaidEnabled: boolean;
          TAT?: number;
        }>(`/API-QA/Serviceability/CheckPincode?Pincode=${pincode}`);

        if (!response.success || !response.data) {
          return {
            pincode,
            serviceable: false,
            codAvailable: false,
            prepaidAvailable: false,
          };
        }

        return {
          pincode,
          serviceable: response.data.Serviceable,
          codAvailable: response.data.CODEnabled,
          prepaidAvailable: response.data.PrepaidEnabled,
          estimatedDays: response.data.TAT,
          courierCodes: ['BLUEDART'],
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
          Success: boolean;
          FreightCharge?: number;
          FuelSurcharge?: number;
          CODCharge?: number;
          TotalCharge?: number;
          TAT?: number;
        }>(
          '/API-QA/RateCalculation/CalculateRate',
          {
            OriginPincode: request.pickupPincode,
            DestinationPincode: request.deliveryPincode,
            Weight: request.weight,
            Length: request.length || 10,
            Breadth: request.width || 10,
            Height: request.height || 10,
            ProductType: request.paymentMode === 'COD' ? 'COD' : 'Prepaid',
            CODAmount: request.codAmount || 0,
          }
        );

        if (!response.success || !response.data?.Success) {
          return {
            success: false,
            error: response.error || 'Failed to calculate rates',
          };
        }

        return {
          success: true,
          rates: [
            {
              courierCode: 'BLUEDART',
              courierName: 'BlueDart',
              rate: response.data.FreightCharge || 0,
              fuelSurcharge: response.data.FuelSurcharge,
              codCharges: response.data.CODCharge,
              totalRate: response.data.TotalCharge || 0,
              estimatedDays: response.data.TAT,
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

        const response = await this.client.get<{ Success: boolean; LabelUrl?: string }>(
          `/API-QA/Label/GenerateLabel?AWBNo=${awbNo}`
        );

        if (response.success && response.data?.LabelUrl) {
          return {
            success: true,
            labelUrl: response.data.LabelUrl,
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

        const response = await this.client.post<{ Success: boolean; ManifestUrl?: string }>(
          '/API-QA/Manifest/GenerateManifest',
          { AWBNumbers: awbNos }
        );

        if (response.success && response.data?.ManifestUrl) {
          return {
            success: true,
            manifestUrl: response.data.ManifestUrl,
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

export function createBlueDartIntegration(credentials: TransporterCredentials): BlueDartIntegration {
  return new BlueDartIntegration(credentials);
}
