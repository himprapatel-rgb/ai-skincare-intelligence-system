/**
 * Shared app config. Single source of truth for API base URL.
 * All viewports (desktop / tablet / mobile) use this same API and database.
 * Set VITE_API_URL in .env for local/staging/production.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';

/** Base URL for uploads (same origin as API, /uploads path). Only allows relative paths. */
export function getUploadFullUrl(relativePath: string): string {
  const trimmed = (relativePath || '').trim();
  if (!trimmed || trimmed.startsWith('http:') || trimmed.startsWith('https:') || trimmed.startsWith('//') || trimmed.startsWith('data:') || /^\s*javascript:/i.test(trimmed)) {
    return trimmed || '';
  }
  try {
    const origin = new URL(API_BASE_URL).origin;
    return trimmed.startsWith('/') ? `${origin}${trimmed}` : `${origin}/${trimmed}`;
  } catch {
    return trimmed;
  }
}

/** Social media URLs. Set VITE_SOCIAL_* in .env to override (e.g. VITE_SOCIAL_INSTAGRAM=https://instagram.com/pellicura). */
export const SOCIAL_LINKS = {
  instagram: import.meta.env.VITE_SOCIAL_INSTAGRAM || 'https://instagram.com',
  x: import.meta.env.VITE_SOCIAL_X || 'https://x.com',
  tiktok: import.meta.env.VITE_SOCIAL_TIKTOK || 'https://tiktok.com',
  linkedin: import.meta.env.VITE_SOCIAL_LINKEDIN || 'https://linkedin.com',
};
