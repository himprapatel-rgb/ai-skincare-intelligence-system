/**
 * Digital Twin Timeline Page - Fixed Version
 * Shows message when no data is available
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BackButton } from '../components/BackButton';
import { usePageTitle } from '../hooks/usePageTitle';
import { API_BASE_URL } from '../config';
import { api } from '../services/api';
import { IconSparkles, IconCalendar, IconTrendingUp } from '../components/Icons';
import '../components/digital-twin/styles/digital-twin.css';

const DigitalTwinFixed: React.FC = () => {
  usePageTitle('Digital Twin');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    fetchData();
  }, [isAuthenticated, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await api.get(`${API_BASE_URL}/digital-twin/query?days=30`);
      
      if (response.data && response.data.snapshots && response.data.snapshots.length > 0) {
        setHasData(true);
      } else {
        setHasData(false);
      }
    } catch (error: any) {
      console.error('Digital Twin fetch error:', error);
      setHasError(true);
      
      if (error.response?.status === 404) {
        setErrorMessage('No scan data found. Complete a face scan first!');
      } else if (error.response?.status === 401) {
        setErrorMessage('Please log in to view your Digital Twin.');
        setTimeout(() => navigate('/auth'), 2000);
      } else {
        setErrorMessage('Unable to load Digital Twin data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="app-page digital-twin-page">
        <div className="app-page-content">
          <BackButton />
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '50vh',
            gap: '20px'
          }}>
            <div className="spinner-large" />
            <p style={{ color: '#64748b', fontSize: '16px' }}>Loading your Digital Twin...</p>
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
          <div className="empty-state" style={{
            padding: '60px 24px',
            textAlign: 'center',
            background: 'white',
            borderRadius: '24px',
            margin: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <IconSparkles size={40} strokeWidth={2} />
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#1a1a1a' }}>
              {hasError ? 'Unable to Load' : 'No Scan Data Yet'}
            </h2>

            <p style={{ 
              fontSize: '16px', 
              color: '#64748b', 
              marginBottom: '24px',
              lineHeight: '1.6',
              maxWidth: '400px',
              margin: '0 auto 32px'
            }}>
              {errorMessage || 'Complete your first face scan to start tracking your skin journey with Digital Twin.'}
            </p>

            <button
              onClick={() => navigate('/scan')}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.97)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Start Face Scan
            </button>

            {hasError && (
              <button
                onClick={fetchData}
                style={{
                  marginTop: '16px',
                  padding: '12px 24px',
                  background: 'transparent',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '16px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'block',
                  margin: '16px auto 0'
                }}
              >
                Retry
              </button>
            )}
          </div>

          <div style={{
            margin: '24px',
            padding: '20px',
            background: 'rgba(102, 126, 234, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '12px',
              color: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <IconCalendar size={20} />
              What is Digital Twin?
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '12px' }}>
              Your Digital Twin tracks your skin's health over time by analyzing multiple face scans.
            </p>
            <ul style={{ 
              fontSize: '14px', 
              color: '#64748b', 
              lineHeight: '1.8',
              paddingLeft: '24px',
              margin: 0
            }}>
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

  // If we have data, show the full page (to be implemented)
  return (
    <div className="app-page digital-twin-page">
      <header className="app-header-card">
        <BackButton />
        <h1>Digital Twin</h1>
        <p className="app-header-subtitle">Your skin's evolution</p>
      </header>
      <div className="app-page-content">
        <p style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          Digital Twin data loaded successfully! (Full UI coming soon)
        </p>
      </div>
    </div>
  );
};

export default DigitalTwinFixed;
