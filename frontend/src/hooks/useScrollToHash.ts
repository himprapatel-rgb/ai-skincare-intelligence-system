import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls to the element matching the URL hash on mount and when hash changes.
 * Fixes SPA anchor links (e.g. /privacy#delete, /about#whats-new).
 */
export function useScrollToHash(): void {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    if (!id) return;

    const scroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    requestAnimationFrame(() => {
      scroll();
    });
  }, [hash]);
}
