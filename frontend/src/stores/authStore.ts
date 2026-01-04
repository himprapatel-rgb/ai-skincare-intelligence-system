import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  skinType?: string;
}

export interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // API Methods
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  validateToken: () => Promise<boolean>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const useAuthStore = create<AuthState>()(n  persist(
    (set, get) => ({
      // Initial State
      user: null,
      token: localStorage.getItem('auth_token'),
      isLoading: false,
      error: null,
      isAuthenticated: !!localStorage.getItem('auth_token'),

      // Setters
      setUser: (user) => set({ user }),
      setToken: (token) => {
        set({ token });
        if (token) {
          localStorage.setItem('auth_token', token);
        } else {
          localStorage.removeItem('auth_token');
        }
      },
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // API Methods
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email,
            password,
          });
          
          const { access_token, user } = response.data;
          
          set({
            token: access_token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          
          localStorage.setItem('auth_token', access_token);
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Login failed';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (email, password, username) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/register`, {
            email,
            password,
            username,
          });
          
          const { access_token, user } = response.data;
          
          set({
            token: access_token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          
          localStorage.setItem('auth_token', access_token);
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Registration failed';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        localStorage.removeItem('auth_token');
      },

      refreshToken: async () => {
        const { token } = get();
        if (!token) return;
        
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            token,
          });
          
          const { access_token } = response.data;
          set({ token: access_token });
          localStorage.setItem('auth_token', access_token);
        } catch (error) {
          set({ token: null, isAuthenticated: false });
          localStorage.removeItem('auth_token');
          throw error;
        }
      },

      validateToken: async () => {
        const { token } = get();
        if (!token) return false;
        
        try {
          await axios.get(`${API_BASE_URL}/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          return true;
        } catch (error) {
          set({ token: null, isAuthenticated: false });
          localStorage.removeItem('auth_token');
          return false;
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
