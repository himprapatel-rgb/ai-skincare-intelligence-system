import React, { useState, useEffect } from 'react';
import { IconBell } from '../Icons';
import { useNotificationsOptional } from '../../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import './notifications.css';

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const ctx = useNotificationsOptional();

  useEffect(() => {
    if (ctx?.fetchNotifications) ctx.fetchNotifications();
  }, [ctx]);

  if (!ctx) return null;

  const { unreadCount, notifications, markAllAsRead } = ctx;

  return (
    <div className="notification-bell-container">
      <button
        type="button"
        className="notification-bell app-nav-icon-btn"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <IconBell size={22} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="notification-badge" aria-hidden>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          onClose={() => setIsOpen(false)}
          onMarkAllRead={markAllAsRead}
        />
      )}
    </div>
  );
};

export default NotificationBell;
