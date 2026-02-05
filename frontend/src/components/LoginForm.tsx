import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';
import { GoogleSignInButton } from './GoogleSignInButton';
import { IconEye, IconEyeOff } from './Icons';
import { API_BASE_URL } from '../config';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

const REMEMBER_EMAIL_KEY = 'login_remember_email';

/** Map API error strings to user-friendly auth messages (Task 222) */
function toFriendlyAuthError(detail: string, status?: number): string {
  const s = (detail || '').toLowerCase();
  if (s.includes('network') || s.includes('econnrefused') || s.includes('econnreset'))
    return 'Cannot reach the server. Check your internet connection and try again. If the problem persists, the service may be temporarily unavailable.';
  if (status === 401 || (s.includes('invalid') && (s.includes('credential') || s.includes('password'))))
    return 'Email or password is incorrect. Please check and try again.';
  if (status === 403 || s.includes('verify') || s.includes('verification'))
    return detail || 'Please verify your email to sign in. Check your inbox for the verification link or use "Request verification email" below.';
  if (s.includes('disabled') || s.includes('locked')) return 'This account is temporarily disabled. Please contact support.';
  if (status === 429) return 'Too many attempts. Please wait a few minutes and try again.';
  return '';
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_EMAIL_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return !!localStorage.getItem(REMEMBER_EMAIL_KEY);
    } catch {
      return false;
    }
  });
  const [error, setError] = useState('');
  const [showVerifyLink, setShowVerifyLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleRedirectUri, setGoogleRedirectUri] = useState<string | null>(null);
  const [googleBackendReachable, setGoogleBackendReachable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get<{ redirect_uri: string }>(`${API_BASE_URL}/auth/google/redirect-uri`, { timeout: 8000 })
      .then((res) => {
        if (!cancelled && res.data?.redirect_uri) setGoogleRedirectUri(res.data.redirect_uri);
        if (!cancelled) setGoogleBackendReachable(true);
      })
      .catch(() => {
        if (!cancelled) setGoogleBackendReachable(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowVerifyLink(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(trimmedEmail, password);
      if (rememberMe) {
        try { localStorage.setItem(REMEMBER_EMAIL_KEY, trimmedEmail); } catch { /* ignore */ }
      } else {
        try { localStorage.removeItem(REMEMBER_EMAIL_KEY); } catch { /* ignore */ }
      }
      onSuccess();
    } catch (err: unknown) {
      console.error('Login error:', err);
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail || err.response?.data?.message;
        const raw = typeof detail === 'string' ? detail : '';
        const fallback = !err.response ? err.message : '';
        const message = toFriendlyAuthError(raw || fallback, err.response?.status) || raw || fallback || 'Login failed. Please try again.';
        console.error('Login API error:', {
          status: err.response?.status,
          data: err.response?.data,
          message
        });
        setError(message);
        if (err.response?.status === 403 || (typeof raw === 'string' && raw.toLowerCase().includes('verify'))) {
          setShowVerifyLink(true);
        }
      } else if (err instanceof Error) {
        setError(toFriendlyAuthError(err.message) || err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form">
      <h2>Sign In</h2>
      {error && (
        <div id="login-error" role="alert" aria-live="assertive">
          <ErrorMessage 
            message={error} 
            onDismiss={() => setError('')}
          />
        </div>
      )}
      {import.meta.env.DEV && error && (
        <details style={{ marginTop: '8px', fontSize: '0.875rem', color: 'var(--text-gray)' }}>
          <summary style={{ cursor: 'pointer' }}>Debug Info</summary>
          <pre style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-light)', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify({ error, email: email ? '***' : 'empty' }, null, 2)}
          </pre>
        </details>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            placeholder="Enter your email"
            aria-required
            aria-invalid={!!error}
            aria-describedby={error ? 'login-error' : undefined}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your password"
              aria-required
              aria-invalid={!!error}
              aria-describedby={error ? 'login-error password-toggle-desc' : 'password-toggle-desc'}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <IconEyeOff size={18} strokeWidth={2} /> : <IconEye size={18} strokeWidth={2} />}
            </button>
          </div>
          <span id="password-toggle-desc" className="sr-only">Toggle password visibility</span>
        </div>
        <div className="form-group form-group-inline form-group-between">
          <label className="checkbox-label remember-me-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
              aria-label="Remember my email"
            />
            <span>Remember me</span>
          </label>
          <Link to="/password-reset" className="btn-link forgot-password">
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={loading} className="btn-primary" title={loading ? 'Signing in…' : undefined} aria-busy={loading}>
          {loading ? (
            <>
              <LoadingSpinner size="small" />
              <span>Signing in…</span>
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
      
      <div className="auth-divider">
        <span>or</span>
      </div>
      
      <GoogleSignInButton disabled={loading} />
      {googleBackendReachable === false && (
        <p className="auth-google-hint" style={{ marginTop: '8px', fontSize: '0.875rem', color: 'var(--text-gray)' }}>
          Backend not reachable. Google sign-in may fail. Check that the API is running (Railway) and that this site&apos;s URL is in CORS.
        </p>
      )}
      {googleRedirectUri && (
        <details className="auth-google-hint" style={{ marginTop: '8px', fontSize: '0.875rem', textAlign: 'left' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--text-gray)' }}>Google sign-in not working? Add this redirect URI</summary>
          <p style={{ marginTop: '6px', marginBottom: '4px', color: 'var(--text-gray)' }}>
            In Google Cloud Console → APIs &amp; Services → Credentials → your OAuth client → Authorized redirect URIs, add:
          </p>
          <code style={{ display: 'block', padding: '8px', background: 'var(--bg-light)', borderRadius: '4px', wordBreak: 'break-all', fontSize: '0.8rem' }}>
            {googleRedirectUri}
          </code>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginTop: '6px', fontSize: '0.8rem' }}
            onClick={() => navigator.clipboard?.writeText(googleRedirectUri)}
          >
            Copy URL
          </button>
        </details>
      )}
      {showVerifyLink && (
        <button
          type="button"
          className="btn-link"
          onClick={() => navigate(`/verify-email?email=${encodeURIComponent(email)}`)}
        >
          Verify your email
        </button>
      )}
      <p className="switch-form">
        Don't have an account?{' '}
        <button onClick={onSwitchToRegister} className="btn-link">
          Register
        </button>
      </p>
    </div>
  );
};
