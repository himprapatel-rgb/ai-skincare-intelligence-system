import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      label,
      error,
      placeholder = 'Select...',
      disabled = false,
      className = '',
      id: externalId,
    },
    forwardedRef,
  ) => {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);
    const autoId = useId();
    const selectId = externalId || autoId;
    const listboxId = `${selectId}-listbox`;
    const errorId = `${selectId}-error`;
    const labelId = `${selectId}-label`;

    const selectedOption = options.find((o) => o.value === value);

    const close = useCallback(() => {
      setOpen(false);
      setActiveIndex(-1);
    }, []);

    // Click outside
    useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          close();
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [open, close]);

    // Scroll active option into view
    useEffect(() => {
      if (!open || activeIndex < 0) return;
      const el = listboxRef.current?.children[activeIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }, [open, activeIndex]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!open) {
          if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
            e.preventDefault();
            setOpen(true);
            const currentIndex = options.findIndex((o) => o.value === value);
            setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
          }
          return;
        }

        switch (e.key) {
          case 'Escape':
            e.preventDefault();
            close();
            break;
          case 'ArrowDown':
            e.preventDefault();
            setActiveIndex((prev) => Math.min(prev + 1, options.length - 1));
            break;
          case 'ArrowUp':
            e.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, 0));
            break;
          case 'Home':
            e.preventDefault();
            setActiveIndex(0);
            break;
          case 'End':
            e.preventDefault();
            setActiveIndex(options.length - 1);
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            if (activeIndex >= 0) {
              onChange(options[activeIndex].value);
              close();
            }
            break;
          default:
            break;
        }
      },
      [open, activeIndex, options, value, onChange, close],
    );

    const wrapperCls = [
      styles.wrapper,
      error ? styles.hasError : '',
      disabled ? styles.disabled : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const describedBy = error ? errorId : undefined;

    return (
      <div ref={wrapperRef} className={wrapperCls} onKeyDown={handleKeyDown}>
        {label && (
          <span id={labelId} className={styles.label}>
            {label}
          </span>
        )}

        <button
          ref={forwardedRef}
          type="button"
          id={selectId}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-labelledby={label ? labelId : undefined}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={[styles.trigger, open ? styles.triggerOpen : '']
            .filter(Boolean)
            .join(' ')}
          disabled={disabled}
          onClick={() => {
            if (!open) {
              setOpen(true);
              const currentIndex = options.findIndex((o) => o.value === value);
              setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
            } else {
              close();
            }
          }}
        >
          <span className={selectedOption ? styles.value : styles.placeholder}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={[styles.chevron, open ? styles.chevronOpen : '']
              .filter(Boolean)
              .join(' ')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={label ? labelId : undefined}
            className={styles.listbox}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              const optCls = [
                styles.option,
                isSelected ? styles.selected : '',
                isActive ? styles.active : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  className={optCls}
                  onClick={() => {
                    onChange(option.value);
                    close();
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {option.label}
                  {isSelected && (
                    <svg
                      className={styles.checkIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="4 12 10 18 20 6" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {error && (
          <span id={errorId} className={styles.errorText} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
