/* eslint-disable no-console -- dev-only utility */
// Development Auto-Login Utility
// Automatically logs in as test user "Himanshu" for development
// Uses same API as production (config.ts) so all viewports share one backend.

import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';

const DEV_TEST_USER = {
  email: 'himanshu@test.com',
  password: 'Test1234!',
  name: 'Himanshu Patel'
};

/**
 * Auto-login as test user during development
 * Only runs if no existing auth token is found
 */
export async function devAutoLogin(): Promise<boolean> {
  // Only run in development mode
  if (import.meta.env.PROD) {
    return false;
  }

  // Check if already logged in (same key as AuthContext / api.ts)
  const existingToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (existingToken) {
    console.log('✅ Already logged in');
    return true;
  }

  try {
    console.log('🔄 Auto-logging in as test user:', DEV_TEST_USER.email);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: DEV_TEST_USER.email, password: DEV_TEST_USER.password }),
    });

    if (!response.ok) {
      console.warn('⚠️ Auto-login failed:', response.statusText);
      return false;
    }

    const data = await response.json();
    const newToken = data.token;
    const userData = data.user;

    if (!newToken) {
      console.warn('⚠️ Auto-login: no token in response');
      return false;
    }

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
    if (userData) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

    console.log('✅ Auto-login successful! Logged in as:', DEV_TEST_USER.name);
    return true;
  } catch (error) {
    console.error('❌ Auto-login error:', error);
    return false;
  }
}

/**
 * Get current dev user info
 */
export function getDevUser() {
  return DEV_TEST_USER;
}

/**
 * Check if auto-login is enabled
 */
export function isAutoLoginEnabled(): boolean {
  return !import.meta.env.PROD;
}
