/**
 * Professional Mobile Input Component
 * Optimized for touch, with floating labels and validation
 */

import React, { useState, useRef, useEffect } from 'react';
import './MobileInput.css';

interface MobileInputProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'search' | 'url';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  icon?: React.ReactNode;
  maxLength?: number;
  className?: string;
}

export const MobileInput: React.FC<MobileInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  error,
  disabled = false,
  required = false,
  autoComplete,
  icon,
  maxLength,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasValue(!!value);
  }, [value]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const inputClasses = [
    'mobile-input',
    isFocused && 'mobile-input--focused',
    hasValue && 'mobile-input--has-value',
    error && 'mobile-input--error',
    disabled && 'mobile-input--disabled',
    icon && 'mobile-input--has-icon',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={inputClasses}>
      {icon && (
        <div className="mobile-input__icon">
          {icon}
        </div>
      )}
      
      <div className="mobile-input__field">
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className="mobile-input__input"
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-error` : undefined}
        />
        
        <label className="mobile-input__label">
          {label}
          {required && <span className="mobile-input__required">*</span>}
        </label>
        
        {/* Animated border */}
        <div className="mobile-input__border" />
      </div>
      
      {error && (
        <div className="mobile-input__error-message" id={`${label}-error`} role="alert">
          {error}
        </div>
      )}
      
      {maxLength && value.length > maxLength * 0.8 && (
        <div className="mobile-input__counter" aria-live="polite">
          {value.length} / {maxLength}
        </div>
      )}
    </div>
  );
};

// Textarea variant
interface MobileTextareaProps extends Omit<MobileInputProps, 'type'> {
  rows?: number;
  autoResize?: boolean;
}

export const MobileTextarea: React.FC<MobileTextareaProps> = ({
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  error,
  disabled = false,
  required = false,
  maxLength,
  rows = 4,
  autoResize = false,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setHasValue(!!value);
  }, [value]);

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, autoResize]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const textareaClasses = [
    'mobile-input',
    'mobile-input--textarea',
    isFocused && 'mobile-input--focused',
    hasValue && 'mobile-input--has-value',
    error && 'mobile-input--error',
    disabled && 'mobile-input--disabled',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={textareaClasses}>
      <div className="mobile-input__field">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          rows={rows}
          className="mobile-input__input mobile-input__textarea"
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-error` : undefined}
        />
        
        <label className="mobile-input__label">
          {label}
          {required && <span className="mobile-input__required">*</span>}
        </label>
        
        <div className="mobile-input__border" />
      </div>
      
      {error && (
        <div className="mobile-input__error-message" id={`${label}-error`} role="alert">
          {error}
        </div>
      )}
      
      {maxLength && (
        <div className="mobile-input__counter" aria-live="polite">
          {value.length} / {maxLength}
        </div>
      )}
    </div>
  );
};
