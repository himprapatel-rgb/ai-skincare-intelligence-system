/**
 * Optimized API Client with Caching and Performance Enhancements
 * Reduces perceived slowness with smart caching and optimistic updates
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Optimized API Client with caching and performance features
 */
class OptimizedApiClient {
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
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add timestamp for performance tracking
        (config as any).requestStartTime = Date.now();
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - cache and performance tracking
    this.client.interceptors.response.use(
      (response) => {
        // Track response time
        const startTime = (response.config as any).requestStartTime;
        if (startTime) {
          const duration = Date.now() - startTime;
          console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
        }

        // Cache GET requests
        if (response.config.method?.toLowerCase() === 'get') {
          const cacheKey = this.getCacheKey(response.config);
          cache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now(),
          });
        }

        return response;
      },
      async (error) => {
        // Handle session expiration
        if (error.response?.status === 401) {
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          if (!window.location.pathname.startsWith('/auth')) {
            sessionStorage.setItem(STORAGE_KEYS.AUTH_RETURN_URL, window.location.pathname);
            window.location.href = '/auth';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getCacheKey(config: AxiosRequestConfig): string {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || '';
    return `${config.method}:${config.url}:${JSON.stringify(config.params)}:${token}`;
  }

  private isCacheValid(cacheKey: string): boolean {
    const cached = cache.get(cacheKey);
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    return age < CACHE_DURATION;
  }

  /**
   * GET request with caching
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const cacheKey = this.getCacheKey({ ...config, method: 'get', url });

    // Return cached data if valid
    if (this.isCacheValid(cacheKey)) {
      const cached = cache.get(cacheKey);
      console.log(`[Cache Hit] ${url}`);
      return cached!.data;
    }

    // Deduplicate concurrent requests
    if (pendingRequests.has(cacheKey)) {
      console.log(`[Dedup] ${url}`);
      return pendingRequests.get(cacheKey)!;
    }

    // Make request
    const promise = this.client.get<T>(url, config).then((res) => res.data);
    pendingRequests.set(cacheKey, promise);

    try {
      const data = await promise;
      return data;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }

  /**
   * POST request (no caching)
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    
    // Invalidate related cache entries
    this.invalidateCache(url);
    
    return response.data;
  }

  /**
   * PUT request (no caching)
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    this.invalidateCache(url);
    return response.data;
  }

  /**
   * PATCH request (no caching)
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    this.invalidateCache(url);
    return response.data;
  }

  /**
   * DELETE request (no caching)
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    this.invalidateCache(url);
    return response.data;
  }

  /**
   * Invalidate cache entries matching URL pattern
   */
  private invalidateCache(urlPattern: string) {
    const keysToDelete: string[] = [];
    
    for (const key of cache.keys()) {
      if (key.includes(urlPattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`[Cache Invalidated] ${keysToDelete.length} entries for ${urlPattern}`);
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    cache.clear();
    console.log('[Cache] Cleared all cache');
  }

  /**
   * Get raw axios client
   */
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const optimizedApi = new OptimizedApiClient();
export const apiOptimized = optimizedApi.getClient();
