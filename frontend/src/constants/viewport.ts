/**
 * Single source of truth for viewport breakpoints.
 * CSS must use the same values: 768px, 1024px, 1025px.
 * See: docs/PROTOCOL-VIEWPORT-SPLIT.md and docs/PLAN-THREE-VIEWPORTS-PRODUCTION.md
 */

export type Viewport = 'desktop' | 'tablet' | 'mobile';

/** Max width for mobile (≤ this = mobile) */
export const MOBILE_MAX = 768;

/** Max width for tablet (769–this = tablet) */
export const TABLET_MAX = 1024;

/** Min width for desktop (≥ this = desktop) */
export const DESKTOP_MIN = TABLET_MAX + 1;

export const VIEWPORT_BREAKPOINTS = {
  MOBILE_MAX,
  TABLET_MAX,
  DESKTOP_MIN,
} as const;

/** Media query strings for matchMedia (JS) */
export const VIEWPORT_MEDIA = {
  mobile: `(max-width: ${MOBILE_MAX}px)`,
  tablet: `(min-width: ${MOBILE_MAX + 1}px) and (max-width: ${TABLET_MAX}px)`,
  desktop: `(min-width: ${DESKTOP_MIN}px)`,
} as const;
