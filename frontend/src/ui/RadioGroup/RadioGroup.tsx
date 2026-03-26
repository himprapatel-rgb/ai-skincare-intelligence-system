import React, { useId } from 'react';
import styles from './RadioGroup.module.css';

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'default' | 'card';
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ options, value, onChange, variant = 'default', label, disabled = false, className = '' }, ref) => {
    const groupId = useId();

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
      let nextIndex: number | null = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        nextIndex = (index + 1) % options.length;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIndex = (index - 1 + options.length) % options.length;
      }
      if (nextIndex !== null && !disabled) {
        onChange(options[nextIndex].value);
        const el = document.getElementById(`${groupId}-${nextIndex}`);
        el?.focus();
      }
    };

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={label}
        className={`${styles.group} ${styles[variant]} ${className}`}
      >
        {options.map((option, index) => {
          const isSelected = option.value === value;
          const optionId = `${groupId}-${index}`;
          return (
            <label
              key={option.value}
              className={`${styles.option} ${isSelected ? styles.optionSelected : ''} ${disabled ? styles.disabled : ''}`}
              htmlFor={optionId}
            >
              <input
                id={optionId}
                type="radio"
                role="radio"
                name={groupId}
                value={option.value}
                checked={isSelected}
                disabled={disabled}
                aria-checked={isSelected}
                onChange={() => onChange(option.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={styles.input}
                tabIndex={isSelected || (!value && index === 0) ? 0 : -1}
              />
              <span className={styles.indicator}>
                <span className={styles.dot} />
              </span>
              <span className={styles.label}>{option.label}</span>
            </label>
          );
        })}
      </div>
    );
  },
);

RadioGroup.displayName = 'RadioGroup';
