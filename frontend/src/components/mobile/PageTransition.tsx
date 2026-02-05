/**
 * Page Transition Component
 * Smooth animations between page navigation (iOS/Android style)
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

interface PageTransitionProps {
  children: React.ReactNode;
  type?: 'slide' | 'fade' | 'scale' | 'slideUp';
  duration?: number;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  type = 'slide',
  duration = 300,
}) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'entering' | 'entered' | 'exiting'>('entered');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('exiting');
    }
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitionStage === 'exiting') {
      const timeout = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('entering');
      }, duration);

      return () => clearTimeout(timeout);
    } else if (transitionStage === 'entering') {
      const timeout = setTimeout(() => {
        setTransitionStage('entered');
      }, 50);

      return () => clearTimeout(timeout);
    }
  }, [transitionStage, location, duration]);

  return (
    <div
      className={`page-transition page-transition--${type} page-transition--${transitionStage}`}
      style={{ '--transition-duration': `${duration}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
};
