import React from 'react';
import styles from './Alert.module.css';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className = '',
}) => (
  <div className={`${styles.alert} ${styles[type]} ${className}`} role="alert">
    <div className={styles.content}>
      {title && <strong className={styles.title}>{title}</strong>}
      <div className={styles.message}>{children}</div>
    </div>
    {dismissible && (
      <button className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
);
