/**
 * Professional Mobile Auth Page - Version 2
 * Fixed and polished with all improvements
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { triggerHaptic } from '../utils/mobileOptimizations';
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
import { STORAGE_KEYS } from '../constants/storage';
import '../styles/mobile-animations.css';
import '../styles/mobile-gradients.css';
import './AuthPageMobileV2.css';

const REMEMBER_EMAIL_KEY = STORAGE_KEYS.REMEMBER_EMAIL;

export const AuthPageMobileV2: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_EMAIL_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(''); // Clear any initial errors on mount
  
  // Clear error when switching modes or changing inputs
  useEffect(() => {
    setError('');
  }, [mode, email, password]);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  usePageTitle(mode === 'register' ? 'Create Account' : 'Sign In');

  // Check for mode parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedMode = params.get('mode');
    if (requestedMode === 'register') {
      setMode('register');
    }
  }, [location.search]);

  // Password strength calculator
  useEffect(() => {
    if (!password) {
      setPasswordStrength('weak');
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) setPasswordStrength('weak');
    else if (strength <= 4) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email');
      triggerHaptic('heavy');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      triggerHaptic('heavy');
      return;
    }

    if (mode === 'register' && !fullName.trim()) {
      setError('Please enter your full name');
      triggerHaptic('heavy');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await login(trimmedEmail, password);
        if (rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, trimmedEmail);
        }
        triggerHaptic('medium');
        toast.success('Welcome back!');
        handleAuthSuccess();
      } else {
        // Register
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
          email: trimmedEmail,
          password,
          full_name: fullName.trim(),
        });

        if (response.data.token) {
          await login(trimmedEmail, password);
          triggerHaptic('medium');
          toast.success('Account created successfully!');
          handleAuthSuccess();
        }
      }
    } catch (err: unknown) {
      triggerHaptic('heavy');
      console.error('Login error:', err);
      
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        const status = err.response?.status;
        
        // Better error messages
        if (status === 401) {
          setError('Invalid email or password. Please check and try again.');
        } else if (status === 403) {
          setError('Please verify your email to continue.');
        } else if (!err.response) {
          setError('Cannot reach server. Please check your internet connection.');
        } else {
          setError(typeof detail === 'string' ? detail : 'Login failed. Please try again.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async () => {
    const returnUrl = sessionStorage.getItem(STORAGE_KEYS.AUTH_RETURN_URL);
    if (returnUrl) {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_RETURN_URL);
      navigate(returnUrl);
      return;
    }

    try {
      await axios.get(`${API_BASE_URL}/profile`);
      navigate('/dashboard');
    } catch {
      navigate('/onboarding');
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
    setFullName('');
    triggerHaptic('light');
  };

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
            <div className="auth-error-box animate-shake" role="alert">
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
                required
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
              required
              className="input-field"
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
              required
              className="input-field"
            />
            <label className="input-label">Password</label>
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
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
