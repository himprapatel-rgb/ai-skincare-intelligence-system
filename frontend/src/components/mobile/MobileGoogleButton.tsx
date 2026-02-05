/**
 * Enhanced Google Sign-In Button for Mobile
 * Matches the modern mobile design system
 */

import React from 'react';
import { IconBrandGoogle } from '../Icons';
import './MobileGoogleButton.css';

interface MobileGoogleButtonProps {
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'primary';
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;

export const MobileGoogleButton: React.FC<MobileGoogleButtonProps> = ({
  disabled = false,
  loading = false,
  variant = 'default',
}) => {
  const handleClick = () => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_ID.trim()) {
      alert('Google sign-in is not configured. Please contact support.');
      return;
    }

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  return (
    <button
      type="button"
      className={`mobile-google-btn mobile-google-btn--${variant}`}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="mobile-google-spinner" />
      ) : (
        <IconBrandGoogle size={22} />
      )}
      <span>Continue with Google</span>
    </button>
  );
};
