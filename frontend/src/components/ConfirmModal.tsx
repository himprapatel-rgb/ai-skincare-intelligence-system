/**
 * Reusable confirm modal for destructive actions (Task 16)
 */
import { useEffect, useRef } from 'react';
import { IconAlertTriangle } from './Icons';
import './ConfirmModal.css';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'neutral';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const focusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && focusRef.current) {
      focusRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="confirm-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className={`confirm-modal confirm-modal--${variant}`}>
        <div className="confirm-modal-icon">
          <IconAlertTriangle size={32} strokeWidth={2} />
        </div>
        <h2 id="confirm-modal-title" className="confirm-modal-title">
          {title}
        </h2>
        <p id="confirm-modal-desc" className="confirm-modal-message">
          {message}
        </p>
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-modal-cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            ref={focusRef}
            type="button"
            className="confirm-modal-confirm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
