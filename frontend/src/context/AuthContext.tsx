/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { api } from '../services/api';
import { STORAGE_KEYS } from '../constants/storage';
import { devAutoLogin } from '../utils/devAutoLogin';

// Types
export interface User {
  id: number;
  public_id?: string;
  email: string;
  full_name?: string | null;
  skinType?: string;
  skinConcerns?: string[];
  preferences?: Record<string, unknown>;
  is_active?: boolean;
  is_verified?: boolean;
  is_admin?: boolean;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
  verification_required?: boolean;
  verification_token?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string, user: User) => void;
  register: (name: string, email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
const AUTH_ME_TIMEOUT_MS = 4000;

function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    delete axios.defaults.headers.common['Authorization'];
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await devAutoLogin();
      const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (storedToken) {
        setAuthToken(storedToken);
        const mePromise = api.get<User>('/auth/me').then((response) => {
          setUser(response.data);
          setToken(storedToken);
        }).catch(() => {
          setAuthToken(null);
          setToken(null);
          setUser(null);
        });
        const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, AUTH_ME_TIMEOUT_MS));
        await Promise.race([mePromise, timeoutPromise]);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      const { data } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
      setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'detail' in err && typeof (err as { detail: unknown }).detail === 'string'
        ? (err as { detail: string }).detail
        : err instanceof Error ? err.message : 'Login failed. Please try again.';
      throw new Error(msg);
    }
  }, []);

  const loginWithToken = useCallback((newToken: string, userData: User): void => {
    setAuthToken(newToken);
    setToken(newToken);
    setUser(userData);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', { full_name: name, email, password });
    if (!data.verification_required && data.token && data.user) {
      setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        loginWithToken,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
