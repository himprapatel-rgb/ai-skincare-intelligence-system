/**
 * 404 Not Found – Mobile redesign: stacked actions, clear copy.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { IconHome, IconScan, IconPackage, IconPhone } from '../components/Icons';
import './NotFoundPage.css';

const NotFoundPage: React.FC = () => {
  usePageTitle('Page Not Found');
  return (
    <div className="not-found-page app-page">
      <header className="app-header-card not-found-header">
        <h1>Page Not Found</h1>
        <p className="app-header-subtitle">We can&apos;t find what you&apos;re looking for.</p>
      </header>
      <div className="app-page-content not-found-content">
        <p className="not-found-title" aria-hidden="true">404</p>
        <p className="not-found-sub">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="not-found-actions">
          <Link to="/" className="not-found-btn not-found-btn-primary">
            <IconHome size={20} strokeWidth={2} className="not-found-btn-icon" />
            Go Home
          </Link>
          <Link to="/scan" className="not-found-btn not-found-btn-secondary">
            <IconScan size={20} strokeWidth={2} className="not-found-btn-icon" />
            Start Scan
          </Link>
          <Link to="/recommendations" className="not-found-btn not-found-btn-secondary">
            <IconPackage size={20} strokeWidth={2} className="not-found-btn-icon" />
            Browse Products
          </Link>
          <Link to="/contact" className="not-found-btn not-found-btn-secondary">
            <IconPhone size={20} strokeWidth={2} className="not-found-btn-icon" />
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
