import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { IconCamera, IconSparkles, IconBarChart } from '../components/Icons';
import './AuthPage.css';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedMode = params.get('mode');
    if (requestedMode === 'register') {
      setMode('register');
    } else if (requestedMode === 'login') {
      setMode('login');
    }
  }, [location.search]);

  const handleAuthSuccess = () => {
    navigate('/dashboard');
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
          <div className="auth-card">
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
