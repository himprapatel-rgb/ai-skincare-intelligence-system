import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './CommonStyles.css';

/**
 * Password Reset Page (US-103)
 * Allows users to request password reset via email
 */
const PasswordResetPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // TODO: Integrate with backend API
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Failed to send reset email');
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="page-container">
        <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div className="card-header">
            <h2>Check Your Email</h2>
          </div>
          <div className="card-content" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
            <p>We've sent a password reset link to:</p>
            <p style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{email}</p>
            <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
              The link will expire in 24 hours.
            </p>
            <Link to="/auth" className="btn btn-primary" style={{ marginTop: '24px' }}>
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div className="card-header">
          <h2>Reset Password</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Enter your email and we'll send you a reset link
          </p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
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
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link to="/auth" style={{ color: 'var(--primary-color)' }}>
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;
