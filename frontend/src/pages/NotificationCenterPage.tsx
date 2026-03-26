import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconBell, IconCheck, IconX, IconSettings, IconClock, IconTrendingUp, IconAlertCircle, IconInfo, IconChevronRight, IconArrowLeft } from '../components/Icons';
import { useNotifications } from '../context/NotificationContext';
import type { NotificationRecord } from '../services/notificationService';
import { getNotificationPrefs, setNotificationPrefs, type NotificationPrefs } from '../utils/notificationPreferences';
import styles from './NotificationCenterPage.module.css';

type FilterType = 'all' | 'unread' | 'reminder' | 'progress' | 'alert';

/**
 * Notification Center Page (FR40 from SRS)
 * Central hub for all user notifications; uses NotificationContext for data and actions.
 * Settings: morning/evening routine reminders (with times), weekly report, product expiry.
 */
const NotificationCenterPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>(getNotificationPrefs);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const updatePref = (key: keyof NotificationPrefs, value: boolean | string) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setNotificationPrefs(next);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return <IconClock size={20} strokeWidth={2} />;
      case 'progress':
        return <IconTrendingUp size={20} strokeWidth={2} />;
      case 'alert':
        return <IconAlertCircle size={20} strokeWidth={2} />;
      case 'info':
        return <IconInfo size={20} strokeWidth={2} />;
      default:
        return <IconBell size={20} strokeWidth={2} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'reminder':
        return 'var(--primary)';
      case 'progress':
        return 'var(--primary)';
      case 'alert':
        return 'var(--warning)';
      case 'info':
        return 'var(--text-secondary)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const filteredNotifications = notifications.filter((n: NotificationRecord) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: `Unread (${unreadCount})` },
    { key: 'reminder', label: 'Reminders' },
    { key: 'progress', label: 'Progress' },
    { key: 'alert', label: 'Alerts' },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/me" className={styles.backLink} aria-label="Back to profile">
          <IconArrowLeft size={24} strokeWidth={2} />
        </Link>
        <div className={styles.headerText}>
          <h1 className={styles.headerTitle}>
            <IconBell size={24} strokeWidth={2} className={styles.headerIcon} aria-hidden />
            Notifications
          </h1>
          <p className={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
          <div className={styles.headerActions}>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllAsRead} className={styles.btnMarkAll}>
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={styles.btnSettings}
              aria-label={showSettings ? 'Close settings' : 'Notification settings'}
            >
              <IconSettings size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        {showSettings && (
          <div className={styles.settingsCard}>
            <h2 className={styles.settingsTitle}>Notification preferences</h2>
            <p className={styles.settingsDesc}>Choose when you want reminders. Times are used when we send push notifications.</p>
            <div>
              <div className={styles.settingItemWithTime}>
                <label className={styles.settingToggle}>
                  <input
                    type="checkbox"
                    checked={prefs.morningRoutine}
                    onChange={(e) => updatePref('morningRoutine', e.target.checked)}
                  />
                  <span className={styles.settingLabel}>Morning routine reminder</span>
                </label>
                <input
                  type="time"
                  className={styles.settingTime}
                  value={prefs.morningTime}
                  onChange={(e) => updatePref('morningTime', e.target.value)}
                  disabled={!prefs.morningRoutine}
                  aria-label="Morning reminder time"
                />
              </div>
              <div className={styles.settingItemWithTime}>
                <label className={styles.settingToggle}>
                  <input
                    type="checkbox"
                    checked={prefs.eveningRoutine}
                    onChange={(e) => updatePref('eveningRoutine', e.target.checked)}
                  />
                  <span className={styles.settingLabel}>Evening routine reminder</span>
                </label>
                <input
                  type="time"
                  className={styles.settingTime}
                  value={prefs.eveningTime}
                  onChange={(e) => updatePref('eveningTime', e.target.value)}
                  disabled={!prefs.eveningRoutine}
                  aria-label="Evening reminder time"
                />
              </div>
              <div className={styles.settingItem}>
                <label className={styles.settingToggle}>
                  <input
                    type="checkbox"
                    checked={prefs.weeklyReport}
                    onChange={(e) => updatePref('weeklyReport', e.target.checked)}
                  />
                  <span className={styles.settingLabel}>Weekly skin report</span>
                </label>
              </div>
              <div className={styles.settingItem}>
                <label className={styles.settingToggle}>
                  <input
                    type="checkbox"
                    checked={prefs.productExpiry}
                    onChange={(e) => updatePref('productExpiry', e.target.checked)}
                  />
                  <span className={styles.settingLabel}>Product expiry alerts</span>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className={styles.filters}>
          {filterButtons.map((fb) => (
            <button
              key={fb.key}
              className={filter === fb.key ? styles.filterBtnActive : styles.filterBtn}
              onClick={() => setFilter(fb.key)}
            >
              {fb.label}
            </button>
          ))}
        </div>

        <div className={styles.list}>
          {filteredNotifications.length === 0 ? (
            <div className={styles.emptyState} role="status">
              <div className={styles.emptyIcon}><IconBell size={32} strokeWidth={2} aria-hidden /></div>
              <h3>No notifications yet</h3>
              <p>Reminders, progress updates, and tips will appear here.</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={notification.read ? styles.notifItem : styles.notifItemUnread}
                style={
                  {
                    '--notification-color': getNotificationColor(notification.type),
                  } as React.CSSProperties
                }
              >
                <div className={styles.notifIcon}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className={styles.notifContent}>
                  <div className={styles.notifHeader}>
                    <h3>{notification.title}</h3>
                    <span className={styles.notifTime}>
                      {new Date(notification.created_at).toLocaleDateString('en', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className={styles.notifMessage}>{notification.message}</p>
                  {notification.action_url && (
                    <Link to={notification.action_url} className={styles.notifAction}>
                      View details <IconChevronRight size={16} strokeWidth={2} className={styles.iconInlineRight} />
                    </Link>
                  )}
                </div>
                <div className={styles.notifActions}>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className={styles.btnAction}
                      title="Mark as read"
                    >
                      <IconCheck size={18} strokeWidth={2} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className={`${styles.btnAction} ${styles.btnDelete}`}
                    title="Delete"
                  >
                    <IconX size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenterPage;
