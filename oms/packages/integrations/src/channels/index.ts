export * from './types';
export * from './shopify';
export * from './flipkart';
export * from './amazon';

import { IChannelIntegration, ChannelCredentials } from './types';
import { createShopifyIntegration } from './shopify';
import { createFlipkartIntegration } from './flipkart';
import { createAmazonIntegration } from './amazon';

export type ChannelCode = 'SHOPIFY' | 'FLIPKART' | 'AMAZON' | 'WOOCOMMERCE';

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
    case 'WOOCOMMERCE':
      // WooCommerce integration to be implemented
      throw new Error('WooCommerce integration not yet implemented');
    default:
      throw new Error(`Unknown channel code: ${code}`);
  }
}
