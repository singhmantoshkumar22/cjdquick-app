export * from './types';
export * from './shiprocket';
export * from './delhivery';
export * from './bluedart';
export * from './ekart';
export * from './shadowfax';
export * from './dtdc';
export * from './ecomexpress';
export * from './xpressbees';

import { ITransporterIntegration, TransporterCredentials } from './types';
import { createShiprocketIntegration } from './shiprocket';
import { createDelhiveryIntegration } from './delhivery';
import { createBlueDartIntegration } from './bluedart';
import { createEkartIntegration } from './ekart';
import { createShadowfaxIntegration } from './shadowfax';
import { createDTDCIntegration } from './dtdc';
import { createEcomExpressIntegration } from './ecomexpress';
import { createXpressbeesIntegration } from './xpressbees';

export type TransporterCode =
  | 'SHIPROCKET'
  | 'DELHIVERY'
  | 'BLUEDART'
  | 'EKART'
  | 'SHADOWFAX'
  | 'DTDC'
  | 'ECOM_EXPRESS'
  | 'XPRESSBEES';

export function createTransporterIntegration(
  code: TransporterCode,
  credentials: TransporterCredentials
): ITransporterIntegration {
  switch (code) {
    case 'SHIPROCKET':
      return createShiprocketIntegration(credentials);
    case 'DELHIVERY':
      return createDelhiveryIntegration(credentials);
    case 'BLUEDART':
      return createBlueDartIntegration(credentials);
    case 'EKART':
      return createEkartIntegration(credentials);
    case 'SHADOWFAX':
      return createShadowfaxIntegration(credentials);
    case 'DTDC':
      return createDTDCIntegration(credentials);
    case 'ECOM_EXPRESS':
      return createEcomExpressIntegration(credentials);
    case 'XPRESSBEES':
      return createXpressbeesIntegration(credentials);
    default:
      throw new Error(`Unknown transporter code: ${code}`);
  }
}
