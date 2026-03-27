/**
 * Push notification subscription management.
 * Registers service worker, requests permission, and syncs subscription to backend.
 */
import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';

const SW_PATH = '/service-worker.js';
const PUSH_ENABLED_KEY = 'push_notifications_enabled';

/** Check if push notifications are supported */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** Check current permission state */
export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/** Check if the user has opted into push */
export function isPushEnabled(): boolean {
  return localStorage.getItem(PUSH_ENABLED_KEY) === 'true';
}

/** Register service worker (idempotent) */
async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (reg) return reg;
  return navigator.serviceWorker.register(SW_PATH, { scope: '/' });
}

/** Subscribe to push notifications. Returns true on success. */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const registration = await ensureServiceWorker();
    await navigator.serviceWorker.ready;

    // Get or create push subscription
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      // Use a VAPID public key if available, otherwise use a placeholder
      // In production, set VITE_VAPID_PUBLIC_KEY env var
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (vapidKey) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        });
      } else {
        // Without VAPID key, we can still register the SW for local notifications
        localStorage.setItem(PUSH_ENABLED_KEY, 'true');
        return true;
      }
    }

    // Send subscription to backend
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token && subscription) {
      await fetch(`${API_BASE_URL}/notifications/push-subscription`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription.toJSON()),
      }).catch(() => {}); // Non-blocking
    }

    localStorage.setItem(PUSH_ENABLED_KEY, 'true');
    return true;
  } catch {
    return false;
  }
}

/** Unsubscribe from push notifications */
export async function unsubscribeFromPush(): Promise<void> {
  localStorage.setItem(PUSH_ENABLED_KEY, 'false');
  try {
    const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
    }
  } catch {
    // Ignore errors during cleanup
  }
}

/** Show a local notification (doesn't require push subscription) */
export async function showLocalNotification(title: string, body: string, url = '/dashboard'): Promise<void> {
  if (Notification.permission !== 'granted') return;
  try {
    const registration = await ensureServiceWorker();
    await registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      data: { url },
      tag: 'pellicura-local-' + Date.now(),
    });
  } catch {
    // Fallback to Notification API
    new Notification(title, { body, icon: '/icon-192.png' });
  }
}

/** Convert VAPID base64 key to Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}
