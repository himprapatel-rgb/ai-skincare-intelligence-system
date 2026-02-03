/**
 * Pull-to-refresh for mobile list pages (History, Shelf, Favorites).
 * Call from a scrollable container; when user pulls down from top, triggers onRefresh.
 */
import { useCallback, useRef, useState } from 'react';

const PULL_THRESHOLD = 80;
const RESISTANCE = 0.4;

export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    const el = e.currentTarget;
    scrollTop.current = el.scrollTop;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    const el = e.currentTarget;
    if (el.scrollTop > 0) return;
    const currentY = e.touches[0].clientY;
    const delta = (currentY - startY.current) * RESISTANCE;
    if (delta > 0) {
      setPullDistance(Math.min(delta, PULL_THRESHOLD * 1.2));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      Promise.resolve(onRefresh()).finally(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh]);

  return { pullDistance, isRefreshing, handleTouchStart, handleTouchMove, handleTouchEnd };
}
