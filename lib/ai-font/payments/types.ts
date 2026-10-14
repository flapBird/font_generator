export type PaymentOrder = {
  id: string;
  created_at?: string;
  checkout_url?: string | null;
  checkout_expires_at?: string | null;
  user_id: string;
  provider: string;
  provider_environment?: string | null;
  provider_order_id?: string | null;
  billing_claim_token?: string | null;
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
  createCheckout(order: PaymentOrder): Promise<{ externalId: string; approvalUrl: string; expiresAt?: string }>;
  complete(order: PaymentOrder): Promise<PaymentReceipt | null>;
  verifyWebhook(request: Request): Promise<PaymentEvent>;
}
