import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './EmailVerificationPage.css';

type VerificationState = 'idle' | 'verifying' | 'verified' | 'error';

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';

export const EmailVerificationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tokenFromUrl = query.get('token') || '';
  const emailFromUrl = query.get('email') || '';

  const [email, setEmail] = useState(emailFromUrl);
  const [status, setStatus] = useState<VerificationState>('idle');
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tokenFromUrl) {
      return;
    }
    const verify = async () => {
      setStatus('verifying');
      setMessage('Verifying your email...');
      try {
        const response = await axios.post(`${API_URL}/auth/verify-email`, { token: tokenFromUrl });
        setStatus('verified');
        setMessage(response.data?.message || 'Email verified. You can continue.');
        updateUser({ is_verified: true });
        setTimeout(() => navigate('/auth?mode=login'), 1200);
      } catch (err: unknown) {
        setStatus('error');
        const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
        setMessage(detail || 'Verification failed. Request a new link below.');
      }
    };
    void verify();
  }, [navigate, tokenFromUrl, updateUser]);

  const handleResend = async () => {
    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address.');
      return;
    }
    setLoading(true);
    setStatus('idle');
    setMessage('');
    try {
      const response = await axios.post(`${API_URL}/auth/verify-email/request`, { email });
      setMessage(response.data?.message || 'Verification email sent.');
      setDevToken(response.data?.verification_token || null);
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setStatus('error');
      setMessage(detail || 'Failed to send verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-verification-page">
      <div className="email-verification-card">
        <h1>Email Verification</h1>
        <p className="subtitle">Confirm your email to unlock your skincare profile.</p>

        {message && (
          <div className={`status-message ${status}`}>
            {message}
          </div>
        )}

        {!tokenFromUrl && (
          <>
            <label htmlFor="verify-email">Email address</label>
            <input
              id="verify-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
            <button className="btn-primary" onClick={handleResend} disabled={loading}>
              {loading ? 'Sending...' : 'Send verification link'}
            </button>
          </>
        )}

        {devToken && (
          <div className="dev-token">
            <span>Dev token:</span>
            <code>{devToken}</code>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
