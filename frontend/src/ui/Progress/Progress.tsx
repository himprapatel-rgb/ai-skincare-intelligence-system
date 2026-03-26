import React from 'react';
import styles from './Progress.module.css';

export interface ProgressProps {
  value: number;
  max?: number;
  variant?: 'bar' | 'ring';
  label?: string;
  className?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, variant = 'bar', label, className = '' }, ref) => {
    const clampedValue = Math.min(Math.max(value, 0), max);
    const percentage = (clampedValue / max) * 100;

    if (variant === 'ring') {
      const size = 48;
      const strokeWidth = 4;
      const radius = (size - strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (percentage / 100) * circumference;

      return (
        <div
          ref={ref}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `${Math.round(percentage)}% complete`}
          className={`${styles.ringContainer} ${className}`}
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={styles.ringSvg}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--border-color, #e2e8f0)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--primary, #1f6feb)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={styles.ringFill}
            />
          </svg>
          {label && <span className={styles.ringLabel}>{label}</span>}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `${Math.round(percentage)}% complete`}
        className={`${styles.barContainer} ${className}`}
      >
        {label && <span className={styles.barLabel}>{label}</span>}
        <div className={styles.track}>
          <div
            className={styles.fill}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  },
);

Progress.displayName = 'Progress';
