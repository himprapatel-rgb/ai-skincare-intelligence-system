import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { IconLock, IconCheck, IconAlertCircle } from '../components/Icons';
import './CommonStyles.css';
import './PasswordResetPage.css';

/**
 * Password Reset Confirm Page (US-103)
 * Allows users to set a new password using the token from email
 */
const PasswordResetConfirmPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
          new_password: password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="page-container password-reset-page">
        <div className="card password-reset-card">
          <div className="card-header">
            <h2>Password Reset Complete</h2>
          </div>
          <div className="card-content password-reset-content">
            <div className="password-reset-icon success">
              <IconCheck size={48} strokeWidth={2} />
            </div>
            <p>Your password has been successfully reset.</p>
            <p className="password-reset-note">
              Redirecting to login page...
            </p>
            <Link to="/auth" className="btn btn-primary password-reset-action">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No token error state
  if (!token) {
    return (
      <div className="page-container password-reset-page">
        <div className="card password-reset-card">
          <div className="card-header">
            <h2>Invalid Reset Link</h2>
          </div>
          <div className="card-content password-reset-content">
            <div className="password-reset-icon error">
              <IconAlertCircle size={48} strokeWidth={2} />
            </div>
            <p>This password reset link is invalid or has expired.</p>
            <Link to="/password-reset" className="btn btn-primary password-reset-action">
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container password-reset-page">
      <div className="card password-reset-card">
        <div className="card-header">
          <h2>Set New Password</h2>
          <p className="password-reset-note">
            Enter your new password below
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
              <label htmlFor="password">
                <IconLock size={16} strokeWidth={2} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                New Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={8}
                autoFocus
              />
              <small className="form-hint">Must be at least 8 characters</small>
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <IconLock size={16} strokeWidth={2} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%' }}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
          <div className="password-reset-footer">
            <Link to="/auth" className="password-reset-link">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetConfirmPage;
