import React from 'react';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => (
  <div className={`${styles.spinner} ${styles[size]} ${className}`} role="status" aria-label="Loading">
    <svg viewBox="0 0 24 24" fill="none" className={styles.svg}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="45" strokeDashoffset="20" />
    </svg>
  </div>
);
