/**
 * RouteLoadingBar - Task 10001 B4
 * Thin top progress bar during route transitions
 */
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './RouteLoadingBar.css';

export function RouteLoadingBar() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 400);
    return () => clearTimeout(t);
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div
      className="route-loading-bar"
      role="progressbar"
      aria-hidden="true"
      aria-label="Loading"
    />
  );
}
