/**
 * Fixed Auth Page - Guaranteed Working Login
 * Direct API calls with proper error handling
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

import { STORAGE_KEYS } from '../constants/storage';
import { 
  IconMail, 
  IconLock, 
  IconUser, 
  IconSparkles, 
  IconCamera,
  IconBarChart,
  IconEye,
  IconEyeOff,
} from '../components/Icons';
import { API_BASE_URL } from '../config';
import './AuthPageMobileV2.css';

const REMEMBER_EMAIL_KEY = STORAGE_KEYS.REMEMBER_EMAIL;

export const AuthPageFixed: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('himanshu@test.com');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const { loginWithToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  usePageTitle(mode === 'register' ? 'Create Account' : 'Sign In');

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const returnUrl = sessionStorage.getItem(STORAGE_KEYS.AUTH_RETURN_URL);
      if (returnUrl) {
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_RETURN_URL);
        navigate(returnUrl, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Clear error when inputs change
  useEffect(() => {
    if (error) setError('');
  }, [email, password, mode, error]);

  const getAuthErrorMessage = (err: unknown): string => {
    if (err && typeof err === 'object') {
      const maybeError = err as { response?: { status?: number; data?: { detail?: unknown } }; request?: unknown };
      const status = maybeError.response?.status;
      const detail = maybeError.response?.data?.detail;

      if (status === 401) return 'Invalid email or password';
      if (status === 403) return 'Please verify your email first';
      if (status === 422) return 'Invalid input - check your credentials';
      if (typeof detail === 'string') return detail;
      if (maybeError.request) return 'Cannot connect to server. Please check your connection.';
    }
    return 'Login failed. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const trimmedEmail = email.trim();
    
    // Validation
    if (!trimmedEmail) {
      setError('Please enter your email');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (mode === 'register' && !fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: trimmedEmail,
          password: password,
        });

        if (response.data && response.data.token) {
          // Store token and update AuthContext
          const token = response.data.token;
          const userData = response.data.user;
          
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Update AuthContext with token and user data
          loginWithToken(token, userData);

          // Remember email if checked
          if (rememberMe) {
            localStorage.setItem(REMEMBER_EMAIL_KEY, trimmedEmail);
          }

          toast.success('✅ Login successful!');
          
          // Navigate with slight delay
          setTimeout(() => {
            const returnUrl = sessionStorage.getItem(STORAGE_KEYS.AUTH_RETURN_URL);
            if (returnUrl) {
              sessionStorage.removeItem(STORAGE_KEYS.AUTH_RETURN_URL);
              navigate(returnUrl, { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          }, 500);
        } else {
          setError('Login failed - no token received');
        }
      } else {
        // Register mode
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
          email: trimmedEmail,
          password: password,
          full_name: fullName.trim(),
        });

        if (response.data && response.data.token) {
          const token = response.data.token;
          const userData = response.data.user;
          
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Update AuthContext
          loginWithToken(token, userData);
          
          toast.success('✅ Account created!');
          
          setTimeout(() => {
            navigate('/onboarding');
          }, 500);
        }
      }
    } catch (err: unknown) {
      const errorMsg = getAuthErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
    setFullName('');
  };

  const getPasswordStrength = (): 'weak' | 'medium' | 'strong' => {
    if (!password) return 'weak';
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="auth-page-mobile-v2">
      {/* Animated background */}
      <div className="auth-bg-gradient">
        <div className="auth-bg-pattern" />
        <div className="auth-bg-glow" />
      </div>
      
      {/* Hero section */}
      <div className="auth-hero">
        <div className="auth-logo-circle animate-scale-in">
          <IconSparkles size={40} strokeWidth={2.5} />
        </div>
        <h1 className="auth-title animate-slide-up">
          Pellicura
        </h1>
        <p className="auth-subtitle animate-slide-up" style={{ animationDelay: '0.1s' }}>
          AI-powered skincare intelligence
        </p>
      </div>

      {/* Auth card */}
      <div className="auth-card-container animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'auth-tab-active' : ''}`}
            onClick={() => mode !== 'login' && switchMode()}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'auth-tab-active' : ''}`}
            onClick={() => mode !== 'register' && switchMode()}
            type="button"
          >
            Sign Up
          </button>
          <div 
            className="auth-tab-slider"
            style={{ transform: mode === 'login' ? 'translateX(0%)' : 'translateX(100%)' }}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form-mobile">
          {error && (
            <div className="auth-error-box" role="alert">
              <span className="auth-error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <div className={`input-float ${nameFocused || fullName ? 'input-float-active' : ''}`}>
              <IconUser size={20} className="input-icon" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                disabled={loading}
                className="input-field"
              />
              <label className="input-label">Full Name</label>
              <div className="input-border" />
            </div>
          )}

          <div className={`input-float ${emailFocused || email ? 'input-float-active' : ''}`}>
            <IconMail size={20} className="input-icon" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              disabled={loading}
              className="input-field"
              autoComplete="email"
            />
            <label className="input-label">Email</label>
            <div className="input-border" />
          </div>

          <div className={`input-float ${passwordFocused || password ? 'input-float-active' : ''}`}>
            <IconLock size={20} className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              disabled={loading}
              className="input-field"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <label className="input-label">Password</label>
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
            <div className="input-border" />
          </div>

          {mode === 'register' && password && (
            <div className="strength-indicator">
              <div className="strength-bar-container">
                <div className={`strength-bar strength-${passwordStrength}`} />
              </div>
              <span className="strength-text">
                Password: <strong>{passwordStrength}</strong>
              </span>
            </div>
          )}

          {mode === 'login' && (
            <div className="auth-options-row">
              <label className="checkbox-modern">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span className="checkbox-text">Remember me</span>
              </label>
              <Link to="/password-reset" className="link-primary">
                Forgot?
              </Link>
            </div>
          )}

          <button
            type="submit"
            className="btn-gradient-primary btn-large"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-mini" />
                <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
              </>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider-or">
          <span>or continue with</span>
        </div>

        {/* Social sign in */}
        <div className="social-buttons">
          <GoogleSignInButton disabled={loading} />
        </div>

        {/* Switch mode */}
        <div className="auth-switch-footer">
          <span className="switch-text">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button 
            type="button"
            onClick={switchMode}
            className="switch-btn"
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>

      {/* Features (only on register) */}
      {mode === 'register' && (
        <div className="features-grid animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="feature-card">
            <div className="feature-icon-circle">
              <IconCamera size={22} strokeWidth={2.5} />
            </div>
            <div className="feature-content">
              <h3>AI Skin Analysis</h3>
              <p>Upload a selfie for instant analysis</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon-circle">
              <IconSparkles size={22} strokeWidth={2.5} />
            </div>
            <div className="feature-content">
              <h3>Personalized Routines</h3>
              <p>Custom recommendations for your skin</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon-circle">
              <IconBarChart size={22} strokeWidth={2.5} />
            </div>
            <div className="feature-content">
              <h3>Track Progress</h3>
              <p>Monitor improvements over time</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="auth-legal-footer">
        <p>
          By continuing, you agree to our{' '}
          <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy</Link>
        </p>
      </div>
    </div>
  );
};
