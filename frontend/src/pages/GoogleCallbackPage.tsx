/**
 * Google OAuth Callback Page
 * Handles the redirect from Google after authentication
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { API_BASE_URL } from '../config';
import './GoogleCallbackPage.css';

/** Backend health URL for "check server" link. */
const HEALTH_URL = (() => {
  try {
    return `${new URL(API_BASE_URL).origin}/api/health`;
  } catch {
    return 'https://ai-skincare-intelligence-system-production.up.railway.app/api/health';
  }
})();

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
              ? 'The server is taking longer than usual — it may be waking up (often 30–60 seconds on first request). You can keep waiting or go back and try again; the second attempt is usually faster.'
              : 'Please wait while we complete your authentication.'}
          </p>
          {slowMessage && (
            <div className="callback-slow-actions">
              <button type="button" className="btn-primary" onClick={() => navigate('/auth', { replace: true })}>
                Back to Sign In — try again in a moment
              </button>
              <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
                Keep waiting (refresh)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isConnectionError = error && (
    /couldn't reach|connection|unavailable|network|timeout/i.test(error) ||
    /ECONNREFUSED|ECONNABORTED|ERR_NETWORK/i.test(error)
  );
  const isRedirectMismatch = error && /redirect_uri_mismatch|redirect_uri/i.test(error);
  const callbackUrlUsed = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/google/callback`
    : '';

  if (error) {
    return (
      <div className="google-callback-page app-page">
        <div className="app-page-content callback-container error">
          <div className="error-icon">✕</div>
          <h2>Sign-in Failed</h2>
          <p>{error}</p>
          {isConnectionError && (
            <>
              <p className="callback-tip">
                Tip: Go back and try &quot;Continue with Google&quot; again in a moment — the server may be starting up.
              </p>
              <p className="callback-backend-info">
                <strong>Backend:</strong>{' '}
                <code>{new URL(API_BASE_URL).origin}</code>
              </p>
              <p className="callback-backend-info">
                <a href={HEALTH_URL} target="_blank" rel="noopener noreferrer" className="btn-link">
                  Check server status
                </a>
                {' — if the page does not load or shows an error, the backend is down. Restart or redeploy it on Railway.'}
              </p>
            </>
          )}
          <div className="callback-redirect-hint">
            <strong>Common fixes:</strong>
            <ol>
              <li>
                In <strong>Google Cloud Console</strong> → APIs &amp; Services → Credentials → your OAuth client → <strong>Authorized redirect URIs</strong>, add exactly:
                <code className="callback-redirect-code">
                  {backendRedirectUri || callbackUrlUsed || 'https://your-site.com/auth/google/callback'}
                </code>
                <button
                  type="button"
                  className="btn-secondary callback-copy-btn"
                  onClick={() => navigator.clipboard?.writeText(backendRedirectUri || callbackUrlUsed)}
                >
                  Copy URL
                </button>
              </li>
              <li>
                Check the backend is running: open your API health URL (e.g. <code>/api/health</code>) and ensure it returns 200.
              </li>
              <li>
                On the server (e.g. Railway), set <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> from Google Cloud Console.
              </li>
            </ol>
            {isRedirectMismatch && (
              <p className="callback-mismatch-hint">
                The error above usually means the redirect URI in Google Console does not match exactly (including https and no trailing slash).
              </p>
            )}
          </div>
          <button onClick={() => navigate('/auth')} className="btn-primary callback-back-btn">
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default GoogleCallbackPage;
