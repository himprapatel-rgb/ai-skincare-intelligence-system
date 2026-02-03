/**
 * Notification preferences (reminder toggles and times).
 * Persisted in localStorage; can be wired to backend push later.
 */

const STORAGE_KEY = 'pellicura_notification_prefs';

export interface NotificationPrefs {
  morningRoutine: boolean;
  morningTime: string;   // "HH:mm"
  eveningRoutine: boolean;
  eveningTime: string;
  weeklyReport: boolean;
  productExpiry: boolean;
}

const DEFAULTS: NotificationPrefs = {
  morningRoutine: true,
  morningTime: '08:00',
  eveningRoutine: true,
  eveningTime: '21:00',
  weeklyReport: true,
  productExpiry: true,
};

export function getNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      morningRoutine: parsed.morningRoutine ?? DEFAULTS.morningRoutine,
      morningTime: parsed.morningTime ?? DEFAULTS.morningTime,
      eveningRoutine: parsed.eveningRoutine ?? DEFAULTS.eveningRoutine,
      eveningTime: parsed.eveningTime ?? DEFAULTS.eveningTime,
      weeklyReport: parsed.weeklyReport ?? DEFAULTS.weeklyReport,
      productExpiry: parsed.productExpiry ?? DEFAULTS.productExpiry,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setNotificationPrefs(prefs: Partial<NotificationPrefs>): void {
  const current = getNotificationPrefs();
  const next = { ...current, ...prefs };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('Failed to save notification prefs', e);
  }
}
