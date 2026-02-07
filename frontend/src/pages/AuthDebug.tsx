/**
 * Auth Debug Page - Diagnose Login Issues
 * Shows exactly what's happening with authentication
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';

export const AuthDebug: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<string>('');

  const getErrorSummary = (err: unknown): string => {
    if (err && typeof err === 'object') {
      const maybeError = err as { response?: { status?: number; data?: { detail?: unknown } }; message?: unknown };
      const status = typeof maybeError.response?.status === 'number' ? maybeError.response.status : 'unknown';
      const detail = typeof maybeError.response?.data?.detail === 'string'
        ? maybeError.response.data.detail
        : typeof maybeError.message === 'string'
        ? maybeError.message
        : 'Unknown error';
      return `${status} - ${detail}`;
    }
    return 'Unknown error';
  };

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const log = [
      `=== AUTH STATE ===`,
      `isAuthenticated: ${auth.isAuthenticated}`,
      `isLoading: ${auth.isLoading}`,
      `user: ${auth.user ? auth.user.email : 'null'}`,
      `token exists: ${!!auth.token}`,
      ``,
      `=== LOCALSTORAGE ===`,
      `token (${STORAGE_KEYS.AUTH_TOKEN}): ${token ? token.substring(0, 30) + '...' : 'null'}`,
      ``,
      `=== AXIOS DEFAULTS ===`,
      `Authorization header: ${axios.defaults.headers.common['Authorization'] || 'null'}`,
    ];
    setLogs(log);
  }, [auth]);

  const testToken = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      setTestResult('❌ No token in localStorage');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTestResult(`✅ Token valid! User: ${response.data.email}`);
    } catch (error: unknown) {
      setTestResult(`❌ Token invalid: ${getErrorSummary(error)}`);
    }
  };

  const clearAndLogin = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/auth');
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '14px' }}>
      <h1>🔍 Auth Debug</h1>
      
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={testToken} style={{ marginRight: '10px', padding: '10px 20px' }}>
          Test Token
        </button>
        <button onClick={clearAndLogin} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}>
          Clear All & Re-login
        </button>
      </div>

      {testResult && (
        <div style={{ padding: '15px', background: testResult.includes('✅') ? '#d1fae5' : '#fee2e2', borderRadius: '8px' }}>
          {testResult}
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '20px', background: '#e0f2fe', borderRadius: '8px' }}>
        <h3>Quick Fixes:</h3>
        <ul>
          <li>Click "Test Token" - see if your token is valid</li>
          <li>Click "Clear All & Re-login" - fresh start</li>
          <li>Check Console (F12) for [AuthContext] logs</li>
          <li>If token expired, you need to login again</li>
        </ul>
      </div>
    </div>
  );
};
