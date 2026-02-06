/**
 * Demo Auth Page - Works without backend
 * Shows UI and allows demo login
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { STORAGE_KEYS } from '../constants/storage';
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
import './AuthPageMobileV2.css';

export const AuthPageDemo: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('himanshu@test.com');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Demo validation
    if (!email.trim()) {
      setError('Please enter your email');
      triggerHaptic('heavy');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      triggerHaptic('heavy');
      return;
    }

    setLoading(true);

    // Simulate API call (2 second delay)
    setTimeout(() => {
      // Demo login - accepts any credentials
      if (email && password) {
        triggerHaptic('medium');
        toast.success(`✅ Demo Login Successful! (Email: ${email})`);
        
        // Store demo token
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'demo-token-12345');
        localStorage.setItem('demo_user', JSON.stringify({
          email,
          full_name: fullName || 'Demo User',
          is_verified: true
        }));
        
        setLoading(false);
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        setError('Please fill in all fields');
        setLoading(false);
        triggerHaptic('heavy');
      }
    }, 2000);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    triggerHaptic('light');
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
      {/* Demo banner */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#f59e0b',
        color: 'white',
        padding: '8px',
        textAlign: 'center',
        fontSize: '13px',
        fontWeight: '600',
        zIndex: 9999
      }}>
        🎭 DEMO MODE - Backend not available, UI demonstration only
      </div>

      <div style={{ marginTop: '40px' }}>
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
                mode === 'login' ? 'Sign In (Demo)' : 'Create Account (Demo)'
              )}
            </button>
          </form>

          {/* Demo info */}
          <div style={{
            marginTop: '20px',
            padding: '14px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
            fontSize: '13px',
            color: '#3b82f6',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            💡 Demo Mode: Any email/password works!<br/>
            Just click Sign In to see the UI.
          </div>

          {/* Switch mode */}
          <div className="auth-switch-footer">
            <span className="switch-text">
              {mode === 'login' ? "Demo Sign Up?" : 'Demo Sign In?'}
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

        {/* Features */}
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
      </div>
    </div>
  );
};
