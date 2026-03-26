/**
 * Global notification state for header bell and Notification Center page.
 * Powered by TanStack Query.
 */
import React, { createContext, useCallback, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { queryKeys } from '../api/queryKeys';
import {
  getNotifications,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
  type NotificationRecord,
} from '../services/notificationService';

interface NotificationContextValue {
  notifications: NotificationRecord[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/* eslint-disable react-refresh/only-export-components -- context hooks */
export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}

export function useNotificationsOptional(): NotificationContextValue | null {
  return useContext(NotificationContext);
}

type Props = { children: React.ReactNode };

interface NotificationsData {
  notifications: NotificationRecord[];
  unread_count: number;
}

export function NotificationProvider({ children }: Props) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const notifQueryKey = queryKeys.notifications.list(user?.id ?? 0);

  const { data, isLoading } = useQuery<NotificationsData>({
    queryKey: notifQueryKey,
    queryFn: async () => {
      const res = await getNotifications({ limit: 50 });
      return res;
    },
    enabled: !!isAuthenticated && !!user,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    await queryClient.invalidateQueries({ queryKey: notifQueryKey });
  }, [isAuthenticated, user, queryClient, notifQueryKey]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    queryClient.setQueryData<NotificationsData>(notifQueryKey, (old) => {
      if (!old) return old;
      return {
        notifications: old.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        unread_count: Math.max(0, old.unread_count - 1),
      };
    });
    try {
      await apiMarkAsRead(id);
    } catch {
      // Already applied optimistically
    }
  }, [queryClient, notifQueryKey]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    queryClient.setQueryData<NotificationsData>(notifQueryKey, (old) => {
      if (!old) return old;
      return {
        notifications: old.notifications.map((n) => ({ ...n, read: true })),
        unread_count: 0,
      };
    });
    try {
      await apiMarkAllAsRead();
    } catch {
      // Already applied optimistically
    }
  }, [queryClient, notifQueryKey]);

  const deleteNotification = useCallback(async (id: string) => {
    // Optimistic update
    queryClient.setQueryData<NotificationsData>(notifQueryKey, (old) => {
      if (!old) return old;
      const wasUnread = old.notifications.find((n) => n.id === id)?.read === false;
      return {
        notifications: old.notifications.filter((n) => n.id !== id),
        unread_count: wasUnread ? Math.max(0, old.unread_count - 1) : old.unread_count,
      };
    });
    try {
      await apiDeleteNotification(id);
    } catch {
      // Already applied optimistically
    }
  }, [queryClient, notifQueryKey]);

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    loading: isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
