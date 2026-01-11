import { api } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data),
  
  logout: () => api.post('/auth/logout'),
  
  refreshToken: () => api.post<AuthResponse>('/auth/refresh'),
  
  getCurrentUser: () => api.get('/auth/me'),
};
