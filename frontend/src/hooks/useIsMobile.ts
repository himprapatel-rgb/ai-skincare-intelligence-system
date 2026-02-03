/**
 * Returns true when viewport is mobile (<=768px).
 * Used to keep desktop/tablet and mobile code separate: we only apply
 * mobile app-shell and TODAY hub on small viewports; desktop gets full homepage.
 */
import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

function getIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isMobile;
}
