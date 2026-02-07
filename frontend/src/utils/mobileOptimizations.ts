/**
 * Mobile-specific optimizations and utilities
 */

type WebkitMessageHandler = {
  postMessage: (message: unknown) => void;
};

type WebkitWindow = Window & {
  webkit?: {
    messageHandlers?: {
      haptic?: WebkitMessageHandler;
    };
  };
};

type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
  mozConnection?: NetworkInformationLike;
  webkitConnection?: NetworkInformationLike;
  standalone?: boolean;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinel>;
  };
};

/**
 * Prevent iOS rubber band scrolling on body
 */
export function preventBodyScroll() {
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
  document.body.style.overflowY = 'scroll';
}

/**
 * Re-enable body scrolling
 */
export function enableBodyScroll() {
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.overflowY = '';
}

/**
 * Disable iOS bounce/rubber band effect
 */
export function disableIOSBounce() {
  document.addEventListener('touchmove', (e) => {
    if ((e.target as HTMLElement).closest('.scrollable')) return;
    e.preventDefault();
  }, { passive: false });
}

/**
 * Prevent pinch-to-zoom on iOS
 */
export function preventPinchZoom() {
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('gesturechange', (e) => e.preventDefault());
  document.addEventListener('gestureend', (e) => e.preventDefault());
}

/**
 * Hide address bar on mobile browsers
 */
export function hideAddressBar() {
  if (!window.location.hash) {
    window.scrollTo(0, 1);
  }
}

/**
 * Lock screen orientation to portrait (if supported)
 */
export async function lockOrientation(orientation: 'portrait' | 'landscape' = 'portrait') {
  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock(orientation);
    }
  } catch (error) {
    void error;
  }
}

/**
 * Unlock screen orientation
 */
export function unlockOrientation() {
  try {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  } catch (error) {
    void error;
  }
}

/**
 * Trigger haptic feedback (iOS/Android)
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  // iOS Haptic Feedback
  const webkitWindow = window as WebkitWindow;
  if (webkitWindow.webkit?.messageHandlers?.haptic) {
    webkitWindow.webkit.messageHandlers.haptic.postMessage(type);
  }
  
  // Web Vibration API (Android)
  if (navigator.vibrate) {
    const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 50;
    navigator.vibrate(duration);
  }
}

/**
 * Request notification permission (mobile-friendly)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  
  if (Notification.permission === 'granted') return true;
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

/**
 * Check if app is installed as PWA
 */
export function isPWAInstalled(): boolean {
  const legacyNavigator = navigator as NavigatorWithConnection;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    legacyNavigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Prompt user to install PWA (if available)
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function setupPWAInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  
  return outcome === 'accepted';
}

/**
 * Optimize images for mobile (reduce quality)
 */
export function getMobileImageUrl(url: string, width = 800): string {
  if (!url) return url;
  
  // Add query params for image optimization services
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w=${width}&q=85&fm=webp`;
}

/**
 * Detect network speed (mobile optimization)
 */
export function getNetworkSpeed(): 'slow' | 'medium' | 'fast' {
  const legacyNavigator = navigator as NavigatorWithConnection;
  const connection = legacyNavigator.connection ||
                     legacyNavigator.mozConnection ||
                     legacyNavigator.webkitConnection;
  
  if (!connection) return 'medium';
  
  const effectiveType = connection.effectiveType;
  
  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return 'slow';
  } else if (effectiveType === '3g') {
    return 'medium';
  } else {
    return 'fast';
  }
}

/**
 * Check if device is in battery saver mode
 */
export function isBatterySaverMode(): boolean {
  const legacyNavigator = navigator as NavigatorWithConnection;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersReducedData = legacyNavigator.connection?.saveData === true;
  
  return prefersReducedMotion || prefersReducedData;
}

/**
 * Optimize for battery saver mode
 */
export function applyBatterySaverOptimizations() {
  if (isBatterySaverMode()) {
    // Disable animations
    document.documentElement.style.setProperty('--animation-duration', '0s');
    
    // Reduce update frequency
    return {
      animationDuration: 0,
      updateInterval: 5000, // 5s instead of 1s
      disableAutoRefresh: true,
    };
  }
  
  return {
    animationDuration: 300,
    updateInterval: 1000,
    disableAutoRefresh: false,
  };
}

/**
 * Share content using Web Share API (mobile)
 */
export async function shareContent(data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  if (!navigator.share) {
    // Fallback to clipboard
    if (data.url) {
      await navigator.clipboard.writeText(data.url);
      return true;
    }
    return false;
  }
  
  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    void error;
    return false;
  }
}

/**
 * Copy to clipboard with mobile feedback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      triggerHaptic('light');
      return true;
    }
    
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    if (success) triggerHaptic('light');
    return success;
  } catch (error) {
    void error;
    return false;
  }
}

/**
 * Wake lock to prevent screen from sleeping (useful for camera/scan)
 */
let wakeLock: WakeLockSentinel | null = null;

export async function requestWakeLock() {
  try {
    const navigatorWithWakeLock = navigator as NavigatorWithWakeLock;
    if (navigatorWithWakeLock.wakeLock) {
      wakeLock = await navigatorWithWakeLock.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        // no-op
      });
    }
  } catch (error) {
    void error;
  }
}

export function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}

/**
 * Check if device supports camera
 */
export async function checkCameraSupport(): Promise<boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'videoinput');
  } catch (error) {
    return false;
  }
}

/**
 * Get optimal camera constraints for mobile
 */
export function getMobileCameraConstraints(facingMode: 'user' | 'environment' = 'user') {
  return {
    video: {
      facingMode,
      width: { ideal: 1280 },
      height: { ideal: 720 },
      aspectRatio: { ideal: 9 / 16 },
    },
    audio: false,
  };
}
