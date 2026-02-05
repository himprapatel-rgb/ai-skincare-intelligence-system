/**
 * ME tab – Profile hub: stats, Digital Twin promo, My Skincare, Learn & Settings.
 * Redesign: Digital Twin as hero, stats row, simplified sections.
 */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useShelf } from '../context/ShelfContext';
import { API_BASE_URL } from '../config';
import { getScanHistory } from '../services/scanApi';
import { getStreak } from '../utils/streakStorage';
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
  IconSparkles,
  IconInfo,
} from '../components/Icons';
import './MePage.css';

const MePage: React.FC = () => {
  usePageTitle('My Profile', 'Profile, skincare, learn, and settings.');
  const { user, isAuthenticated } = useAuth();
  const { totalCount: productCount } = useShelf();
  const navigate = useNavigate();
  const [scanCount, setScanCount] = useState(0);
  const [skinScore, setSkinScore] = useState<number | null>(null);
  const [twinSnapshotCount, setTwinSnapshotCount] = useState<number | null>(null);
  const streak = getStreak();

  useEffect(() => {
    if (!isAuthenticated) return;
    getScanHistory()
      .then((d) => {
        const res = d as { scans?: Array<{ summary?: { overall_score?: number } }> };
        const scans = res.scans ?? [];
        setScanCount(scans.length);
        const scores = scans
          .map((s) => (s.summary && typeof s.summary.overall_score === 'number' ? Math.round(s.summary.overall_score) : null))
          .filter((n): n is number => n != null);
        const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        setSkinScore(avg > 0 ? avg : null);
      })
      .catch(() => setScanCount(0));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('auth_token');
    fetch(`${API_BASE_URL}/digital-twin/query?limit=200`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed'))))
      .then((data: { snapshots?: unknown[] }) => {
        setTwinSnapshotCount((data.snapshots ?? []).length);
      })
      .catch(() => setTwinSnapshotCount(0));
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
            <p className="me-profile-meta">{skinLabel}</p>
            <div className="me-profile-stats">
              <div className="me-stat">
                <span className="me-stat-value">{skinScore ?? '—'}</span>
                <span className="me-stat-label">Score</span>
              </div>
              <div className="me-stat">
                <span className="me-stat-value">{scanCount}</span>
                <span className="me-stat-label">Scans</span>
              </div>
              <div className="me-stat">
                <span className="me-stat-value">{streak}🔥</span>
                <span className="me-stat-label">Streak</span>
              </div>
            </div>
            <Link to="/profile" className="me-profile-edit">Edit profile</Link>
          </div>
        </div>

        <section className="me-section me-twin-card-wrap">
          <Link to="/digital-twin" className="me-twin-card">
            <span className="me-twin-icon" aria-hidden><IconSparkles size={24} strokeWidth={2} /></span>
            <h3 className="me-twin-title">My Digital Twin</h3>
            <p className="me-twin-desc">Your skin&apos;s living AI — timeline, before/after, and What-If simulation.</p>
            <ul className="me-twin-meta">
              {twinSnapshotCount != null && <li>{twinSnapshotCount} snapshot{twinSnapshotCount !== 1 ? 's' : ''}</li>}
              <li>Trend & predictions</li>
            </ul>
            <span className="me-twin-cta">Open Digital Twin <IconChevronRight size={20} strokeWidth={2} /></span>
          </Link>
        </section>

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
          <h3 className="me-section-title">Learn & Settings</h3>
          <p className="me-section-note">
            Device & context data is sent with each scan to improve results. You can view or export it below.
          </p>
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
            <Link to="/notifications" className="me-list-item">
              <IconBell size={20} strokeWidth={2} className="me-list-icon" />
              <span className="me-list-label">Notifications</span>
              <IconChevronRight size={20} strokeWidth={2} className="me-list-arrow" />
            </Link>
            <Link to="/device-context" className="me-list-item">
              <IconInfo size={20} strokeWidth={2} className="me-list-icon" />
              <span className="me-list-label">Device & context</span>
              <IconChevronRight size={20} strokeWidth={2} className="me-list-arrow" />
            </Link>
            <Link to="/profile?tab=settings" className="me-list-item">
              <IconSettings size={20} strokeWidth={2} className="me-list-icon" />
              <span className="me-list-label">Preferences</span>
              <IconChevronRight size={20} strokeWidth={2} className="me-list-arrow" />
            </Link>
            <Link to="/contact" className="me-list-item">
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
