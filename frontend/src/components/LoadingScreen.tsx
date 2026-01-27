// src/components/LoadingScreen.tsx
import React from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  message?: string;
  fullscreen?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading', 
  fullscreen = true 
}) => {
  return (
    <div className={`loading-screen ${fullscreen ? 'fullscreen' : 'inline'}`}>
      <div className="loading-content">
        <div className="loading-spinner-container">
          <div className="loading-spinner-ring" />
        </div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingScreen;
