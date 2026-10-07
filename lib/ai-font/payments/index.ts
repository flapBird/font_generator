import 'server-only';
import { WaffoProvider } from './waffo';
import { PayPalProvider } from './paypal';
import type { PaymentProvider } from './types';

const providers: Record<string, PaymentProvider> = { paypal: new PayPalProvider(), waffo: new WaffoProvider() };
export function paymentProvider(id: string) {
  const provider = providers[id];
  if (!provider || !Object.hasOwn(providers, id)) throw new Error('Unsupported payment provider');
  return provider;
}
