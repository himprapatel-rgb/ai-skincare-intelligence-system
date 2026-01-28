import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { IconCamera, IconSparkles, IconBarChart } from '../components/Icons';
import { usePageTitle } from '../hooks/usePageTitle';
import './AuthPage.css';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export const AuthPage: React.FC = () => {
  usePageTitle('Sign In');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const navigate = useNavigate();
  const location = useLocation();
  const authCardRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';

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

  const handleAuthSuccess = async () => {
    try {
      await axios.get(`${API_URL}/profile`);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    }
  };
  return (
    <div className="auth-page">
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
          <div ref={authCardRef} className="auth-card" role="form" aria-label={mode === 'login' ? 'Sign in form' : 'Create account form'}>
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
