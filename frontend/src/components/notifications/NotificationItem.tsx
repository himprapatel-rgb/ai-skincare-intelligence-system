import React from 'react';
import type { NotificationRecord } from '../../services/notificationService';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import './notifications.css';

const NOTIFICATION_ICONS: Record<string, string> = {
  routine_morning: '☀️',
  routine_evening: '🌙',
  weekly_report: '📊',
  product_recommendation: '🎁',
  product_expiry: '⚠️',
  achievement: '🏆',
  scan_complete: '✅',
  tip: '💡',
  reminder: '⏰',
  progress: '📈',
  alert: '⚠️',
  info: '💡',
};

interface NotificationItemProps {
  notification: NotificationRecord;
  onClick?: () => void;
  compact?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  compact = false,
}) => {
  const { type, title, message, created_at, read, action_url } = notification;
  const icon = NOTIFICATION_ICONS[type] ?? '🔔';

  return (
    <button
      type="button"
      className={`notification-item-btn ${read ? 'read' : 'unread'} ${compact ? 'compact' : ''}`}
      onClick={onClick}
      aria-label={title}
    >
      <span className="notification-item-dot" aria-hidden>
        {!read && <span className="notification-item-dot-inner" />}
      </span>
      <span className="notification-item-icon" aria-hidden>
        {icon}
      </span>
      <div className="notification-item-body">
        <span className="notification-item-title">{title}</span>
        <span className="notification-item-message">{message}</span>
        <span className="notification-item-time">{formatRelativeTime(created_at)}</span>
      </div>
      {action_url && !compact && (
        <span className="notification-item-chevron" aria-hidden>›</span>
      )}
    </button>
  );
};

export default NotificationItem;
