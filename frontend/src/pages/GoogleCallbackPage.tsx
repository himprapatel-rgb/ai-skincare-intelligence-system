/**
 * Google OAuth Callback Page
 * Handles the redirect from Google after authentication
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import './GoogleCallbackPage.css';

/** Timeout for backend /auth/google (ms). */
const AUTH_GOOGLE_TIMEOUT_MS = 60000;

const GoogleCallbackPage: React.FC = () => {
  usePageTitle('Signing in');
  const { loginWithToken } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const [slowMessage, setSlowMessage] = useState(false);
  const [backendRedirectUri, setBackendRedirectUri] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Google sign-in was cancelled or failed.');
      setProcessing(false);
      return;
    }

    if (!code) {
      setError('No authorization code received from Google.');
      setProcessing(false);
      return;
    }

    const controller = new AbortController();
    const slowTimer = window.setTimeout(() => setSlowMessage(true), 8000);

    const handleCallback = async () => {
      try {
        const redirect_uri = `${window.location.origin}/auth/google/callback`;
        const response = await api.post('/auth/google', { code, redirect_uri }, {
          timeout: AUTH_GOOGLE_TIMEOUT_MS,
          signal: controller.signal,
        });

        clearTimeout(slowTimer);
        if (response.data.token) {
          loginWithToken(response.data.token, response.data.user);
          // Mirror AuthPage: new users with no profile go to onboarding
          try {
            await api.get('/profile');
            navigate('/dashboard', { replace: true });
          } catch (profileErr: unknown) {
            const status = profileErr && typeof profileErr === 'object' && 'response' in profileErr
              ? (profileErr as { response?: { status?: number } }).response?.status
              : undefined;
            if (status === 404) {
              navigate('/onboarding', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          }
        } else {
          setError('Failed to authenticate with Google.');
          setProcessing(false);
        }
      } catch (err: unknown) {
        clearTimeout(slowTimer);
        if (import.meta.env.DEV) console.error('Google auth error:', err);
        const isTimeout = err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'ECONNABORTED';
        const isAbort = err && typeof err === 'object' && 'name' in err && (err as { name?: string }).name === 'CanceledError';
        if (isTimeout || isAbort) {
          setError(
            'The server took too long to respond (staging often "wakes up" in 30–60 seconds). Please try "Continue with Google" again — the second attempt is usually faster.'
          );
        } else {
          // API client rejects with { detail, status }; axios error has response.data.detail; backend detail can be string or array
          const o = err && typeof err === 'object' ? err as Record<string, unknown> : null;
          const errMsg = typeof o?.message === 'string' ? o.message : '';
          const isNetworkError = !o?.response && (errMsg.toLowerCase().includes('network') || errMsg.includes('ECONNREFUSED') || errMsg.includes('ECONNRESET'));

          if (isNetworkError) {
            setError(
              'Cannot reach the server. The backend may be starting up (can take 30–60 seconds). Check your internet connection and try again.'
            );
          } else {
            const responseData = o?.response && typeof o.response === 'object' && o.response !== null
              ? (o.response as { data?: unknown }).data
              : undefined;
            const raw =
              o?.detail ??
              (responseData && typeof responseData === 'object' && responseData !== null && 'detail' in responseData
                ? (responseData as { detail: unknown }).detail
                : undefined);
            let detailMsg: string;
            if (typeof raw === 'string' && raw.trim()) {
              detailMsg = raw;
            } else if (Array.isArray(raw) && raw.length > 0) {
              const first = raw[0];
              detailMsg = typeof first === 'object' && first !== null && 'msg' in first
                ? String((first as { msg: unknown }).msg)
                : String(first);
            } else if (errMsg.trim()) {
              detailMsg = errMsg;
            } else {
              detailMsg =
                'Failed to complete Google sign-in. If this keeps happening, add your sign-in callback URL to Authorized redirect URIs in Google Cloud Console, and ensure the backend has Google OAuth configured.';
            }
            if (detailMsg.toLowerCase().includes('google oauth is not configured')) {
              detailMsg =
                'Google sign-in is not set up on the server. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the backend (e.g. Railway) environment variables, and add this site’s callback URL to Authorized redirect URIs in Google Cloud Console.';
            }
            setError(detailMsg);
          }
        }
        setProcessing(false);
      }
    };

    handleCallback();
    return () => {
      clearTimeout(slowTimer);
      controller.abort();
    };
  }, [searchParams, navigate, loginWithToken]);

  // When showing an error, fetch the backend's redirect URI so the user can add it to Google Console
  useEffect(() => {
    if (!error) return;
    let cancelled = false;
    api.get<{ redirect_uri: string }>('/auth/google/redirect-uri', { timeout: 5000 })
      .then((res) => {
        if (!cancelled && res.data?.redirect_uri) setBackendRedirectUri(res.data.redirect_uri);
      })
      .catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  }, [error]);

  if (processing && !error) {
    return (
      <div className="google-callback-page app-page">
        <div className="app-page-content callback-container">
          <div className="loading-spinner" />
          <h2>Signing in with Google...</h2>
          <p>
            {slowMessage
              ? 'This is taking longer than usual — the server may be waking up (staging can take 30–60 seconds). You can wait or go back and try again; the second attempt is usually faster.'
              : 'Please wait while we complete your authentication.'}
          </p>
          {slowMessage && (
            <button type="button" className="btn-secondary" onClick={() => navigate('/auth', { replace: true })} style={{ marginTop: '1rem' }}>
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="google-callback-page app-page">
        <div className="app-page-content callback-container error">
          <div className="error-icon">✕</div>
          <h2>Sign-in Failed</h2>
          <p>{error}</p>
          {backendRedirectUri && (
            <div className="callback-redirect-hint" style={{ marginTop: '1rem', textAlign: 'left' }}>
              <strong>Add this URL to Authorized redirect URIs in Google Cloud Console:</strong>
              <code style={{ display: 'block', marginTop: '0.5rem', padding: '0.5rem', background: '#f5f5f5', borderRadius: 4, wordBreak: 'break-all' }}>
                {backendRedirectUri}
              </code>
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: '0.5rem' }}
                onClick={() => {
                  navigator.clipboard?.writeText(backendRedirectUri);
                }}
              >
                Copy URL
              </button>
            </div>
          )}
          <button onClick={() => navigate('/auth')} className="btn-primary" style={{ marginTop: '1rem' }}>
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default GoogleCallbackPage;
