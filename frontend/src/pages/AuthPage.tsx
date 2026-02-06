import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { IconCamera, IconSparkles, IconBarChart } from '../components/Icons';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';
import './AuthPage.css';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const authCardRef = useRef<HTMLDivElement>(null);
  const API_URL = API_BASE_URL;

  usePageTitle(mode === 'register' ? 'Register' : 'Sign In');

  // Wake backend on auth page load so cold start happens while user types (login then feels fast)
  useEffect(() => {
    const base = API_URL.replace(/\/api\/v1\/?$/, '');
    fetch(`${base}/api/health`, { method: 'GET', keepalive: true }).catch(() => {});
  }, [API_URL]);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEYS.SESSION_EXPIRED_REDIRECT)) {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRED_REDIRECT);
      toast.error('Your session expired. Please sign in again.');
    }
  }, [toast]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedMode = params.get('mode');
    if (requestedMode === 'register') {
      setMode('register');
    } else if (requestedMode === 'login') {
      setMode('login');
    }
  }, [location.search]);

  useEffect(() => {
    const el = authCardRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = el.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first && last) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last && first) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [mode]);

  const handleAuthSuccess = () => {
    const returnUrl = sessionStorage.getItem(STORAGE_KEYS.AUTH_RETURN_URL);
    if (returnUrl) {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_RETURN_URL);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRED_REDIRECT);
      navigate(returnUrl);
      return;
    }
    // Navigate immediately so user sees "logged in" fast; check profile after and redirect to onboarding if needed
    navigate('/dashboard');
    axios.get(`${API_URL}/profile`).catch((err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        navigate('/onboarding');
      }
    });
  };
  return (
    <div className="auth-page app-page">
      {/* Mobile-only compact brand (shows when auth-left hidden) */}
      <div className="auth-mobile-brand" aria-hidden="true">
        <h1>SkinCareAI</h1>
        <p>AI-powered skin analysis</p>
      </div>
      {/* Left Panel - Branding */}
      <div className="auth-left">
        <div className="auth-brand">
          <h1>AI Skincare Intelligence</h1>
          <p>Analyze your skin and get personalized recommendations powered by advanced AI technology</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature">
            <div className="feature-icon">
              <IconCamera size={28} strokeWidth={2} />
            </div>
            <div className="feature-text">
              <h3>Smart Analysis</h3>
              <p>Upload a photo and get instant AI-powered skin analysis</p>
            </div>
          </div>
          <div className="auth-feature">
            <div className="feature-icon">
              <IconSparkles size={28} strokeWidth={2} />
            </div>
            <div className="feature-text">
              <h3>Personalized Routines</h3>
              <p>Get customized skincare routines tailored to your skin type</p>
            </div>
          </div>
          <div className="auth-feature">
            <div className="feature-icon">
              <IconBarChart size={28} strokeWidth={2} />
            </div>
            <div className="feature-text">
              <h3>Track Progress</h3>
              <p>Monitor your skin health improvements over time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="auth-right">
        <div className="auth-container">
          <div ref={authCardRef} className="auth-card app-card" role="form" aria-label={mode === 'login' ? 'Sign in form' : 'Create account form'}>
            <div className="auth-header">
              <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
              <p>{mode === 'login' ? 'Sign in to continue your skincare journey' : 'Start your personalized skincare experience'}</p>
            </div>
            <div className="auth-content">
              {mode === 'login' ? (
                <LoginForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToRegister={() => setMode('register')}
                />
              ) : (
                <RegisterForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToLogin={() => setMode('login')}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
