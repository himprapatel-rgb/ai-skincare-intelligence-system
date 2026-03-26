import { useState, useEffect } from 'react';

/**
 * Detect if the mobile keyboard is visible.
 * Uses visualViewport API to compare current height vs initial height.
 * Returns false on desktop or when keyboard is hidden.
 */
export function useKeyboardVisible(): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only relevant on touch devices
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0;
    if (!isTouch) return;

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
