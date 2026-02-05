/**
 * Professional Mobile Card Component
 * Modern design with press states, shadows, and animations
 */

import React, { useState } from 'react';
import { triggerHaptic } from '../../utils/mobileOptimizations';
import './MobileCard.css';

interface MobileCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
  hoverable?: boolean;
  pressable?: boolean;
  haptic?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  onClick,
  variant = 'elevated',
  padding = 'medium',
  hoverable = false,
  pressable = true,
  haptic = true,
  className = '',
  style,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (!onClick) return;
    
    if (haptic) {
      triggerHaptic('light');
    }
    
    onClick();
  };

  const handleTouchStart = () => {
    if (pressable && onClick) {
      setIsPressed(true);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  const cardClasses = [
    'mobile-card',
    `mobile-card--${variant}`,
    `mobile-card--padding-${padding}`,
    hoverable && 'mobile-card--hoverable',
    pressable && onClick && 'mobile-card--pressable',
    isPressed && 'mobile-card--pressed',
    className,
  ].filter(Boolean).join(' ');

  const CardElement = onClick ? 'button' : 'div';

  return (
    <CardElement
      className={cardClasses}
      onClick={onClick ? handleClick : undefined}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={style}
      type={onClick ? 'button' : undefined}
    >
      {children}
    </CardElement>
  );
};
