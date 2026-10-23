export async function scheduled(_controller, env) {
  // The free site can be deployed without configuring the optional AI module.
  const required = [
    'AI_FONT_APP_URL', 'AI_FONT_CRON_SECRET', 'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  if (required.some((name) => !env[name]?.trim())) return;
  const hasBilling = ['WAFFO_MERCHANT_ID', 'WAFFO_PRIVATE_KEY', 'WAFFO_STORE_ID', 'WAFFO_PRODUCT_ID'].every(name => env[name]?.trim());
  const hasMail = ['INBOX_URL', 'INBOX_SEND_API_KEY', 'INBOX_FROM_EMAIL', 'INBOX_FROM_NAME'].every(name => env[name]?.trim());
  if (!env.MIXFONT_API_KEY?.trim() && !hasBilling && !hasMail) return;

  // A service binding avoids public DNS, domain setup and an external scheduler.
  const url = new URL('/api/ai-font/reconcile', env.AI_FONT_APP_URL);
  const response = await env.WORKER_SELF_REFERENCE.fetch(new Request(url, {
    headers: { Authorization: `Bearer ${env.AI_FONT_CRON_SECRET.trim()}` },
    // Allow the bounded-memory batch to finish within Cron's 15-minute wall limit.
    signal: AbortSignal.timeout(600_000),
  }));
  if (!response.ok) throw new Error(`AI font reconciliation failed: HTTP ${response.status}`);

  const result = await response.json();
  if (typeof result.errors !== 'number' || result.errors !== 0) {
    throw new Error('AI font reconciliation reported errors; inspect jobs, billing and mail queues.');
  }
}
