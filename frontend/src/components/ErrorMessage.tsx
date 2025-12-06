import React from 'react';

/**
 * ErrorMessage Component Props
 */
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * ErrorMessage Component
 * Displays error messages with optional retry/dismiss actions
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry, 
  onDismiss 
}) => {
  return (
    <div className="error-message" role="alert" aria-live="polite">
      <div className="error-message__content">
        <span className="error-message__icon" aria-hidden="true">❌</span>
        <p className="error-message__text">{message}</p>
      </div>
      
      {(onRetry || onDismiss) && (
        <div className="error-message__actions">
          {onRetry && (
            <button 
              className="error-message__button error-message__button--retry"
              onClick={onRetry}
              aria-label="Retry"
            >
              Try Again
            </button>
          )}
          {onDismiss && (
            <button 
              className="error-message__button error-message__button--dismiss"
              onClick={onDismiss}
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
};
