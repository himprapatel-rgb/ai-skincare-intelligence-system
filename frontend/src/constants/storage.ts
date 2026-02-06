/**
 * Local/session storage keys. Single source of truth to avoid typos and simplify refactors.
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  ACCESS_TOKEN: 'access_token',
  USER: 'user',
  AUTH_RETURN_URL: 'auth_return_url',
  SESSION_EXPIRED_REDIRECT: 'session_expired_redirect',
  APP_THEME: 'app-theme',
  DIGITAL_TWIN_RANGE: 'digital_twin_range',
  REMEMBER_EMAIL: 'login_remember_email',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
