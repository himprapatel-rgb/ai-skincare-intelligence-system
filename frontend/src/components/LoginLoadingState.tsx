/**
 * Login Loading State with Progress Messages
 * Makes slow Railway logins feel faster with helpful messages
 */

import React, { useState, useEffect } from 'react';
import './LoginLoadingState.css';

interface LoginLoadingStateProps {
  duration?: number;
}

export const LoginLoadingState: React.FC<LoginLoadingStateProps> = ({ duration = 0 }) => {
  const [message, setMessage] = useState('Signing in...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const messages = [
      { time: 0, text: 'Signing in...', progress: 10 },
      { time: 3000, text: 'Connecting to server...', progress: 30 },
      { time: 8000, text: 'Waking up backend... (Railway free tier)', progress: 50 },
      { time: 15000, text: 'Almost there... Verifying credentials...', progress: 70 },
      { time: 25000, text: 'Just a few more seconds...', progress: 85 },
    ];

    const timeouts: NodeJS.Timeout[] = [];

    messages.forEach(({ time, text, progress: prog }) => {
      const timeout = setTimeout(() => {
        setMessage(text);
        setProgress(prog);
      }, time);
      timeouts.push(timeout);
    });

    if (duration > 0) {
      const timeout = setTimeout(() => {
        setMessage('Finishing up...');
        setProgress(100);
      }, duration);
      timeouts.push(timeout);
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [duration]);

  return (
    <div className="login-loading-state">
      <div className="login-loading-spinner" />
      <div className="login-loading-message">{message}</div>
      <div className="login-loading-progress-bar">
        <div 
          className="login-loading-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      {progress > 50 && (
        <div className="login-loading-tip">
          💡 Railway free tier takes 10-30s to wake up on first login
        </div>
      )}
    </div>
  );
};
