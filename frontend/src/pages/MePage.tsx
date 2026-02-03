/**
 * ME tab – Profile hub: My Skincare, Learn, Settings.
 */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useShelf } from '../context/ShelfContext';
import { getScanHistory } from '../services/scanApi';
import {
  IconPackage,
  IconHeart,
  IconHistory,
  IconTrendingUp,
  IconFileText,
  IconBookOpen,
  IconBell,
  IconSettings,
  IconHelpCircle,
  IconChevronRight,
} from '../components/Icons';
import './MePage.css';

const MePage: React.FC = () => {
  usePageTitle('My Profile', 'Profile, skincare, learn, and settings.');
  const { user, isAuthenticated } = useAuth();
  const { totalCount: productCount } = useShelf();
  const navigate = useNavigate();
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    getScanHistory()
      .then((d) => {
        const res = d as { scans?: unknown[] };
        setScanCount(res.scans?.length ?? 0);
      })
      .catch(() => setScanCount(0));
  }, [isAuthenticated]);

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const skinLabel = 'Combo Skin';

  if (!isAuthenticated) {
    return (
      <div className="me-page app-page">
        <header className="me-header">
          <h1 className="me-title">My Profile</h1>
        </header>
        <div className="me-content">
          <div className="me-card me-card-guest">
            <p>Sign in to see your profile, products, and settings.</p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/auth')}>
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="me-page app-page">
      <header className="me-header">
        <h1 className="me-title">My Profile</h1>
      </header>
      <div className="me-content">
        <div className="me-profile-card">
          <div className="me-profile-avatar">
            {(user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div className="me-profile-info">
            <h2 className="me-profile-name">{displayName}</h2>
            <p className="me-profile-meta">{skinLabel} • {scanCount} scans</p>
            <Link to="/profile" className="me-profile-edit">Edit profile</Link>
          </div>
        </div>
        <section className="me-section">
          <h3 className="me-section-title">My Skincare</h3>
          <div className="me-list">
            <Link to="/myshelf" className="me-list-item">
              <IconPackage size={20} strokeWidth={2} className="me-list-icon" />
              <span className="me-list-label">My Products</span>
              <span className="me-list-value">({productCount})</span>
              <IconChevronRight size={20} strokeWidth={2} className="me-list-arrow" />
            </Link>
            <Link to="/favorites" className="me-list-item">
              <IconHeart size={20} strokeWidth={2} className="me-list-icon" />
              <span className="me-list-label">Favorites</span>
              <IconChevronRight size={20} strokeWidth={2} className="me-list-arrow" />
            </Link>
            <Link to="/history" className="me-list-item">
              <IconHistory size={20} strokeWidth={2} className="me-list-icon" />
              <span className="me-list-label">Scan History</span>
              <IconChevronRight size={20} strokeWidth={2} className="me-list-arrow" />
            </Link>
            <Link to="/progress" className="me-list-item">
              <IconTrendingUp size={20} strokeWidth={2} className="me-list-icon" />
              <span className="me-list-label">Progress Timeline</span>
              <IconChevronRight size={20} strokeWidth={2} className="me-list-arrow" />
            </Link>
          </div>
        </section>
        <section className="me-section">
          <h3 className="me-section-title">Learn</h3>
          <div className="me-list">
            <Link to="/ingredients" className="me-list-item">
              <IconFileText size={20} strokeWidth={2} className="me-list-icon" />
              <span className="me-list-label">Ingredient Dictionary</span>
              <IconChevronRight size={20} strokeWidth={2} className="me-list-arrow" />
            </Link>
            <Link to="/skin-type-guide" className="me-list-item">
              <IconBookOpen size={20} strokeWidth={2} className="me-list-icon" />
              <span className="me-list-label">Skin Type Guide</span>
              <IconChevronRight size={20} strokeWidth={2} className="me-list-arrow" />
            </Link>
            <Link to="/blog" className="me-list-item">
              <IconBookOpen size={20} strokeWidth={2} className="me-list-icon" />
              <span className="me-list-label">Tips & Articles</span>
              <IconChevronRight size={20} strokeWidth={2} className="me-list-arrow" />
            </Link>
          </div>
        </section>
        <section className="me-section">
          <h3 className="me-section-title">Settings</h3>
          <div className="me-list">
            <Link to="/notifications" className="me-list-item">
              <IconBell size={20} strokeWidth={2} className="me-list-icon" />
              <span className="me-list-label">Notifications</span>
              <IconChevronRight size={20} strokeWidth={2} className="me-list-arrow" />
            </Link>
            <Link to="/profile?tab=settings" className="me-list-item">
              <IconSettings size={20} strokeWidth={2} className="me-list-icon" />
              <span className="me-list-label">Preferences</span>
              <IconChevronRight size={20} strokeWidth={2} className="me-list-arrow" />
            </Link>
            <Link to="/tutorials" className="me-list-item">
              <IconHelpCircle size={20} strokeWidth={2} className="me-list-icon" />
              <span className="me-list-label">Help & Support</span>
              <IconChevronRight size={20} strokeWidth={2} className="me-list-arrow" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MePage;
