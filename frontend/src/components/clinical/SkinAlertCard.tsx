import React from 'react';
import styles from './SkinAlertCard.module.css';

export type SkinAlert = {
  id: number;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  concern: string;
  message: string;
  recommendation: string;
  is_dismissed: boolean;
  created_at: string;
};

type SkinAlertCardProps = {
  alert: SkinAlert;
  onDismiss: (id: number) => void;
};

const SEVERITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

function AlertTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'ingredient':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3h6v11a3 3 0 0 1-3 3v0a3 3 0 0 1-3-3V3z" />
          <path d="M12 17v4" />
          <path d="M8 21h8" />
        </svg>
      );
    case 'environmental':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      );
    case 'skin_change':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
  }
}

const SkinAlertCard: React.FC<SkinAlertCardProps> = ({ alert, onDismiss }) => {
  const isCritical = alert.severity === 'critical';
  const timeAgo = formatTimeAgo(alert.created_at);

  return (
    <div
      className={`${styles.card} ${styles[alert.severity]}`}
      role={isCritical ? 'alert' : undefined}
      aria-label={isCritical ? `Critical alert: ${alert.concern}` : undefined}
    >
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <AlertTypeIcon type={alert.alert_type} />
        </div>
        <div className={styles.headerText}>
          <span className={`${styles.badge} ${styles[`badge_${alert.severity}`]}`}>
            {SEVERITY_LABELS[alert.severity]}
          </span>
          <span className={styles.concern}>{alert.concern}</span>
        </div>
        <button
          className={styles.dismissBtn}
          onClick={() => onDismiss(alert.id)}
          aria-label={`Dismiss alert: ${alert.concern}`}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <p className={styles.message}>{alert.message}</p>
      {alert.recommendation && (
        <div className={styles.recommendation}>
          <strong>Recommendation:</strong> {alert.recommendation}
        </div>
      )}
      <span className={styles.timestamp}>{timeAgo}</span>
    </div>
  );
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default SkinAlertCard;
