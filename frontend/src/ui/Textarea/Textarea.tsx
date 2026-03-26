import React, { useRef, useEffect, useCallback, useId } from 'react';
import styles from './Textarea.module.css';

export interface TextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  maxLength?: number;
  label?: string;
  error?: string;
  autoResize?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      value,
      onChange,
      rows = 4,
      maxLength,
      label,
      error,
      autoResize = false,
      placeholder,
      disabled = false,
      className = '',
      id: externalId,
    },
    forwardedRef,
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (forwardedRef as React.RefObject<HTMLTextAreaElement>) || internalRef;
    const autoId = useId();
    const textareaId = externalId || autoId;
    const errorId = `${textareaId}-error`;
    const countId = `${textareaId}-count`;

    const resize = useCallback(() => {
      const el = textareaRef.current;
      if (!el || !autoResize) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }, [autoResize, textareaRef]);

    useEffect(() => {
      resize();
    }, [value, resize]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e);
      resize();
    };

    const wrapperCls = [
      styles.wrapper,
      error ? styles.hasError : '',
      disabled ? styles.disabled : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const describedBy = [
      error ? errorId : '',
      maxLength ? countId : '',
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    const charCount = value.length;
    const isOverLimit = maxLength ? charCount > maxLength : false;

    return (
      <div className={wrapperCls}>
        {label && (
          <label htmlFor={textareaId} className={styles.label}>
            {label}
          </label>
        )}

        <textarea
          ref={textareaRef}
          id={textareaId}
          className={styles.textarea}
          value={value}
          onChange={handleChange}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy}
        />

        <div className={styles.footer}>
          {error && (
            <span id={errorId} className={styles.errorText} role="alert">
              {error}
            </span>
          )}

          {maxLength != null && (
            <span
              id={countId}
              className={[styles.charCount, isOverLimit ? styles.charCountOver : '']
                .filter(Boolean)
                .join(' ')}
              aria-live="polite"
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
