import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';
import { GoogleSignInButton } from './GoogleSignInButton';
import { IconEye, IconEyeOff } from './Icons';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

const REMEMBER_EMAIL_KEY = 'login_remember_email';

/** Map API error strings to user-friendly auth messages (Task 222) */
function toFriendlyAuthError(detail: string, status?: number): string {
  const s = (detail || '').toLowerCase();
  if (status === 401 || (s.includes('invalid') && (s.includes('credential') || s.includes('password'))))
    return 'Email or password is incorrect. Please check and try again.';
  if (s.includes('verify') || s.includes('verification')) return detail || 'Please verify your email to sign in.';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowVerifyLink(false);
    setLoading(true);

    try {
      await login(email, password);
      if (rememberMe) {
        try { localStorage.setItem(REMEMBER_EMAIL_KEY, email); } catch { /* ignore */ }
      } else {
        try { localStorage.removeItem(REMEMBER_EMAIL_KEY); } catch { /* ignore */ }
      }
      onSuccess();
    } catch (err: unknown) {
      console.error('Login error:', err);
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail || err.response?.data?.message;
        const raw = typeof detail === 'string' ? detail : '';
        const message = toFriendlyAuthError(raw, err.response?.status) || raw || 'Login failed. Please try again.';
        console.error('Login API error:', {
          status: err.response?.status,
          data: err.response?.data,
          message
        });
        setError(message);
        if (typeof raw === 'string' && raw.toLowerCase().includes('verify')) {
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
          <label className="checkbox-label">
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
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <LoadingSpinner size="small" /> : 'Sign In'}
        </button>
      </form>
      
      <div className="auth-divider">
        <span>or</span>
      </div>
      
      <GoogleSignInButton disabled={loading} />
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
