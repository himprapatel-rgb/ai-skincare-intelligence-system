import React, { useState, useId } from 'react';
import styles from './Input.module.css';

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'search' | 'number';
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helper?: string;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  clearable?: boolean;
  className?: string;
  id?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  label,
  value,
  onChange,
  error,
  helper,
  placeholder,
  disabled = false,
  icon,
  clearable = false,
  className = '',
  id: externalId,
}) => {
  const autoId = useId();
  const inputId = externalId || autoId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword && showPassword ? 'text' : type;

  const showClear = clearable && value.length > 0;

  const handleClear = () => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set;
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (input && nativeInputValueSetter) {
      nativeInputValueSetter.call(input, '');
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    }
    // Fallback: synthesize a change event
    onChange({
      target: { value: '' },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const wrapperCls = [
    styles.wrapper,
    error ? styles.error : '',
    disabled ? styles.disabled : '',
    icon ? styles.hasIcon : '',
    showClear ? styles.hasClear : '',
    isPassword ? styles.hasToggle : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const describedBy = [
    error ? errorId : '',
    helper && !error ? helperId : '',
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={wrapperCls}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}

      <div className={styles.fieldWrapper}>
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}

        <input
          id={inputId}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={styles.input}
          aria-invalid={!!error}
          aria-describedby={describedBy}
        />

        {showClear && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            aria-label="Clear input"
            tabIndex={-1}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {isPassword && (
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>

      {error && (
        <span id={errorId} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
      {helper && !error && (
        <span id={helperId} className={styles.helperText}>
          {helper}
        </span>
      )}
    </div>
  );
};
