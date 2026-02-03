/**
 * 404 Not Found - Task 4
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { IconHome, IconScan } from '../components/Icons';
import './NotFoundPage.css';

const NotFoundPage: React.FC = () => {
  usePageTitle('Page Not Found');
  return (
  <div className="not-found-page app-page">
    <div className="app-page-content not-found-content">
      <h1 className="not-found-title">404</h1>
      <p className="not-found-message">Page not found</p>
      <p className="not-found-sub">The page you’re looking for doesn’t exist or has been moved.</p>
      <p className="not-found-hint">Try going home, starting a scan, browsing recommendations, or contact us if you need help.</p>
      <div className="not-found-actions">
        <Link to="/" className="btn-primary">
          <IconHome size={20} strokeWidth={2} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Go Home
        </Link>
        <Link to="/scan" className="btn-secondary">
          <IconScan size={20} strokeWidth={2} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Start Scan
        </Link>
        <Link to="/recommendations" className="btn-secondary">
          Browse products
        </Link>
        <Link to="/contact" className="btn-secondary">
          Contact us
        </Link>
      </div>
    </div>
  </div>
  );
};

export default NotFoundPage;
