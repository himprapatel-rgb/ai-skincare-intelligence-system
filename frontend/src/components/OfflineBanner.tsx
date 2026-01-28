/**
 * Task 41: Offline / connection-lost message
 */
import { useState, useEffect } from 'react';
import { IconAlertTriangle } from './Icons';
import './OfflineBanner.css';

export function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="offline-banner" role="alert" aria-live="assertive">
      <IconAlertTriangle size={20} strokeWidth={2} className="offline-banner-icon" aria-hidden />
      <span>You are offline. Some features may be unavailable until you reconnect.</span>
    </div>
  );
}
