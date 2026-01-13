// Common types for all transporter integrations

export interface TransporterCredentials {
  apiKey?: string;
  apiSecret?: string;
  clientId?: string;
  accessToken?: string;
  refreshToken?: string;
  accountCode?: string;
  vendorCode?: string;
}

export interface ShipmentAddress {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

export interface ShipmentItem {
  skuCode: string;
  name: string;
  quantity: number;
  unitPrice: number;
  weight?: number;
  hsn?: string;
}

export interface CreateShipmentRequest {
  orderId: string;
  orderNo: string;
  orderDate: Date;
  paymentMode: 'PREPAID' | 'COD';
  codAmount?: number;

  // Pickup address
  pickupAddress: ShipmentAddress;

  // Delivery address
  deliveryAddress: ShipmentAddress;

  // Package details
  weight: number;        // in kg
  length?: number;       // in cm
  width?: number;        // in cm
  height?: number;       // in cm
  items: ShipmentItem[];

  // Invoice details
  invoiceNo?: string;
  invoiceDate?: Date;
  invoiceValue: number;

  // Additional info
  deliveryType?: 'FORWARD' | 'REVERSE';
  serviceType?: 'EXPRESS' | 'STANDARD' | 'ECONOMY';
  remarks?: string;
}

export interface CreateShipmentResponse {
  success: boolean;
  awbNo?: string;
  courierName?: string;
  shipmentId?: string;
  labelUrl?: string;
  invoiceUrl?: string;
  estimatedDelivery?: Date;
  error?: string;
  errorCode?: string;
}

export interface TrackingEvent {
  status: string;
  statusCode?: string;
  location?: string;
  timestamp: Date;
  remarks?: string;
}

export interface TrackingResponse {
  success: boolean;
  awbNo: string;
  currentStatus?: string;
  currentStatusCode?: string;
  deliveredAt?: Date;
  deliveredTo?: string;
  events?: TrackingEvent[];
  error?: string;
}

export interface PincodeServiceability {
  pincode: string;
  serviceable: boolean;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  estimatedDays?: number;
  courierCodes?: string[];
}

export interface CancelShipmentRequest {
  awbNo: string;
  reason?: string;
}

export interface CancelShipmentResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface RateCalculationRequest {
  pickupPincode: string;
  deliveryPincode: string;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  paymentMode: 'PREPAID' | 'COD';
  codAmount?: number;
}

export interface RateCalculationResponse {
  success: boolean;
  rates?: {
    courierCode: string;
    courierName: string;
    rate: number;
    codCharges?: number;
    fuelSurcharge?: number;
    totalRate: number;
    estimatedDays?: number;
  }[];
  error?: string;
}

// Interface that all transporter integrations must implement
export interface ITransporterIntegration {
  name: string;
  code: string;

  // Authentication
  authenticate(): Promise<boolean>;
  refreshToken?(): Promise<boolean>;

  // Core operations
  createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse>;
  trackShipment(awbNo: string): Promise<TrackingResponse>;
  cancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse>;

  // Optional operations
  checkPincodeServiceability?(pincode: string): Promise<PincodeServiceability>;
  calculateRates?(request: RateCalculationRequest): Promise<RateCalculationResponse>;
  generateLabel?(awbNo: string): Promise<{ success: boolean; labelUrl?: string; error?: string }>;
  generateManifest?(awbNos: string[]): Promise<{ success: boolean; manifestUrl?: string; error?: string }>;
}
