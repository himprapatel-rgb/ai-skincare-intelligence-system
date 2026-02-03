/**
 * Returns true when viewport is mobile (≤768px).
 * Backed by useViewport() so Desktop / Tablet / Mobile stay in sync.
 */
import { useViewport } from './useViewport';

export function useIsMobile(): boolean {
  const viewport = useViewport();
  return viewport === 'mobile';
}
