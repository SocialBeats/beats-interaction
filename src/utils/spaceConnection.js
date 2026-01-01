import { SpaceClient, connect } from 'space-node-client';

export const spaceClient = isPricingEnabled()
  ? connect({
      url: process.env.SPACE_URL || 'http://localhost:5403',
      apiKey: process.env.SPACE_API_KEY,
    })
  : undefined;

export function isPricingEnabled() {
  return process.env.ENABLE_PRICING.toLocaleLowerCase() === 'true';
}
