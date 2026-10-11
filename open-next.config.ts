import type { IncrementalCache } from '@opennextjs/aws/types/overrides.js';
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

// Content pages are built once per deployment; HTTP requests use the Next.js handler.
// No ISR or on-demand revalidation is used, so no R2/DO cache is needed.
//
// Deployments are immutable, so runtime cache writes can never succeed and the
// stock override logs an error for every unknown-path request (bot probes).
// Reads still go through the stock cache; writes are silent no-ops.
const incrementalCache: IncrementalCache = {
  name: staticAssetsIncrementalCache.name,
  get: (key, cacheType) => staticAssetsIncrementalCache.get(key, cacheType),
  set: async () => {},
  delete: async () => {},
};

export default defineCloudflareConfig({
  incrementalCache,
  enableCacheInterception: true,
});
