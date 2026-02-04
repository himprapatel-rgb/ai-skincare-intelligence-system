/**
 * Task 50: Pull-to-refresh for list pages (Today, Shelf, History).
 * Calls onRefresh when user pulls down past threshold. Optional visual indicator.
 */
import { useCallback, useRef, useState } from 'react';

const PULL_THRESHOLD = 80;
const RESISTANCE = 0.4;

export function usePullToRefresh(onRefresh: () => void | Promise<void>, options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !onRefresh) return;
      const scrollEl = containerRef.current || document.documentElement;
      if (scrollEl.scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        setPulling(true);
      }
    },
    [enabled, onRefresh]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling || !enabled) return;
      const scrollEl = containerRef.current || document.documentElement;
      if (scrollEl.scrollTop > 0) {
        setPulling(false);
        setPullDistance(0);
        return;
      }
      const y = e.touches[0].clientY;
      const diff = y - startY.current;
      if (diff > 0) {
        const distance = Math.min(diff * RESISTANCE, 120);
        setPullDistance(distance);
      }
    },
    [pulling, enabled]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling || !enabled) return;
    setPulling(false);
    if (pullDistance >= PULL_THRESHOLD && onRefresh) {
      setPullDistance(0);
      await Promise.resolve(onRefresh());
    } else {
      setPullDistance(0);
    }
  }, [pulling, pullDistance, enabled, onRefresh]);

  return {
    pullProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    pullDistance,
    setContainerRef: containerRef,
  };
}
