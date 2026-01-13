export * from './types';
export * from './shiprocket';
export * from './delhivery';

import { ITransporterIntegration, TransporterCredentials } from './types';
import { createShiprocketIntegration } from './shiprocket';
import { createDelhiveryIntegration } from './delhivery';

export type TransporterCode = 'SHIPROCKET' | 'DELHIVERY';

export function createTransporterIntegration(
  code: TransporterCode,
  credentials: TransporterCredentials
): ITransporterIntegration {
  switch (code) {
    case 'SHIPROCKET':
      return createShiprocketIntegration(credentials);
    case 'DELHIVERY':
      return createDelhiveryIntegration(credentials);
    default:
      throw new Error(`Unknown transporter code: ${code}`);
  }
}
