/**
 * Digital Twin Timeline Page - Fixed Version
 * Shows message when no data is available
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BackButton } from '../components/BackButton';
import { usePageTitle } from '../hooks/usePageTitle';
import { api } from '../services/api';
import { IconSparkles, IconCalendar } from '../components/Icons';
import DigitalTwinTimelinePage from './DigitalTwinTimelinePage';
import '../components/digital-twin/styles/digital-twin.css';
import './DigitalTwinFixed.css';

const DigitalTwinFixed: React.FC = () => {
  usePageTitle('Digital Twin');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await api.get('/digital-twin/query?limit=50');
      
      if (response.data && response.data.snapshots && response.data.snapshots.length > 0) {
        setHasData(true);
      } else {
        setHasData(false);
      }
    } catch (error: unknown) {
      setHasError(true);
      
      const status = typeof error === 'object' && error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined;
      if (status === 404) {
        setErrorMessage('No scan data found. Complete a face scan first!');
      } else if (status === 401) {
        setErrorMessage('Please log in to view your Digital Twin.');
        setTimeout(() => navigate('/auth'), 2000);
      } else {
        setErrorMessage('Unable to load Digital Twin data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    fetchData();
  }, [isAuthenticated, navigate, fetchData]);

  if (isLoading) {
    return (
      <div className="app-page digital-twin-page">
        <div className="app-page-content">
          <BackButton />
          <div className="dt-loading">
            <div className="spinner-large" />
            <p className="dt-loading-text">Loading your Digital Twin...</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasError || !hasData) {
    return (
      <div className="app-page digital-twin-page">
        <header className="app-header-card">
          <BackButton />
          <h1>Digital Twin</h1>
          <p className="app-header-subtitle">Track your skin's evolution over time</p>
        </header>

        <div className="app-page-content">
          <div className="empty-state dt-empty">
            <div className="dt-empty-icon">
              <IconSparkles size={40} strokeWidth={2} />
            </div>
            <h2 className="dt-empty-title">
              {hasError ? 'Unable to Load' : 'No Scan Data Yet'}
            </h2>
            <p className="dt-empty-desc">
              {errorMessage || 'Complete your first face scan to start tracking your skin journey with Digital Twin.'}
            </p>
            <button onClick={() => navigate('/scan')} className="btn btn-primary dt-empty-btn">
              Start Face Scan
            </button>
            {hasError && (
              <button onClick={fetchData} className="btn btn-secondary dt-retry-btn">
                Retry
              </button>
            )}
          </div>

          <div className="dt-info-card">
            <h3 className="dt-info-title">
              What is Digital Twin?
            </h3>
            <p className="dt-info-text">
              Your Digital Twin tracks your skin's health over time by analyzing multiple face scans.
            </p>
            <ul className="dt-info-list">
              <li>📊 View timeline of your skin's evolution</li>
              <li>📈 Track improvements in specific areas</li>
              <li>🔍 Compare before & after photos</li>
              <li>💡 Get personalized insights</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // When we have data, show the full timeline UI
  return <DigitalTwinTimelinePage />;
};

export default DigitalTwinFixed;
