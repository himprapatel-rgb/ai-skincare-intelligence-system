import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';
import { GoogleSignInButton } from './GoogleSignInButton';

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

/** Map API error strings to user-friendly register messages (Task 222) */
function toFriendlyRegisterError(detail: string, status?: number): string {
  const s = (detail || '').toLowerCase();
  if (status === 409 || s.includes('already') && (s.includes('email') || s.includes('registered')))
    return 'An account with this email already exists. Try signing in or use Forgot password.';
  if (s.includes('invalid') && s.includes('email')) return 'Please enter a valid email address.';
  if (s.includes('password') && (s.includes('weak') || s.includes('requirement')))
    return 'Password does not meet requirements. Use at least 8 characters, one uppercase, one number, and one special character.';
  if (status === 429) return 'Too many attempts. Please wait a few minutes and try again.';
  return '';
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must include at least one uppercase letter');
      return;
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('Password must include at least one number');
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError('Password must include at least one special character');
      return;
    }

    setLoading(true);

    try {
      const { name, email, password } = formData;
      const response = await register(name, email, password);
      if (response.verification_required) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      onSuccess();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail || err.response?.data?.message || '';
        const friendly = toFriendlyRegisterError(typeof detail === 'string' ? detail : '', err.response?.status);
        setError(friendly || (typeof detail === 'string' ? detail : '') || 'Registration failed. Please try again.');
      } else if (err instanceof Error) {
        setError(toFriendlyRegisterError(err.message) || err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = ((): 'weak' | 'medium' | 'strong' => {
    const p = formData.password;
    if (!p) return 'weak';
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(p)) score++;
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  })();

  return (
    <div className="register-form">
      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter your full name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter your email"
          />
        </div>
        <div className="form-group password-field">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter your password"
            aria-describedby="strength-text"
          />
          {formData.password && (
            <div className="strength-meter" role="presentation" aria-hidden="true">
              <div
                className={`strength-bar strength-${passwordStrength}`}
                id="strength-bar"
              />
            </div>
          )}
          {formData.password && (
            <span id="strength-text" className="strength-text">
              {passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'medium' ? 'Medium' : 'Strong'}
            </span>
          )}
          <div className="password-requirements">
            <span>Password must include:</span>
            <ul>
              <li>At least 8 characters</li>
              <li>1 uppercase letter</li>
              <li>1 number</li>
              <li>1 special character</li>
            </ul>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Confirm your password"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <LoadingSpinner size="small" /> : 'Create Account'}
        </button>
      </form>
      
      <div className="auth-divider">
        <span>or</span>
      </div>
      
      <GoogleSignInButton disabled={loading} />
      
      <p className="switch-form">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="btn-link">
          Sign In
        </button>
      </p>
    </div>
  );
};
