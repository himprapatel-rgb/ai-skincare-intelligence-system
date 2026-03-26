import React from 'react';
import styles from './Badge.module.css';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => (
  <span className={`${styles.badge} ${styles[variant]} ${styles[size]} ${className}`}>
    {children}
  </span>
);
