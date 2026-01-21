// Development Banner - Shows auto-login status
import React from 'react';
import './DevBanner.css';

export const DevBanner: React.FC = () => {
  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const user = localStorage.getItem('user');
  if (!user) {
    return null;
  }

  return (
    <div className="dev-banner">
      <span className="dev-badge">DEV</span>
      <span className="dev-text">
        Auto-logged in as <strong>Himanshu Patel</strong> (himanshu@test.com)
      </span>
      <span className="dev-pulse"></span>
    </div>
  );
};

export default DevBanner;
