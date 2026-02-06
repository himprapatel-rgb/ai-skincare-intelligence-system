/**
 * Route at "/": three separate code paths.
 * - Desktop: HomePage (marketing). We do not touch desktop.
 * - Tablet:  HomePage (marketing). Same as desktop.
 * - Mobile:  TodayPage (TODAY hub).
 * 
 * Performance: Lazy-loads both pages so initial bundle only includes the viewport's page.
 */
import React from 'react';
import { useViewport } from '../hooks/useViewport';

// Lazy-load both pages so mobile bundle doesn't include HomePage (~1000 lines)
const HomePage = React.lazy(() => import('../pages/HomePage'));
const TodayPage = React.lazy(() => import('../pages/TodayPage'));

export const HomeRoute: React.FC = () => {
  const viewport = useViewport();
  
  return (
    <React.Suspense fallback={<div className="loading-screen inline" role="status"><p>Loading...</p></div>}>
      {viewport === 'mobile' ? <TodayPage /> : <HomePage />}
    </React.Suspense>
  );
};
