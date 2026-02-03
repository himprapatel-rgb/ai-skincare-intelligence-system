/**
 * Route at "/": desktop/tablet get original HomePage (marketing);
 * mobile gets TodayPage (TODAY hub). We do not touch desktop; mobile-only changes stay in mobile viewport.
 */
import React from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import HomePage from '../pages/HomePage';
import TodayPage from '../pages/TodayPage';

export const HomeRoute: React.FC = () => {
  const isMobile = useIsMobile();
  return isMobile ? <TodayPage /> : <HomePage />;
};
