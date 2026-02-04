/**
 * Device & environment context for web app.
 * Collects whatever the browser allows (with permissions where needed)
 * so we can use it like an "actual app" for scan quality, recommendations, and analytics.
 */

export interface DeviceContext {
  /** Collected without any permission */
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    pixelRatio: number;
    colorDepth: number;
    orientation: string;
    /** CSS media: is touch-primary device */
    touchPrimary: boolean;
  };
  /** Language and locale */
  locale: {
    language: string;
    languages: string[];
    timezone: string;
    timezoneOffsetMinutes: number;
  };
  /** Device capability hints (when available) */
  device: {
    platform: string;
    /** Approx. RAM in GB (Chrome only) */
    deviceMemory?: number;
    /** CPU cores (approx) */
    hardwareConcurrency: number;
    /** Connection type when available */
    connection?: { effectiveType: string; downlink?: number; rtt?: number };
    cookieEnabled: boolean;
    doNotTrack: string | null;
  };
  /** Only set after permission granted */
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    /** Optional city/country if we reverse-geocode later */
    label?: string;
  };
  /** Only set after permission / when supported (e.g. iOS 13+) */
  motion?: {
    /** Rough "is device stable" for scan quality */
    stable: boolean;
    beta?: number;
    gamma?: number;
    alpha?: number;
  };
  /** Ambient light in lux (experimental; limited browser support) */
  ambientLight?: number;
  /** Timestamp when context was gathered */
  collectedAt: string;
}

function getScreenContext(): DeviceContext['screen'] {
  if (typeof window === 'undefined' || !window.screen) {
    return {
      width: 0,
      height: 0,
      availWidth: 0,
      availHeight: 0,
      pixelRatio: 1,
      colorDepth: 24,
      orientation: 'unknown',
      touchPrimary: false,
    };
  }
  const s = window.screen;
  const orientation =
    s.orientation?.type ??
    (s.width > s.height ? 'landscape-primary' : 'portrait-primary');
  const touchPrimary =
    typeof navigator !== 'undefined' &&
    (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
  return {
    width: s.width,
    height: s.height,
    availWidth: s.availWidth,
    availHeight: s.availHeight,
    pixelRatio: window.devicePixelRatio ?? 1,
    colorDepth: s.colorDepth ?? 24,
    orientation,
    touchPrimary,
  };
}

function getLocaleContext(): DeviceContext['locale'] {
  const language = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage || 'en';
  const languages = Array.isArray(navigator.languages) ? [...navigator.languages] : [language];
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const timezoneOffsetMinutes = -now.getTimezoneOffset();
  return {
    language,
    languages,
    timezone,
    timezoneOffsetMinutes,
  };
}

function getDeviceContext(): DeviceContext['device'] {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string; downlink?: number; rtt?: number };
  };
  return {
    platform: nav.platform || 'unknown',
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency ?? 0,
    connection: nav.connection
      ? {
          effectiveType: nav.connection.effectiveType ?? 'unknown',
          downlink: nav.connection.downlink,
          rtt: nav.connection.rtt,
        }
      : undefined,
    cookieEnabled: nav.cookieEnabled,
    doNotTrack: nav.doNotTrack ?? null,
  };
}

/**
 * Collect everything we can without asking for permission.
 * Safe to call on page load.
 */
export function collectDeviceContextSync(): Omit<DeviceContext, 'location' | 'motion' | 'ambientLight'> {
  return {
    screen: getScreenContext(),
    locale: getLocaleContext(),
    device: getDeviceContext(),
    collectedAt: new Date().toISOString(),
  };
}

/**
 * Request geolocation (coarse or precise). Resolves to undefined if denied or unsupported.
 */
export function requestLocationContext(): Promise<DeviceContext['location'] | undefined> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(undefined);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => resolve(undefined),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

/**
 * One-time read of device orientation (for scan steadiness).
 * On iOS 13+ requires user gesture + permission. Resolves to undefined if not available.
 */
export function requestMotionContext(): Promise<DeviceContext['motion'] | undefined> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) {
      resolve(undefined);
      return;
    }
    const handler = (e: DeviceOrientationEvent) => {
      window.removeEventListener('deviceorientation', handler);
      const beta = e.beta ?? 0;
      const gamma = e.gamma ?? 0;
      const alpha = e.alpha ?? 0;
      const stable = Math.abs(beta) < 15 && Math.abs(gamma) < 15;
      resolve({
        stable,
        beta,
        gamma,
        alpha,
      });
    };
    window.addEventListener('deviceorientation', handler);
    setTimeout(() => {
      window.removeEventListener('deviceorientation', handler);
      resolve(undefined);
    }, 3000);
  });
}

/**
 * Read ambient light if the API exists and is allowed (very limited support).
 */
export function requestAmbientLightContext(): Promise<number | undefined> {
  return new Promise((resolve) => {
    const w = window as Window & {
      AmbientLightSensor?: new () => {
        illuminance: number;
        start: () => void;
        addEventListener: (type: string, fn: () => void) => void;
      };
    };
    if (!w.AmbientLightSensor) {
      resolve(undefined);
      return;
    }
    try {
      const sensor = new w.AmbientLightSensor();
      sensor.addEventListener('reading', () => {
        resolve(sensor.illuminance);
      });
      sensor.start();
      setTimeout(() => resolve(undefined), 2000);
    } catch {
      resolve(undefined);
    }
  });
}

/**
 * Full context: sync data + optional location/motion/light after permissions.
 * Call this when you need full context (e.g. before scan or when user opts in).
 */
export async function collectFullDeviceContext(options?: {
  requestLocation?: boolean;
  requestMotion?: boolean;
  requestAmbientLight?: boolean;
}): Promise<DeviceContext> {
  const base = collectDeviceContextSync();
  const [location, motion, ambientLight] = await Promise.all([
    options?.requestLocation ? requestLocationContext() : Promise.resolve(undefined),
    options?.requestMotion ? requestMotionContext() : Promise.resolve(undefined),
    options?.requestAmbientLight ? requestAmbientLightContext() : Promise.resolve(undefined),
  ]);
  return {
    ...base,
    ...(location && { location }),
    ...(motion && { motion }),
    ...(ambientLight != null && { ambientLight }),
  };
}
