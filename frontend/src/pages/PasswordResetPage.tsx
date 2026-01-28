import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconMail, IconArrowLeft } from '../components/Icons';
import { usePageTitle } from '../hooks/usePageTitle';
import './CommonStyles.css';
import './PasswordResetPage.css';

/**
 * Password Reset Page (US-103)
 * Allows users to request password reset via email
 */
const PasswordResetPage: React.FC = () => {
  usePageTitle('Reset Password');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to send reset email');
      }
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="page-container password-reset-page">
        <div className="card password-reset-card">
          <div className="card-header">
            <h2>Check Your Email</h2>
          </div>
          <div className="card-content password-reset-content">
            <div className="password-reset-icon">
              <IconMail size={48} strokeWidth={2} />
            </div>
            <p>We've sent a password reset link to:</p>
            <p className="password-reset-email">{email}</p>
            <p className="password-reset-note">
              The link will expire in 24 hours.
            </p>
            <p className="password-reset-cta">Didn&apos;t receive the email? Check your spam folder or use a different email address.</p>
            <div className="password-reset-actions">
              <Link to="/auth" className="btn btn-primary password-reset-action">
                Return to Login
              </Link>
              <button type="button" className="btn btn-secondary" onClick={() => { setIsSubmitted(false); setError(null); }}>
                Try again with different email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container password-reset-page">
      <div className="card password-reset-card">
        <div className="card-header">
          <h2>Reset Password</h2>
          <p className="password-reset-note">
            Enter your email and we'll send you a reset link
          </p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-error password-reset-alert">
                {error}
              </div>
            )}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{ width: '100%' }}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          <div className="password-reset-footer">
            <Link to="/auth" className="password-reset-link">
              <IconArrowLeft size={16} strokeWidth={2} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;
