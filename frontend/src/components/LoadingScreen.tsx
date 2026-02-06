// src/components/LoadingScreen.tsx
import React from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  message?: string;
  fullscreen?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading',
  fullscreen = true,
}) => {
  return (
    <div
      className={`loading-screen ${fullscreen ? 'fullscreen' : 'inline'}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="loading-content">
        <div className="loading-spinner-container" aria-hidden="true">
          <div className="loading-spinner-ring" />
        </div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingScreen;
