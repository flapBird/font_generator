import 'server-only';
import { PayPalProvider } from './paypal';
import type { PaymentProvider } from './types';

const providers: Record<string, PaymentProvider> = { paypal: new PayPalProvider() };
export function paymentProvider(id: string) {
  const provider = providers[id];
  if (!provider || !Object.hasOwn(providers, id)) throw new Error('Unsupported payment provider');
  return provider;
}
