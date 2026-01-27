/**
 * Google OAuth Callback Page
 * Handles the redirect from Google after authentication
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './GoogleCallbackPage.css';

const GoogleCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
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

      try {
        // Exchange code with backend
        const response = await api.post('/auth/google', { code });
        
        if (response.data.token) {
          // Update auth context (this also stores token in localStorage)
          loginWithToken(response.data.token, response.data.user);
          
          // Redirect to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          setError('Failed to authenticate with Google.');
          setProcessing(false);
        }
      } catch (err: any) {
        console.error('Google auth error:', err);
        setError(err.response?.data?.detail || 'Failed to complete Google sign-in.');
        setProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, loginWithToken]);

  if (processing && !error) {
    return (
      <div className="google-callback-page">
        <div className="callback-container">
          <div className="loading-spinner" />
          <h2>Signing in with Google...</h2>
          <p>Please wait while we complete your authentication.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="google-callback-page">
        <div className="callback-container error">
          <div className="error-icon">✕</div>
          <h2>Sign-in Failed</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default GoogleCallbackPage;
