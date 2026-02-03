/**
 * Notification API service.
 * Aligns with backend: GET/PATCH/DELETE /api/v1/notifications
 */
import { api } from './api';

export interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string | null;
  read: boolean;
  created_at: string;
  read_at?: string | null;
}

export interface NotificationsListResponse {
  notifications: NotificationRecord[];
  total: number;
  unread_count: number;
}

export async function getNotifications(params?: {
  filter_type?: string;
  unread_only?: boolean;
  limit?: number;
}): Promise<NotificationsListResponse> {
  const { data } = await api.get<NotificationsListResponse>('/notifications', { params });
  const raw = (data.notifications || []) as unknown as Array<Record<string, unknown>>;
  return {
    ...data,
    notifications: raw.map((n) => ({
      id: String(n.id ?? ''),
      type: String(n.type ?? 'info'),
      title: String(n.title ?? ''),
      message: String(n.message ?? ''),
      action_url: n.action_url as string | undefined | null,
      read: Boolean(n.read),
      created_at: String(n.created_at ?? ''),
      read_at: n.read_at as string | undefined | null,
    })),
  };
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
