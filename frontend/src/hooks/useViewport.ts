/**
 * Single source of truth for viewport: Desktop | Tablet | Mobile.
 * Breakpoints from constants/viewport.ts; three separate code paths for layout and routing.
 */
import { useState, useEffect } from 'react';
import {
  type Viewport,
  MOBILE_MAX,
  TABLET_MAX,
  VIEWPORT_MEDIA,
} from '../constants/viewport';

export type { Viewport } from '../constants/viewport';

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
    const mobileMq = window.matchMedia(VIEWPORT_MEDIA.mobile);
    const tabletMq = window.matchMedia(VIEWPORT_MEDIA.tablet);
    const desktopMq = window.matchMedia(VIEWPORT_MEDIA.desktop);

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
