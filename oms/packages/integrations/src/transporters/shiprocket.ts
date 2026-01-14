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

interface ShiprocketAuthResponse {
  token: string;
  expires_at?: string;
}

interface ShiprocketTrackingResponse {
  tracking_data: {
    track_status: number;
    shipment_status: number;
    shipment_track: {
      id: number;
      awb_code: string;
      courier_company_id: number;
      shipment_id: number;
      order_id: number;
      pickup_date: string;
      delivered_date: string;
      weight: string;
      packages: number;
      current_status: string;
      delivered_to: string;
      destination: string;
      consignee_name: string;
      origin: string;
      courier_agent_details: string;
      edd: string;
    }[];
    shipment_track_activities: {
      date: string;
      status: string;
      activity: string;
      location: string;
      sr_status: string;
      sr_status_label: string;
    }[];
  };
}

export class ShiprocketIntegration implements ITransporterIntegration {
  name = 'Shiprocket';
  code = 'SHIPROCKET';

  private client: HttpClient;
  private credentials: TransporterCredentials;
  private token: string | null = null;

  constructor(credentials: TransporterCredentials) {
    this.credentials = credentials;
    this.client = createHttpClient({
      baseURL: 'https://apiv2.shiprocket.in/v1/external',
      timeout: 30000,
    });
  }

  async authenticate(): Promise<boolean> {
    const response = await this.client.post<ShiprocketAuthResponse>('/auth/login', {
      email: this.credentials.apiKey,
      password: this.credentials.apiSecret,
    });

    if (response.success && response.data?.token) {
      this.token = response.data.token;
      this.client.setHeader('Authorization', `Bearer ${this.token}`);
      return true;
    }

    console.error('[Shiprocket] Authentication failed:', response.error);
    return false;
  }

