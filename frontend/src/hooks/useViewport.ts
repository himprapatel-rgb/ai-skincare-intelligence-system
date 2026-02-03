/**
 * Single source of truth for viewport: Desktop | Tablet | Mobile.
 * Ensures three separate code paths for layout and routing.
 *
 * Breakpoints (align with existing CSS):
 * - Mobile:  ≤ 768px
 * - Tablet:  769px – 1024px
 * - Desktop: ≥ 1025px
 */
import { useState, useEffect } from 'react';

export type Viewport = 'desktop' | 'tablet' | 'mobile';

const MOBILE_MAX = 768;
const TABLET_MAX = 1024;

function getViewport(): Viewport {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w <= MOBILE_MAX) return 'mobile';
  if (w <= TABLET_MAX) return 'tablet';
  return 'desktop';
}

export function useViewport(): Viewport {
  const [viewport, setViewport] = useState<Viewport>(getViewport);

  useEffect(() => {
    const mobileMq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    const tabletMq = window.matchMedia(`(min-width: ${MOBILE_MAX + 1}px) and (max-width: ${TABLET_MAX}px)`);
    const desktopMq = window.matchMedia(`(min-width: ${TABLET_MAX + 1}px)`);

    const update = () => setViewport(getViewport());
    mobileMq.addEventListener('change', update);
    tabletMq.addEventListener('change', update);
    desktopMq.addEventListener('change', update);
    update();
    return () => {
      mobileMq.removeEventListener('change', update);
      tabletMq.removeEventListener('change', update);
      desktopMq.removeEventListener('change', update);
    };
  }, []);

  return viewport;
}

export function isMobileViewport(viewport: Viewport): boolean {
  return viewport === 'mobile';
}

export function isTabletViewport(viewport: Viewport): boolean {
  return viewport === 'tablet';
}

export function isDesktopViewport(viewport: Viewport): boolean {
  return viewport === 'desktop';
}
