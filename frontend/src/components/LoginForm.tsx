import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showVerifyLink, setShowVerifyLink] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowVerifyLink(false);
    setLoading(true);

    try {
      await login(email, password);
      onSuccess();
    } catch (err: unknown) {
      console.error('Login error:', err);
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail || err.response?.data?.message;
        const message = detail || 'Login failed. Please try again.';
        console.error('Login API error:', {
          status: err.response?.status,
          data: err.response?.data,
          message
        });
        setError(message);
        if (typeof message === 'string' && message.toLowerCase().includes('verify')) {
          setShowVerifyLink(true);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form">
      <h2>Sign In</h2>
      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            placeholder="Enter your email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            placeholder="Enter your password"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <LoadingSpinner size="small" /> : 'Sign In'}
        </button>
      </form>
      {showVerifyLink && (
        <button
          type="button"
          className="btn-link"
          onClick={() => navigate(`/verify-email?email=${encodeURIComponent(email)}`)}
        >
          Verify your email
        </button>
      )}
      <p className="switch-form">
        Don't have an account?{' '}
        <button onClick={onSwitchToRegister} className="btn-link">
          Register
        </button>
      </p>
    </div>
  );
};
