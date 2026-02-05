/**
 * Professional Mobile Button Component
 * Modern design with animations, haptic feedback, and accessibility
 */

import React, { useState } from 'react';
import { triggerHaptic } from '../../utils/mobileOptimizations';
import './MobileButton.css';

interface MobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  haptic = 'light',
  className = '',
  type = 'button',
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    // Trigger haptic feedback
    if (haptic !== 'none') {
      triggerHaptic(haptic);
    }
    
    onClick?.();
  };

  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  const buttonClasses = [
    'mobile-button',
    `mobile-button--${variant}`,
    `mobile-button--${size}`,
    fullWidth && 'mobile-button--full-width',
    disabled && 'mobile-button--disabled',
    loading && 'mobile-button--loading',
    isPressed && 'mobile-button--pressed',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading && (
        <span className="mobile-button__spinner" aria-hidden="true">
          <svg className="mobile-button__spinner-svg" viewBox="0 0 24 24">
            <circle
              className="mobile-button__spinner-circle"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="3"
            />
          </svg>
        </span>
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="mobile-button__icon mobile-button__icon--left">
          {icon}
        </span>
      )}
      
      <span className="mobile-button__text">
        {children}
      </span>
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="mobile-button__icon mobile-button__icon--right">
          {icon}
        </span>
      )}
    </button>
  );
};
