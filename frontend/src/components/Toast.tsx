// src/components/Toast.tsx - Premium Toast Notifications
import React from 'react';
import { IconCheckCircle, IconAlertTriangle, IconX, IconInfo } from './Icons';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ type, message, onClose, duration = 5000 }) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <IconCheckCircle size={20} strokeWidth={2} />;
      case 'error':
        return <IconAlertTriangle size={20} strokeWidth={2} />;
      case 'warning':
        return <IconAlertTriangle size={20} strokeWidth={2} />;
      case 'info':
        return <IconInfo size={20} strokeWidth={2} />;
      default:
        return <IconInfo size={20} strokeWidth={2} />;
    }
  };

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">{getIcon()}</div>
      <p className="toast-message">{message}</p>
      <button className="toast-close" onClick={onClose} aria-label="Close notification">
        <IconX size={18} strokeWidth={2} />
      </button>
    </div>
  );
};

export default Toast;
