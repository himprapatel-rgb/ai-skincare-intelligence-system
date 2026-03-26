import React, { useId } from 'react';
import styles from './Switch.module.css';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onChange, label, disabled = false, className = '' }, ref) => {
    const id = useId();

    const handleClick = () => {
      if (!disabled) onChange(!checked);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!disabled) onChange(!checked);
      }
    };

    return (
      <div className={`${styles.container} ${className}`}>
        <button
          ref={ref}
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label || undefined}
          disabled={disabled}
          className={`${styles.track} ${checked ? styles.trackChecked : ''} ${disabled ? styles.disabled : ''}`}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          <span className={`${styles.thumb} ${checked ? styles.thumbChecked : ''}`} />
        </button>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}
      </div>
    );
  },
);

Switch.displayName = 'Switch';
