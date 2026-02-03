/**
 * Reusable error card for mobile app: one primary recovery action.
 * Use for page-level or section-level errors (Scan failure, load error, etc.).
 */
import { ReactNode } from 'react';
import { IconAlertTriangle } from './Icons';
import './ErrorCard.css';

export interface ErrorCardProps {
  title?: string;
  message: string;
  /** Primary action label, e.g. "Retry" or "Go back" */
  actionLabel: string;
  onAction: () => void;
  /** Optional secondary action */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Optional icon (default: alert triangle) */
  icon?: ReactNode;
  /** Optional class for container */
  className?: string;
}

export function ErrorCard({
  title = "We couldn't load this",
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  icon,
  className = '',
}: ErrorCardProps) {
  return (
    <div className={`error-card app-card ${className}`} role="alert">
      <div className="error-card-icon">
        {icon ?? <IconAlertTriangle size={48} strokeWidth={2} />}
      </div>
      <h2 className="error-card-title">{title}</h2>
      <p className="error-card-message">{message}</p>
      <div className="error-card-actions">
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
        {secondaryLabel && onSecondary && (
          <button type="button" className="btn btn-secondary" onClick={onSecondary}>
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
