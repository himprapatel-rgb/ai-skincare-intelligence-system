import React from 'react';
import { SkinAlert } from './SkinAlertCard';
import styles from './AlertBanner.module.css';

type AlertBannerProps = {
  alerts: SkinAlert[];
  onDismiss: (id: number) => void;
};

const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onDismiss }) => {
  const criticalAlerts = alerts.filter(
    (a) => (a.severity === 'critical' || a.severity === 'high') && !a.is_dismissed
  );

  if (criticalAlerts.length === 0) return null;

  return (
    <div className={styles.banner} role="alert" aria-live="assertive">
      <div className={styles.inner}>
        <div className={styles.icon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className={styles.content}>
          <span className={styles.title}>
            {criticalAlerts.length} Active Alert{criticalAlerts.length !== 1 ? 's' : ''}
          </span>
          <ul className={styles.list}>
            {criticalAlerts.map((alert) => (
              <li key={alert.id} className={styles.item}>
                <span className={styles.itemText}>
                  <strong>{alert.concern}:</strong> {alert.message}
                </span>
                <button
                  className={styles.dismissBtn}
                  onClick={() => onDismiss(alert.id)}
                  aria-label={`Dismiss: ${alert.concern}`}
                  type="button"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AlertBanner;
