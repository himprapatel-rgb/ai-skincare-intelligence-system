/**
 * Returns true when viewport is mobile or tablet (≤1024px).
 * Used to show 3D face scan only on mobile/tablet.
 */
import { useViewport } from './useViewport';

export function useIsMobileOrTablet(): boolean {
  const viewport = useViewport();
  return viewport === 'mobile' || viewport === 'tablet';
}
