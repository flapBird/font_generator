export type PaymentOrder = {
  id: string;
  user_id: string;
  provider: string;
  external_id: string | null;
  capture_id: string | null;
  amount_minor: number;
  currency: string;
  credits: number;
  status: 'pending' | 'paid' | 'revoked';
};

export type PaymentReceipt = { externalId: string; captureId: string };
export type PaymentEvent =
  | { kind: 'approved' | 'paid'; externalId: string }
  | { kind: 'revoked'; captureId: string; externalId: string }
  | { kind: 'ignored' };

// Providers own API/auth/webhook details; the application owns prices, orders
// and the transactional credit ledger. Add a provider without changing jobs.
export interface PaymentProvider {
  id: string;
  createCheckout(order: PaymentOrder): Promise<{ externalId: string; approvalUrl: string }>;
  complete(order: PaymentOrder): Promise<PaymentReceipt | null>;
  verifyWebhook(request: Request): Promise<PaymentEvent>;
}
