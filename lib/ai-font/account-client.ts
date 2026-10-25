'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { accountResource, fetchAccount, refreshAccount } from './account-resource';
export { fetchAccount, refreshAccount } from './account-resource';
export type { AccountData } from './account-resource';

export function useAccount() {
  const value = useSyncExternalStore(accountResource.subscribe, accountResource.getSnapshot, accountResource.getServerSnapshot);
  useEffect(() => { void fetchAccount().catch(() => {}); }, []);
  return { ...value, refresh: refreshAccount };
}
