/**
 * Modern Mobile-First Auth Page
 * Inspired by Instagram, Spotify, Airbnb design patterns
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useMobileDetection } from '../hooks/useMobileDetection';
import { MobileButton } from '../components/mobile/MobileButton';
import { MobileInput } from '../components/mobile/MobileInput';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { triggerHaptic } from '../utils/mobileOptimizations';
import { 
  IconMail, 
  IconLock, 
  IconUser, 
  IconSparkles, 
  IconCamera,
  IconBarChart,
  IconCheckCircle 
} from '../components/Icons';
import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';
import './AuthPageMobile.css';

const REMEMBER_EMAIL_KEY = STORAGE_KEYS.REMEMBER_EMAIL;

export const AuthPageMobile: React.FC = () => {
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
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useMobileDetection();

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
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail || 'Something went wrong';
        setError(typeof detail === 'string' ? detail : 'Authentication failed');
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
    triggerHaptic('light');
  };

  return (
    <div className="auth-page-mobile">
      {/* Animated background */}
      <div className="auth-mobile-bg" />
      
      {/* Hero section */}
      <div className="auth-mobile-hero">
        <div className="auth-mobile-logo animate-scale-in">
          <IconSparkles size={48} strokeWidth={2} />
        </div>
        <h1 className="auth-mobile-title animate-slide-up">
          Pellicura
        </h1>
        <p className="auth-mobile-subtitle animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Your AI-powered skincare companion
        </p>
      </div>

      {/* Auth card */}
      <div className="auth-mobile-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {/* Tab switcher */}
        <div className="auth-mobile-tabs">
          <button
            className={`auth-mobile-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => mode !== 'login' && switchMode()}
          >
            Sign In
          </button>
          <button
            className={`auth-mobile-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => mode !== 'register' && switchMode()}
          >
            Sign Up
          </button>
          <div 
            className="auth-mobile-tab-indicator"
            style={{ transform: mode === 'login' ? 'translateX(0%)' : 'translateX(100%)' }}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-mobile-form">
          {error && (
            <div className="auth-mobile-error animate-shake" role="alert">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <MobileInput
              label="Full Name"
              type="text"
              value={fullName}
              onChange={setFullName}
              icon={<IconUser size={20} />}
              required
              disabled={loading}
            />
          )}

          <MobileInput
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            icon={<IconMail size={20} />}
            required
            disabled={loading}
          />

          <MobileInput
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            icon={<IconLock size={20} />}
            required
            disabled={loading}
          />

          {mode === 'register' && password && (
            <div className="password-strength">
              <div className="password-strength-bar">
                <div 
                  className={`password-strength-fill password-strength-fill--${passwordStrength}`}
                />
              </div>
              <span className="password-strength-text">
                Password strength: {passwordStrength}
              </span>
            </div>
          )}

          {mode === 'login' && (
            <div className="auth-mobile-options">
              <label className="auth-mobile-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span>Remember me</span>
              </label>
              <Link to="/password-reset" className="auth-mobile-link">
                Forgot password?
              </Link>
            </div>
          )}

          <MobileButton
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            loading={loading}
            haptic="medium"
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </MobileButton>
        </form>

        {/* Divider */}
        <div className="auth-mobile-divider">
          <span>or continue with</span>
        </div>

        {/* Social sign in */}
        <GoogleSignInButton disabled={loading} />

        {/* Switch mode */}
        <div className="auth-mobile-switch">
          <span>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button 
            type="button"
            onClick={switchMode}
            className="auth-mobile-switch-btn"
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>

      {/* Features carousel (only on register) */}
      {mode === 'register' && (
        <div className="auth-mobile-features animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="feature-item">
            <div className="feature-item-icon">
              <IconCamera size={24} strokeWidth={2} />
            </div>
            <div className="feature-item-text">
              <h3>AI Skin Analysis</h3>
              <p>Upload a selfie for instant analysis</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-item-icon">
              <IconSparkles size={24} strokeWidth={2} />
            </div>
            <div className="feature-item-text">
              <h3>Personalized Routines</h3>
              <p>Get custom skincare recommendations</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-item-icon">
              <IconBarChart size={24} strokeWidth={2} />
            </div>
            <div className="feature-item-text">
              <h3>Track Progress</h3>
              <p>Monitor your skin health over time</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="auth-mobile-footer">
        <p>
          By continuing, you agree to our{' '}
          <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
};
