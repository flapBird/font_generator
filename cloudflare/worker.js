import handler from '../.open-next/worker.js';
import { scheduled } from './reconcile.mjs';

// OpenNext owns HTTP handling; Cloudflare Cron keeps paid jobs moving offline.
const worker = {
  fetch: handler.fetch,
  scheduled,
};

export default worker;
