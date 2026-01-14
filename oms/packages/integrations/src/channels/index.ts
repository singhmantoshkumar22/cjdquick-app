export * from './types';
export * from './shopify';
export * from './flipkart';
export * from './amazon';
export * from './myntra';
export * from './ajio';
export * from './meesho';
export * from './nykaa';
export * from './tatacliq';
export * from './jiomart';

import { IChannelIntegration, ChannelCredentials } from './types';
import { createShopifyIntegration } from './shopify';
import { createFlipkartIntegration } from './flipkart';
import { createAmazonIntegration } from './amazon';
import { createMyntraIntegration } from './myntra';
import { createAjioIntegration } from './ajio';
import { createMeeshoIntegration } from './meesho';
import { createNykaaIntegration } from './nykaa';
import { createTataCliqIntegration } from './tatacliq';
import { createJioMartIntegration } from './jiomart';

export type ChannelCode =
  | 'SHOPIFY'
  | 'FLIPKART'
  | 'AMAZON'
  | 'WOOCOMMERCE'
  | 'MYNTRA'
  | 'AJIO'
  | 'MEESHO'
  | 'NYKAA'
  | 'TATA_CLIQ'
  | 'JIOMART';

export function createChannelIntegration(
  code: ChannelCode,
  credentials: ChannelCredentials
): IChannelIntegration {
  switch (code) {
    case 'SHOPIFY':
      return createShopifyIntegration(credentials);
    case 'FLIPKART':
      return createFlipkartIntegration(credentials);
    case 'AMAZON':
      return createAmazonIntegration(credentials);
    case 'MYNTRA':
      return createMyntraIntegration(credentials);
    case 'AJIO':
      return createAjioIntegration(credentials);
    case 'MEESHO':
      return createMeeshoIntegration(credentials);
    case 'NYKAA':
      return createNykaaIntegration(credentials);
    case 'TATA_CLIQ':
      return createTataCliqIntegration(credentials);
    case 'JIOMART':
      return createJioMartIntegration(credentials);
    case 'WOOCOMMERCE':
      throw new Error('WooCommerce integration not yet implemented');
    default:
      throw new Error(`Unknown channel code: ${code}`);
  }
}
