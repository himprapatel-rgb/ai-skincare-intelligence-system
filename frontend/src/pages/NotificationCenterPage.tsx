import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconBell, IconCheck, IconX, IconSettings, IconClock, IconTrendingUp, IconAlertCircle, IconInfo, IconChevronRight } from '../components/Icons';
import './NotificationCenterPage.css';

interface Notification {
  id: string;
  type: 'reminder' | 'progress' | 'alert' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

/**
 * Notification Center Page (FR40 from SRS)
 * Central hub for all user notifications
 */
const NotificationCenterPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'reminder' | 'progress' | 'alert'>('all');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/v1/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications.map((n: Record<string, unknown>) => ({
          id: String(n.id ?? ''),
          type: String(n.type ?? 'info'),
          title: String(n.title ?? ''),
          message: String(n.message ?? ''),
          timestamp: String(n.created_at ?? ''),
          read: Boolean(n.read),
          actionUrl: n.action_url as string | undefined,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      // Keep empty state if API fails
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error('Failed to mark as read:', err);
      // Still update UI
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/v1/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
      setNotifications(notifications.filter(n => n.id !== id));
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
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

  const getNotificationColor = (type: Notification['type']) => {
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

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-center-page">
      <div className="notification-container">
        <div className="page-header">
          <div className="header-content">
            <h1>
              <IconBell size={32} strokeWidth={2} className="icon-inline-lg" />
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} unread</span>
            )}
          </div>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="btn-mark-all">
                Mark all as read
              </button>
            )}
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="btn-settings"
            >
              <IconSettings size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        {showSettings && (
          <div className="card settings-card">
            <div className="card-header">
              <h2>Notification Settings</h2>
            </div>
            <div className="card-content">
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

        {/* Filters */}
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

        {/* Notifications List */}
        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <IconBell size={64} strokeWidth={2} />
              <h3>No notifications</h3>
              <p>You're all caught up!</p>
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
                      {new Date(notification.timestamp).toLocaleDateString('en', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  {notification.actionUrl && (
                    <Link to={notification.actionUrl} className="notification-action">
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
