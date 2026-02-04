import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NotificationRecord } from '../../services/notificationService';
import NotificationItem from './NotificationItem';
import './notifications.css';

interface NotificationDropdownProps {
  notifications: NotificationRecord[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onItemClick?: (notification: NotificationRecord) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onClose,
  onMarkAllRead,
  onItemClick,
}) => {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const recent = notifications.slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleItemClick = (n: NotificationRecord) => {
    onItemClick?.(n);
    onClose();
    if (n.action_url) navigate(n.action_url);
  };

  const isEmpty = recent.length === 0;

  return (
    <div className={`notification-dropdown ${isEmpty ? 'notification-dropdown--empty' : ''}`} ref={panelRef}>
      <div className="notification-dropdown-header">
        <h3 className="notification-dropdown-title">Notifications</h3>
        {notifications.some((n) => !n.read) && (
          <button
            type="button"
            className="notification-dropdown-mark-all"
            onClick={onMarkAllRead}
          >
            Mark all as read
          </button>
        )}
      </div>
      <div className="notification-dropdown-list">
        {isEmpty ? (
          <div className="notification-dropdown-empty">
            <p>No notifications yet</p>
          </div>
        ) : (
          recent.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              compact
              onClick={() => handleItemClick(n)}
            />
          ))
        )}
      </div>
      <button
        type="button"
        className="notification-dropdown-view-all"
        onClick={() => {
          onClose();
          navigate('/notifications');
        }}
      >
        View all
      </button>
    </div>
  );
};

export default NotificationDropdown;
