/**
 * Returns the width and height of a container element (for 3D canvas sizing).
 * Updates on resize. Pass isActive true when the container is mounted so the effect re-runs and measures.
 */
import { useState, useEffect, RefObject } from 'react';

export function useContainerSize(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean = true
): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!isActive) return;
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, isActive]);

  return size;
}
