/**
 * Google Sign-In Button Component
 * Sprint: Final Features - Google OAuth Integration
 */
import React from 'react';
import { IconBrandGoogle } from './Icons';
import './GoogleSignInButton.css';

interface GoogleSignInButtonProps {
  disabled?: boolean;
  loading?: boolean;
}

// These should match your backend configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  disabled = false,
  loading = false,
}) => {
  // Don't render if Google OAuth is not configured
  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  const handleClick = () => {
    // Build Google OAuth URL
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    // Redirect to Google OAuth
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  return (
    <button
      type="button"
      className="google-signin-btn"
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="loading-spinner" />
      ) : (
        <IconBrandGoogle size={20} />
      )}
      <span>Continue with Google</span>
    </button>
  );
};

export default GoogleSignInButton;
