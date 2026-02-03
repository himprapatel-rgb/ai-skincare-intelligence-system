/**
 * Route at "/": three separate code paths.
 * - Desktop: HomePage (marketing). We do not touch desktop.
 * - Tablet:  HomePage (marketing). Same as desktop.
 * - Mobile:  TodayPage (TODAY hub).
 */
import React from 'react';
import { useViewport } from '../hooks/useViewport';
import HomePage from '../pages/HomePage';
import TodayPage from '../pages/TodayPage';

export const HomeRoute: React.FC = () => {
  const viewport = useViewport();
  if (viewport === 'mobile') return <TodayPage />;
  return <HomePage />;
};
