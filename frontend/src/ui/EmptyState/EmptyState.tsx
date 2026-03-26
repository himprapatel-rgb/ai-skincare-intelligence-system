import React from 'react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className = '' }, ref) => {
    return (
      <div ref={ref} className={`${styles.container} ${className}`}>
        {icon && (
          <div className={styles.icon} aria-hidden="true">
            {icon}
          </div>
        )}
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
        {action && <div className={styles.action}>{action}</div>}
      </div>
    );
  },
);

EmptyState.displayName = 'EmptyState';