  async refreshToken(): Promise<boolean> {
    return this.authenticate();
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.token) {
      const success = await this.authenticate();
      if (!success) {
        throw new Error('Shiprocket authentication failed');
      }
    }
  }

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    try {
      await this.ensureAuthenticated();

      // First, create an order
      const orderPayload = {
        order_id: request.orderNo,
        order_date: request.orderDate.toISOString().split('T')[0],
        pickup_location: 'Primary',
        channel_id: '',
        comment: request.remarks || '',
        billing_customer_name: request.deliveryAddress.name.split(' ')[0],
        billing_last_name: request.deliveryAddress.name.split(' ').slice(1).join(' ') || '',
        billing_address: request.deliveryAddress.addressLine1,
        billing_address_2: request.deliveryAddress.addressLine2 || '',
        billing_city: request.deliveryAddress.city,
        billing_pincode: request.deliveryAddress.pincode,
        billing_state: request.deliveryAddress.state,
        billing_country: request.deliveryAddress.country || 'India',
        billing_email: request.deliveryAddress.email || '',
        billing_phone: request.deliveryAddress.phone,
        shipping_is_billing: true,
        order_items: request.items.map((item) => ({
          name: item.name,
          sku: item.skuCode,
          units: item.quantity,
          selling_price: item.unitPrice.toString(),
          discount: '0',
          tax: '0',
          hsn: item.hsn || '',
        })),
        payment_method: request.paymentMode === 'COD' ? 'COD' : 'Prepaid',
        sub_total: request.invoiceValue,
        length: request.length || 10,
        breadth: request.width || 10,
        height: request.height || 10,
        weight: request.weight,
      };

      const orderResponse = await this.client.post<{ order_id: number; shipment_id: number }>(
        '/orders/create/adhoc',
        orderPayload
      );

      if (!orderResponse.success || !orderResponse.data?.order_id) {
        return {
          success: false,
          error: orderResponse.error || 'Failed to create order',
        };
      }

      // Now assign AWB
      const awbPayload = {
        shipment_id: orderResponse.data.shipment_id,
      };

      const awbResponse = await this.client.post<{
        awb_assign_status: number;
        response: {
          data: {
            awb_code: string;
            courier_company_id: number;
            courier_name: string;
          };
        };
      }>('/courier/assign/awb', awbPayload);

      if (awbResponse.success && awbResponse.data?.response?.data?.awb_code) {
        // Generate label
        const labelResponse = await this.client.post<{
          label_url?: string;
        }>('/courier/generate/label', {
          shipment_id: [orderResponse.data.shipment_id],
        });

        return {
          success: true,
          awbNo: awbResponse.data.response.data.awb_code,
          courierName: awbResponse.data.response.data.courier_name,
          shipmentId: orderResponse.data.shipment_id.toString(),
          labelUrl: labelResponse.data?.label_url,
        };
      }

      return {
        success: false,
        error: awbResponse.error || 'Failed to assign AWB',
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
      await this.ensureAuthenticated();

      const response = await this.client.get<ShiprocketTrackingResponse>(
        `/courier/track/awb/${awbNo}`
      );

      if (!response.success || !response.data?.tracking_data) {
        return {
          success: false,
          awbNo,
          error: response.error || 'Failed to get tracking info',
        };
      }

      const trackingData = response.data.tracking_data;
      const shipment = trackingData.shipment_track?.[0];
      const activities = trackingData.shipment_track_activities || [];

      const events: TrackingEvent[] = activities.map((activity) => ({
        status: activity.sr_status_label || activity.status,
        statusCode: activity.sr_status,
        location: activity.location,
        timestamp: new Date(activity.date),
        remarks: activity.activity,
      }));

      return {
        success: true,
        awbNo,
        currentStatus: shipment?.current_status || activities[0]?.sr_status_label,
        deliveredAt: shipment?.delivered_date ? new Date(shipment.delivered_date) : undefined,
        deliveredTo: shipment?.delivered_to,
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
      await this.ensureAuthenticated();

      const response = await this.client.post<{ status: number; message: string }>(
        '/orders/cancel',
        {
          ids: [request.awbNo],
        }
      );

      if (response.success && response.data?.status === 1) {
        return {
          success: true,
          message: response.data.message || 'Shipment cancelled successfully',
        };
      }

      return {
        success: false,
        error: response.error || response.data?.message || 'Failed to cancel shipment',
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
      await this.ensureAuthenticated();

      const response = await this.client.get<{
        status: number;
        data: {
          available_courier_companies: {
            id: number;
            name: string;
            cod: number;
            etd: string;
          }[];
        };
      }>(`/courier/serviceability/?pickup_postcode=110001&delivery_postcode=${pincode}&weight=1&cod=1`);

      if (!response.success || !response.data?.data?.available_courier_companies) {
        return {
          pincode,
          serviceable: false,
          codAvailable: false,
          prepaidAvailable: false,
        };
      }

      const couriers = response.data.data.available_courier_companies;
      const hasCod = couriers.some((c) => c.cod === 1);

      return {
        pincode,
        serviceable: couriers.length > 0,
        codAvailable: hasCod,
        prepaidAvailable: couriers.length > 0,
        estimatedDays: couriers[0]?.etd ? parseInt(couriers[0].etd) : undefined,
        courierCodes: couriers.map((c) => c.name),
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
      await this.ensureAuthenticated();

      const response = await this.client.get<{
        status: number;
        data: {
          available_courier_companies: {
            id: number;
            name: string;
            freight_charge: number;
            cod_charges: number;
            etd: string;
          }[];
        };
      }>(
        `/courier/serviceability/?pickup_postcode=${request.pickupPincode}&delivery_postcode=${request.deliveryPincode}&weight=${request.weight}&cod=${request.paymentMode === 'COD' ? 1 : 0}`
      );

      if (!response.success || !response.data?.data?.available_courier_companies) {
        return {
          success: false,
          error: response.error || 'Failed to calculate rates',
        };
      }

      const rates = response.data.data.available_courier_companies.map((courier) => ({
        courierCode: courier.id.toString(),
        courierName: courier.name,
        rate: courier.freight_charge,
        codCharges: courier.cod_charges,
        totalRate: courier.freight_charge + (courier.cod_charges || 0),
        estimatedDays: parseInt(courier.etd) || undefined,
      }));

      return {
        success: true,
        rates,
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
      await this.ensureAuthenticated();

      const response = await this.client.post<{ label_url?: string; label_created: number }>(
        '/courier/generate/label',
        { shipment_id: [awbNo] }
      );

      if (response.success && response.data?.label_url) {
        return {
          success: true,
          labelUrl: response.data.label_url,
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

  async generateManifest(shipmentIds: string[]): Promise<{ success: boolean; manifestUrl?: string; error?: string }> {
    try {
      await this.ensureAuthenticated();

      const response = await this.client.post<{ manifest_url?: string; status: number }>(
        '/manifests/generate',
        { shipment_id: shipmentIds.map(Number) }
      );

      if (response.success && response.data?.manifest_url) {
        return {
          success: true,
          manifestUrl: response.data.manifest_url,
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
  }
}

// Factory function
export function createShiprocketIntegration(credentials: TransporterCredentials): ShiprocketIntegration {
  return new ShiprocketIntegration(credentials);
}
