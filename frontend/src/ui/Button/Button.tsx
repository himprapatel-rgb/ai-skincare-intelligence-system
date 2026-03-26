import React, { useState } from 'react';
import styles from './Button.module.css';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (disabled || loading) return;
    onClick?.();
  };

  const cls = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    disabled ? styles.disabled : '',
    loading ? styles.loading : '',
    isPressed ? styles.pressed : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={cls}
      onClick={handleClick}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading && (
        <span className={styles.spinner} aria-hidden="true">
          <svg viewBox="0 0 24 24" className={styles.spinnerSvg}>
            <circle cx="12" cy="12" r="10" fill="none" strokeWidth="3" />
          </svg>
        </span>
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className={styles.iconLeft}>{icon}</span>
      )}
      <span className={styles.text}>{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <span className={styles.iconRight}>{icon}</span>
      )}
    </button>
  );
};
