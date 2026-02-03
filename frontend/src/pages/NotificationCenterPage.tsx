import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconBell, IconCheck, IconX, IconSettings, IconClock, IconTrendingUp, IconAlertCircle, IconInfo, IconChevronRight } from '../components/Icons';
import { useNotifications } from '../context/NotificationContext';
import type { NotificationRecord } from '../services/notificationService';
import './NotificationCenterPage.css';

type FilterType = 'all' | 'unread' | 'reminder' | 'progress' | 'alert';

/**
 * Notification Center Page (FR40 from SRS)
 * Central hub for all user notifications; uses NotificationContext for data and actions.
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

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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

  return (
    <div className="notification-center-page app-page">
      <header className="app-header-card">
        <h1>
          <IconBell size={24} strokeWidth={2} className="notif-header-icon" aria-hidden />
          Notifications
        </h1>
        <p className="app-header-subtitle">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </p>
        <div className="notif-header-actions">
          {unreadCount > 0 && (
            <button type="button" onClick={markAllAsRead} className="btn-mark-all">
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="btn-settings"
            aria-label={showSettings ? 'Close settings' : 'Notification settings'}
          >
            <IconSettings size={20} strokeWidth={2} />
          </button>
        </div>
      </header>
      <div className="app-page-content">
        {showSettings && (
          <div className="app-card settings-card">
            <h2 className="settings-card-title">Notification preferences</h2>
            <div className="settings-card-body">
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  Routine reminders
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  Progress updates
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  Product recommendations
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  Skin change alerts
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="notification-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button 
            className={`filter-btn ${filter === 'reminder' ? 'active' : ''}`}
            onClick={() => setFilter('reminder')}
          >
            Reminders
          </button>
          <button 
            className={`filter-btn ${filter === 'progress' ? 'active' : ''}`}
            onClick={() => setFilter('progress')}
          >
            Progress
          </button>
          <button 
            className={`filter-btn ${filter === 'alert' ? 'active' : ''}`}
            onClick={() => setFilter('alert')}
          >
            Alerts
          </button>
        </div>

        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="app-card app-empty-state" role="status">
              <div className="app-empty-state-icon"><IconBell size={32} strokeWidth={2} aria-hidden /></div>
              <h3>No notifications yet</h3>
              <p>Reminders, progress updates, and tips will appear here.</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                style={
                  {
                    '--notification-color': getNotificationColor(notification.type),
                  } as React.CSSProperties
                }
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-header">
                    <h3>{notification.title}</h3>
                    <span className="notification-time">
                      {new Date(notification.created_at).toLocaleDateString('en', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  {notification.action_url && (
                    <Link to={notification.action_url} className="notification-action">
                      View details <IconChevronRight size={16} strokeWidth={2} className="icon-inline-right" />
                    </Link>
                  )}
                </div>
                <div className="notification-actions">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="btn-action"
                      title="Mark as read"
                    >
                      <IconCheck size={18} strokeWidth={2} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="btn-action btn-delete"
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
