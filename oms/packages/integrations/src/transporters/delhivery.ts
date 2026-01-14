import { HttpClient, createHttpClient } from '../http-client';
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

interface DelhiveryPackageResponse {
  packages: {
    waybill: string;
    status: string;
    remarks: string;
    refnum: string;
  }[];
  cash_pickups_count: number;
  package_count: number;
  upload_wbn: string;
  replacement_count: number;
  pickups_count: number;
  packages_update_count: number;
  cod_amount: number;
  success: boolean;
}

interface DelhiveryTrackingResponse {
  ShipmentData: {
    Shipment: {
      Status: {
        Status: string;
        StatusCode: string;
        StatusDateTime: string;
        StatusLocation: string;
        Instructions: string;
      };
      Scans: {
        ScanDetail: {
          Scan: string;
          ScanDateTime: string;
          ScannedLocation: string;
          Instructions: string;
        };
      }[];
      AWB: string;
      OrderType: string;
      CODAmount: string;
      DestRecieveDate?: string;
      RecievedBy?: string;
    };
  }[];
}

export class DelhiveryIntegration implements ITransporterIntegration {
  name = 'Delhivery';
  code = 'DELHIVERY';

  private client: HttpClient;
  private credentials: TransporterCredentials;

  constructor(credentials: TransporterCredentials) {
    this.credentials = credentials;
    this.client = createHttpClient({
      baseURL: 'https://track.delhivery.com',
      timeout: 30000,
      headers: {
        'Authorization': `Token ${credentials.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async authenticate(): Promise<boolean> {
    // Delhivery uses token-based auth, no separate login needed
    // Just verify token works by making a test call
    try {
      const response = await this.client.get<{ status: boolean }>('/api/kinko/v1/invoice/charges/.json');
      return response.success;
    } catch {
      return false;
    }
  }

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    try {
      const shipmentData = {
        shipments: [
          {
            name: request.deliveryAddress.name,
            add: `${request.deliveryAddress.addressLine1}${request.deliveryAddress.addressLine2 ? ', ' + request.deliveryAddress.addressLine2 : ''}`,
            pin: request.deliveryAddress.pincode,
            city: request.deliveryAddress.city,
            state: request.deliveryAddress.state,
            country: request.deliveryAddress.country || 'India',
            phone: request.deliveryAddress.phone,
            order: request.orderNo,
            payment_mode: request.paymentMode === 'COD' ? 'COD' : 'Pre-paid',
            return_pin: request.pickupAddress.pincode,
            return_city: request.pickupAddress.city,
            return_phone: request.pickupAddress.phone,
            return_add: request.pickupAddress.addressLine1,
            return_state: request.pickupAddress.state,
            return_country: request.pickupAddress.country || 'India',
            return_name: request.pickupAddress.name,
            products_desc: request.items.map((i) => i.name).join(', '),
            hsn_code: request.items[0]?.hsn || '',
            cod_amount: request.paymentMode === 'COD' ? (request.codAmount || request.invoiceValue).toString() : '0',
            order_date: request.orderDate.toISOString(),
            total_amount: request.invoiceValue.toString(),
            seller_add: request.pickupAddress.addressLine1,
            seller_name: request.pickupAddress.name,
            seller_inv: request.invoiceNo || '',
            quantity: request.items.reduce((sum, i) => sum + i.quantity, 0).toString(),
            waybill: '', // Auto-assign
            shipment_width: (request.width || 10).toString(),
            shipment_height: (request.height || 10).toString(),
            weight: (request.weight * 1000).toString(), // Convert kg to grams
            seller_gst_tin: '',
            shipping_mode: 'Surface',
            address_type: 'home',
          },
        ],
        pickup_location: {
          name: this.credentials.vendorCode || 'Default',
        },
      };

      const formData = `format=json&data=${encodeURIComponent(JSON.stringify(shipmentData))}`;

      const response = await this.client.post<DelhiveryPackageResponse>(
        '/api/cmu/create.json',
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.success && response.data?.success && response.data.packages?.[0]?.waybill) {
        const pkg = response.data.packages[0];
        return {
          success: true,
          awbNo: pkg.waybill,
          courierName: 'Delhivery',
          shipmentId: pkg.waybill,
        };
      }

      return {
        success: false,
        error: response.data?.packages?.[0]?.remarks || response.error || 'Failed to create shipment',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async trackShipment(awbNo: string): Promise<TrackingResponse> {
    try {
      const response = await this.client.get<DelhiveryTrackingResponse>(
        `/api/v1/packages/json/?waybill=${awbNo}`
      );

      if (!response.success || !response.data?.ShipmentData?.[0]) {
        return {
          success: false,
          awbNo,
          error: response.error || 'Failed to get tracking info',
        };
      }

      const shipment = response.data.ShipmentData[0].Shipment;
      const scans = shipment.Scans || [];

      const events: TrackingEvent[] = scans.map((scan) => ({
        status: scan.ScanDetail.Scan,
        location: scan.ScanDetail.ScannedLocation,
        timestamp: new Date(scan.ScanDetail.ScanDateTime),
        remarks: scan.ScanDetail.Instructions,
      }));

      return {
        success: true,
        awbNo,
        currentStatus: shipment.Status.Status,
        currentStatusCode: shipment.Status.StatusCode,
        deliveredAt: shipment.DestRecieveDate ? new Date(shipment.DestRecieveDate) : undefined,
        deliveredTo: shipment.RecievedBy,
        events,
      };
    } catch (error) {
      return {
        success: false,
        awbNo,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async cancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse> {
    try {
      const response = await this.client.post<{ status: boolean; remark?: string }>(
        '/api/p/edit',
        {
          waybill: request.awbNo,
          cancellation: 'true',
        }
      );

      if (response.success && response.data?.status) {
        return {
          success: true,
          message: 'Shipment cancelled successfully',
        };
      }

      return {
        success: false,
        error: response.data?.remark || response.error || 'Failed to cancel shipment',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async checkPincodeServiceability(pincode: string): Promise<PincodeServiceability> {
    try {
      const response = await this.client.get<{
        delivery_codes: {
          postal_code: {
            pin: string;
            pre_paid: string;
            cash: string;
            cod: string;
            pickup: string;
            repl: string;
            is_oda: string;
            sort_code: string;
            district: string;
            state_code: string;
          };
        }[];
      }>(`/c/api/pin-codes/json/?filter_codes=${pincode}`);

      if (!response.success || !response.data?.delivery_codes?.[0]) {
        return {
          pincode,
          serviceable: false,
          codAvailable: false,
          prepaidAvailable: false,
        };
      }

      const data = response.data.delivery_codes[0].postal_code;

      return {
        pincode,
        serviceable: data.pre_paid === 'Y' || data.cod === 'Y',
        codAvailable: data.cod === 'Y' || data.cash === 'Y',
        prepaidAvailable: data.pre_paid === 'Y',
      };
    } catch {
      return {
        pincode,
        serviceable: false,
        codAvailable: false,
        prepaidAvailable: false,
      };
    }
  }

  async calculateRates(request: RateCalculationRequest): Promise<RateCalculationResponse> {
    try {
      const response = await this.client.get<{
        status: boolean;
        charges?: {
          charge: number;
          cod_charge?: number;
        };
      }>(
        `/api/kinko/v1/invoice/charges/.json?ss=Delivered&d_pin=${request.deliveryPincode}&o_pin=${request.pickupPincode}&cgm=${request.weight * 1000}&pt=${request.paymentMode === 'COD' ? 'COD' : 'Pre-paid'}&cod=${request.codAmount || 0}`
      );

      if (!response.success || !response.data?.charges) {
        return {
          success: false,
          error: response.error || 'Failed to calculate rates',
        };
      }

      return {
        success: true,
        rates: [
          {
            courierCode: 'DELHIVERY',
            courierName: 'Delhivery',
            rate: response.data.charges.charge,
            codCharges: response.data.charges.cod_charge,
            totalRate: response.data.charges.charge + (response.data.charges.cod_charge || 0),
          },
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async generateLabel(awbNo: string): Promise<{ success: boolean; labelUrl?: string; error?: string }> {
    try {
      const response = await this.client.get<{ packages: { pdf_download_link?: string }[] }>(
        `/api/p/packing_slip?wbns=${awbNo}&pdf=true`
      );

      if (response.success && response.data?.packages?.[0]?.pdf_download_link) {
        return {
          success: true,
          labelUrl: response.data.packages[0].pdf_download_link,
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
  }
}

// Factory function
export function createDelhiveryIntegration(credentials: TransporterCredentials): DelhiveryIntegration {
  return new DelhiveryIntegration(credentials);
}
