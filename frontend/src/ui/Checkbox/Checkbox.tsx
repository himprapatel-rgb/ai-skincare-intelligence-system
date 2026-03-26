import React, { useRef, useEffect, useId } from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  className?: string;
  id?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked,
      onChange,
      label,
      disabled = false,
      indeterminate = false,
      className = '',
      id: externalId,
    },
    forwardedRef,
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (forwardedRef as React.RefObject<HTMLInputElement>) || internalRef;
    const autoId = useId();
    const inputId = externalId || autoId;

    useEffect(() => {
      const el = inputRef.current;
      if (el) {
        el.indeterminate = indeterminate;
      }
    }, [indeterminate, inputRef]);

    const wrapperCls = [
      styles.wrapper,
      disabled ? styles.disabled : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <label htmlFor={inputId} className={wrapperCls}>
        <span className={styles.control}>
          <input
            ref={inputRef}
            id={inputId}
            type="checkbox"
            className={styles.nativeInput}
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            aria-checked={indeterminate ? 'mixed' : checked}
          />
          <span
            className={[
              styles.box,
              checked || indeterminate ? styles.checked : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden="true"
          >
            {indeterminate ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                <line x1="6" y1="12" x2="18" y2="12" />
              </svg>
            ) : checked ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 12 10 18 20 6" />
              </svg>
            ) : null}
          </span>
        </span>
        {label && <span className={styles.label}>{label}</span>}
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';
