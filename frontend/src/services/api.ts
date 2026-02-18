import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiError } from '../types/scan';
import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(error: AxiosError): boolean {
  const status = error.response?.status;
  if (status && status >= 400 && status < 500 && status !== 408) return false;
  return true;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const config = error.config as ({ _retryCount?: number } & typeof error.config) | undefined;
        if (!config) {
          return Promise.reject({ detail: error.message || 'Request failed', status: 0, timestamp: new Date().toISOString() } as ApiError);
        }
        config._retryCount = config._retryCount ?? 0;
        if (config._retryCount < MAX_RETRIES && shouldRetry(error)) {
          config._retryCount += 1;
          const wait = INITIAL_DELAY_MS * Math.pow(2, config._retryCount - 1);
          await delay(wait);
          return this.client.request(config);
        }
        const status = error.response?.status ?? (error.code === 'ERR_NETWORK' ? 0 : 500);
        const rawDetail = error.response?.data?.detail;
        let detail: string;
        if (typeof rawDetail === 'string' && rawDetail.trim()) {
          detail = rawDetail;
        } else if (Array.isArray(rawDetail) && rawDetail.length > 0) {
          const first = rawDetail[0];
          detail = typeof first === 'object' && first !== null && 'msg' in first
            ? String((first as { msg: unknown }).msg)
            : String(first);
        } else {
          detail = error.message || 'An unexpected error occurred';
        }
        if (status === 429) {
          detail = 'Too many requests. Please try again in a few minutes.';
        } else if (status === 0 || error.code === 'ERR_NETWORK') {
          detail = 'We couldn\'t reach the server. Check your connection and try again — or the service may be temporarily unavailable (try again in a moment).';
        } else if (status === 401) {
          const isAuthRequest = config.url && (/\/auth\/login\/?$/.test(config.url) || /\/auth\/register\/?$/.test(config.url));
          if (isAuthRequest) {
            /* Keep server message for wrong credentials (e.g. "Invalid email or password") */
          } else {
            detail = 'Session expired. Please sign in again.';
            try {
              localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
              if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
                sessionStorage.setItem(STORAGE_KEYS.SESSION_EXPIRED_REDIRECT, '1');
                const returnUrl = window.location.pathname + window.location.search;
                sessionStorage.setItem(STORAGE_KEYS.AUTH_RETURN_URL, returnUrl);
                window.location.href = '/auth';
              }
            } catch {
              /* ignore */
            }
          }
        } else if (status === 403) {
          detail = detail || "You don't have permission to do that.";
        }
        const apiError: ApiError = {
          detail,
          status,
          timestamp: new Date().toISOString(),
        };
        return Promise.reject(apiError);
      }
    );
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().getClient();
export const api = apiClient;  // Alias for backward compatibility
