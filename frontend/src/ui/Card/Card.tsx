import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  variant?: 'elevated' | 'outlined' | 'filled' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  pressable?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

const paddingMap = {
  none: styles.paddingNone,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
} as const;

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  padding = 'md',
  pressable = false,
  onClick,
  children,
  className = '',
}) => {
  const isInteractive = pressable && !!onClick;

  const cls = [
    styles.card,
    styles[variant],
    paddingMap[padding],
    isInteractive ? styles.pressable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (isInteractive) {
    return (
      <button type="button" className={cls} onClick={onClick}>
        {children}
      </button>
    );
  }

  return <div className={cls}>{children}</div>;
};
