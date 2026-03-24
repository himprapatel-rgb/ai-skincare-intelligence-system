/**
 * Network Status Component (Tasks 360-364)
 * Detects offline mode and slow network conditions
 */
import React, { useState, useEffect } from 'react';

interface NetworkStatusProps {
  children?: React.ReactNode;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Task 364: Detect slow network using Network Information API
    const checkNetworkSpeed = () => {
      const connection = (navigator as unknown as { connection?: { effectiveType: string } }).connection;
      if (connection) {
        const slowTypes = ['slow-2g', '2g'];
        setIsSlowNetwork(slowTypes.includes(connection.effectiveType));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check network speed periodically
    checkNetworkSpeed();
    const interval = setInterval(checkNetworkSpeed, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {/* Task 360: Offline banner */}
      {!isOnline && (
        <div className="network-banner offline">
          <span className="network-icon">📡</span>
          <span>You're offline. Some features may not work.</span>
        </div>
      )}

      {/* Task 362: Reconnected notification */}
      {showReconnected && (
        <div className="network-banner reconnected">
          <span className="network-icon">✅</span>
          <span>Back online! Syncing your data...</span>
        </div>
      )}

      {/* Task 364: Slow network warning */}
      {isOnline && isSlowNetwork && (
        <div className="network-banner slow">
          <span className="network-icon">🐢</span>
          <span>Slow network detected. Some features may take longer.</span>
        </div>
      )}

      {children}

      <style>{`
        .network-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          z-index: 9999;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .network-banner.offline {
          background: linear-gradient(135deg, var(--danger-light, #fdeceb), #fee2e2);
          color: var(--danger, #b42318);
          border-bottom: 1px solid #fecaca;
        }

        .network-banner.reconnected {
          background: linear-gradient(135deg, var(--success-light, #e8f7ef), #dcfce7);
          color: var(--success, #1b7f53);
          border-bottom: 1px solid #bbf7d0;
        }

        .network-banner.slow {
          background: linear-gradient(135deg, var(--warning-light, #fff5e6), #fef3c7);
          color: var(--warning, #b97710);
          border-bottom: 1px solid #fde68a;
        }

        .network-icon {
          font-size: 16px;
        }
      `}</style>
    </>
  );
};

export default NetworkStatus;
