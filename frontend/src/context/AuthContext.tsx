/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
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

import { API_BASE_URL } from '../config';

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Try auto-login in development (if no token exists)
      await devAutoLogin();
      
      const storedToken = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      if (storedToken) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          const response = await axios.get(`${API_URL}/auth/me`);
          setUser(response.data);
          setToken(storedToken);
        } catch {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('access_token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('auth_token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      console.error('AuthContext login error:', error);
      throw error; // Re-throw to let LoginForm handle it
    }
  };

  const loginWithToken = (newToken: string, userData: User): void => {
    localStorage.setItem('auth_token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
  };

  const register = async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      full_name: name,
      email,
      password,
    });
    const data: AuthResponse = response.data;
    if (!data.verification_required) {
      const { token: newToken, user: userData } = data;
      localStorage.setItem('auth_token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(userData);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

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
