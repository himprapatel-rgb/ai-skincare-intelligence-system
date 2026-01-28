import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import './EmailVerificationPage.css';

type VerificationState = 'idle' | 'verifying' | 'verified' | 'error' | 'sent';

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';

export const EmailVerificationPage: React.FC = () => {
  usePageTitle('Verify Email');
  const location = useLocation();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tokenFromUrl = query.get('token') || '';
  const emailFromUrl = query.get('email') || '';
  // Check if user just registered (came from registration flow)
  const justRegistered = !tokenFromUrl && !!emailFromUrl;

  const [email, setEmail] = useState(emailFromUrl);
  const [status, setStatus] = useState<VerificationState>(justRegistered ? 'sent' : 'idle');
  const [message, setMessage] = useState(justRegistered ? 'A verification email has been sent to your inbox. Please check your email and click the verification link.' : '');
  const [devToken, setDevToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(justRegistered ? 60 : 0);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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
    if (resendCooldown > 0) {
      return;
    }
    setLoading(true);
    setStatus('idle');
    setMessage('');
    try {
      const response = await axios.post(`${API_URL}/auth/verify-email/request`, { email });
      setStatus('sent');
      setMessage(response.data?.message || 'Verification email sent. Please check your inbox.');
      setDevToken(response.data?.verification_token || null);
      setResendCooldown(60); // 60 second cooldown after resend
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
            {status === 'sent' ? (
              <div className="email-sent-info">
                <p>We sent a verification link to <strong>{email}</strong></p>
                <p className="check-spam">Check your spam folder if you don&apos;t see it.</p>
              </div>
            ) : (
              <>
                <label htmlFor="verify-email">Email address</label>
                <input
                  id="verify-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </>
            )}
            <button 
              className={status === 'sent' ? 'btn-secondary' : 'btn-primary'} 
              onClick={handleResend} 
              disabled={loading || resendCooldown > 0}
            >
              {loading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : status === 'sent' ? 'Resend verification email' : 'Send verification link'}
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
