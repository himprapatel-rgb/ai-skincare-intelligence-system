import React, { useEffect, useRef, useId } from 'react';
import styles from './Modal.module.css';

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  size = 'md',
  className = '',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Store previously focused element and focus the dialog when opened
  useEffect(() => {
    if (open) {
      previousActiveRef.current = document.activeElement as HTMLElement | null;
      // Wait for mount then focus first focusable or the dialog itself
      const timer = setTimeout(() => {
        const el = dialogRef.current;
        if (!el) return;
        const first = el.querySelector<HTMLElement>(FOCUSABLE);
        if (first) {
          first.focus();
        } else {
          el.focus();
        }
      }, 0);
      return () => clearTimeout(timer);
    } else {
      previousActiveRef.current?.focus();
      previousActiveRef.current = null;
    }
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus trap + Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const el = dialogRef.current;
      if (!el) return;
      const focusables = el.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement;
      if (e.shiftKey) {
        if (current === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (current === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const dialogCls = [styles.dialog, styles[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={dialogRef} className={dialogCls} tabIndex={-1}>
        {title && (
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <div className={styles.body}>{children}</div>

        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
};
