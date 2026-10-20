// Only local page paths are accepted. OAuth callbacks never redirect to an
// arbitrary URL, API endpoint or another authentication flow.
export function authReturnPath(value: unknown) {
  if (typeof value !== 'string' || !/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]*$/.test(value)) return '/ai-font-generator';
  if (/^\/(api|login)(\/|$)/.test(value) || value.includes('/auth/')) return '/ai-font-generator';
  return value;
}

export const authChangedEvent = 'font-generators-auth-changed';
export const authReturnCookie = 'fg_auth_return';
export const authCallbackPath = '/ai-font-generator/auth/callback';
