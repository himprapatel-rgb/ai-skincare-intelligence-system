/**
 * Comprehensive mobile detection utilities
 * Detects mobile devices, touch capabilities, and mobile browsers
 */

import { useState, useEffect } from 'react';

type LegacyNavigator = Navigator & {
  vendor?: string;
  msMaxTouchPoints?: number;
  standalone?: boolean;
};

type LegacyWindow = Window & {
  opera?: string;
  MSStream?: unknown;
};

export interface MobileDetection {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTouch: boolean;
  isStandalone: boolean;
  isMobileBrowser: boolean;
  deviceType: 'phone' | 'tablet' | 'desktop';
  screenSize: 'small' | 'medium' | 'large';
}

/**
 * Comprehensive mobile detection hook
 * @returns Object with detailed mobile/device information
 */
export function useMobileDetection(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>(() => 
    getMobileDetection()
  );

  useEffect(() => {
    const handleResize = () => {
      setDetection(getMobileDetection());
    };

    // Listen for orientation changes (mobile-specific)
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return detection;
}

/**
 * Get mobile detection information (can be used outside React)
 */
export function getMobileDetection(): MobileDetection {
  const legacyNavigator = navigator as LegacyNavigator;
  const legacyWindow = window as LegacyWindow;
  const ua = navigator.userAgent || legacyNavigator.vendor || legacyWindow.opera || '';
  const width = window.innerWidth;

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !legacyWindow.MSStream;

  // Detect Android
  const isAndroid = /android/i.test(ua);

  // Detect touch capability
  const isTouch = 
    ('ontouchstart' in window) || 
    (navigator.maxTouchPoints > 0) || 
    ((legacyNavigator.msMaxTouchPoints ?? 0) > 0);

  // Detect standalone mode (PWA)
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    legacyNavigator.standalone === true ||
    document.referrer.includes('android-app://');

  // Detect mobile browser
  const isMobileBrowser = 
    /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(ua);

  // Determine if mobile based on multiple factors
  const isMobile = 
    isMobileBrowser || 
    (width <= 768 && isTouch) ||
    isIOS ||
    isAndroid;

  // Determine device type
  let deviceType: 'phone' | 'tablet' | 'desktop' = 'desktop';
  if (width <= 768) {
    deviceType = 'phone';
  } else if (width <= 1024 && isTouch) {
    deviceType = 'tablet';
  }

  // Determine screen size
  let screenSize: 'small' | 'medium' | 'large' = 'large';
  if (width <= 480) {
    screenSize = 'small';
  } else if (width <= 768) {
    screenSize = 'medium';
  }

  return {
    isMobile,
    isIOS,
    isAndroid,
    isTouch,
    isStandalone,
    isMobileBrowser,
    deviceType,
    screenSize,
  };
}

/**
 * Check if device is in portrait orientation
 */
export function useIsPortrait(): boolean {
  const [isPortrait, setIsPortrait] = useState(
    () => window.innerHeight > window.innerWidth
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return isPortrait;
}

/**
 * Get safe area insets (for notched devices)
 */
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateInsets = () => {
      // Get CSS custom properties set by env()
      const style = getComputedStyle(document.documentElement);
      
      setInsets({
        top: parseInt(style.getPropertyValue('--sat') || '0', 10),
        right: parseInt(style.getPropertyValue('--sar') || '0', 10),
        bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
        left: parseInt(style.getPropertyValue('--sal') || '0', 10),
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);

    return () => window.removeEventListener('resize', updateInsets);
  }, []);

  return insets;
}

/**
 * Detect if keyboard is visible (mobile)
 */
export function useKeyboardVisible(): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const detection = getMobileDetection();
    if (!detection.isMobile) return;

    const initialHeight = window.visualViewport?.height || window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      // Keyboard is visible if viewport shrunk by more than 150px
      setIsVisible(initialHeight - currentHeight > 150);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return isVisible;
}
