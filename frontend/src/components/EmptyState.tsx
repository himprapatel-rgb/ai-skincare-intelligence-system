/**
 * Task 51: Reusable EmptyState component for list pages
 */
import { ReactNode } from 'react';
import './EmptyState.css';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  guidance?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  guidance,
  actionLabel,
  onAction,
  children,
}: EmptyStateProps) {
  return (
    <div className="empty-state" data-empty-state>
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {guidance && <div className="empty-state-guidance">{guidance}</div>}
      {children}
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary empty-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
