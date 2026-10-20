// Customer credits are independent of the upstream provider's billing units.
export const STANDARD_FONT_CREDITS = 100;
export function availableGenerations(credits: number) {
  return Math.max(0, Math.floor(credits / STANDARD_FONT_CREDITS));
}

export const FONT_PACK = {
  id: 'english-starter',
  name: 'AI Font Starter Pack',
  amountMinor: 499,
  currency: 'USD',
  credits: 300,
} as const;

export const FONT_SAMPLES = [
  { id: 'playful', name: 'Playful', family: '"Luckiest Guy", cursive', prompt: 'A playful, chunky font with rounded corners for a neighborhood bakery.' },
  { id: 'editorial', name: 'Editorial', family: '"EB Garamond", serif', prompt: 'An elegant high-contrast serif for book covers and editorial headlines.' },
  { id: 'arcade', name: 'Arcade', family: '"Pixelify Sans", monospace', prompt: 'A retro pixel display typeface for arcade game titles, with a consistent square grid and readable English letters.' },
  { id: 'bold', name: 'Bold', family: '"Anton", sans-serif', prompt: 'A bold condensed sans serif for poster headlines with strong vertical strokes and readable English letters.' },
] as const;

export type FontJob = {
  id: string;
  prompt: string;
  status: 'reserved' | 'starting' | 'processing' | 'needs_review' | 'succeeded' | 'failed';
  name: string | null;
  created_at: string;
};

export function validatePrompt(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 10 || value.trim().length > 1000) {
    throw new Error('Describe your font in 10–1,000 characters.');
  }
  return value.trim();
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
