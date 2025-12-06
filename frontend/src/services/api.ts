import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiError } from '../types/scan';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app';

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
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        const apiError: ApiError = {
          detail: error.response?.data?.detail || error.message || 'An unexpected error occurred',
          status: error.response?.status || 500,
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
