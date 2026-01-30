/**
 * Shared app config. Single source of truth for API base URL.
 * Set VITE_API_URL in .env for local/staging/production.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://pellicura-api.fly.dev/api/v1';
