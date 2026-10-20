import { endpoint, json } from '@/lib/ai-font/http';
import { adminClient } from '@/lib/ai-font/supabase';
import { verifyWaffoEvent } from '@/lib/ai-font/payments/waffo';

export async function POST(request: Request) {
  return endpoint(async () => {
    const event = await verifyWaffoEvent(request);
    if (event) {
      const { error } = await adminClient().rpc('ai_font_apply_waffo_event', { p_event: event });
      if (error) throw error; // Acknowledge only committed events; Waffo retries failures.
    }
    return json({ received: true });
  });
}
