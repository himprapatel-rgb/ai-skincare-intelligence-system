/**
 * Protected Route Component
 * Prevents redirect loops by waiting for auth to initialize
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { STORAGE_KEYS } from '../constants/storage';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    // Save return URL
    sessionStorage.setItem(STORAGE_KEYS.AUTH_RETURN_URL, location.pathname + location.search);
    return <Navigate to="/auth" replace />;
  }

  // User is authenticated, show the page
  return <>{children}</>;
};
