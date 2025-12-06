import React from 'react';

/**
 * LoadingSpinner Component Props
 */
interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * LoadingSpinner Component
 * Displays animated loading indicator with optional message
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...',
  size = 'medium'
}) => {
  const sizeClasses = {
    small: 'loading-spinner--small',
    medium: 'loading-spinner--medium',
    large: 'loading-spinner--large'
  };

  return (
    <div className="loading-spinner">
      <div 
        className={`loading-spinner__spinner ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
      >
        <div className="loading-spinner__circle"></div>
      </div>
      {message && (
        <p className="loading-spinner__message">{message}</p>
      )}
    </div>
  );
};
