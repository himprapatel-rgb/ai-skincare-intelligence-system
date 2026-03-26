import React, { useEffect, useCallback } from 'react';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  className?: string;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ message, type = 'info', duration = 4000, onClose, className = '' }, ref) => {
    const handleClose = useCallback(() => {
      onClose();
    }, [onClose]);

    useEffect(() => {
      if (duration <= 0) return;
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }, [duration, handleClose]);

    const iconMap: Record<ToastType, string> = {
      success: '\u2713',
      error: '\u2717',
      warning: '\u26A0',
      info: '\u2139',
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={`${styles.toast} ${styles[type]} ${className}`}
      >
        <span className={styles.icon} aria-hidden="true">
          {iconMap[type]}
        </span>
        <span className={styles.message}>{message}</span>
        <button
          className={styles.close}
          onClick={handleClose}
          aria-label="Dismiss notification"
          type="button"
        >
          \u00D7
        </button>
      </div>
    );
  },
);

Toast.displayName = 'Toast';
