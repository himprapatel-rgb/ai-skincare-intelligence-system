import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconInstagram, IconTwitter, IconLinkedin, IconTiktok } from './Icons';
import { useAuth } from '../context/AuthContext';
import './AppLayout.css';

type AppLayoutProps = {
  children: React.ReactNode;
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const displayName = user?.full_name || user?.email || 'Account';
  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const labelMap: Record<string, string> = {
      'scan': 'Scan',
      'analysis': 'Analysis',
      'digital-twin': 'Digital Twin',
      'routine-builder': 'Routine Builder',
      'favorites': 'Favorites',
      'myshelf': 'My Shelf',
      'scanner': 'Product Scanner',
      'notifications': 'Notifications',
      'profile': 'Profile',
      'dashboard': 'Dashboard',
      'history': 'History',
      'recommendations': 'Recommendations',
      'about': 'About',
      'contact': 'Contact',
      'privacy': 'Privacy',
      'terms': 'Terms',
      'auth': 'Login',
      'onboarding': 'Onboarding',
      'export': 'Data Export',
      'blog': 'Blog',
      'ingredients': 'Ingredient Dictionary',
      'skin-type-guide': 'Skin Type Guide',
      'tutorials': 'Video Tutorials',
    };
    const crumbs = [{ label: 'Home', to: '/' }];
    if (segments.length === 0) return crumbs;
    let path = '';
    segments.forEach((segment, index) => {
      path += `/${segment}`;
      const isLast = index === segments.length - 1;
      const isDynamic = segment.length > 12 || /[0-9]/.test(segment);
      const label = labelMap[segment] || (isDynamic ? 'Details' : segment.replace(/-/g, ' '));
      crumbs.push({ label: label.replace(/\b\w/g, (char) => char.toUpperCase()), to: isLast ? '' : path });
    });
    return crumbs;
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="app-header">
        <div className="app-header-container">
          <Link to="/" className="app-logo">
            <span className="app-logo-mark" />
            <span className="app-logo-text">SkinCareAI</span>
          </Link>
          <nav className="app-nav">
            <Link className={`app-nav-link${location.pathname === '/' ? ' active' : ''}`} to="/">Home</Link>
            <Link className={`app-nav-link${location.pathname.startsWith('/scan') ? ' active' : ''}`} to="/scan">Analysis</Link>
            <Link className={`app-nav-link${location.pathname.startsWith('/dashboard') ? ' active' : ''}`} to="/dashboard">Dashboard</Link>
            <Link className={`app-nav-link${location.pathname.startsWith('/digital-twin') ? ' active' : ''}`} to="/digital-twin">Digital Twin</Link>
            <Link className={`app-nav-link${location.pathname.startsWith('/about') ? ' active' : ''}`} to="/about">About</Link>
            {isAuthenticated && user?.is_admin && (
              <Link className={`app-nav-link${location.pathname.startsWith('/admin') ? ' active' : ''}`} to="/admin">Admin</Link>
            )}
            {isAuthenticated ? (
              <div className="app-nav-user">
                <Link className="app-nav-link" to="/profile">{displayName}</Link>
                <button
                  type="button"
                  className="app-nav-link app-nav-logout"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link className={`app-nav-link${location.pathname.startsWith('/auth') ? ' active' : ''}`} to="/auth">Login</Link>
                <Link className="app-nav-link" to="/auth?mode=register">Register</Link>
              </>
            )}
            {!location.pathname.startsWith('/scan') && !location.pathname.startsWith('/analysis') && (
              <Link className="app-nav-cta" to="/scan">Start Free Scan</Link>
            )}
          </nav>
        </div>
      </header>

      <div className="app-breadcrumbs" aria-label="Breadcrumb">
        <div className="app-breadcrumbs-container">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="app-breadcrumb-item">
              {crumb.to ? (
                <Link to={crumb.to}>{crumb.label}</Link>
              ) : (
                <span className="app-breadcrumb-current">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && <span className="app-breadcrumb-separator">/</span>}
            </span>
          ))}
        </div>
      </div>

      <main className="app-main" id="main-content">
        {children}
      </main>

      <footer className="app-footer">
        <div className="app-footer-container">
          <div className="app-footer-brand">
            <span className="app-logo-text">SkinCareAI</span>
            <p>Clinical-grade skin insights, personalized for you.</p>
            <div className="app-footer-socials">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <IconInstagram size={18} strokeWidth={2} />
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X">
                <IconTwitter size={18} strokeWidth={2} />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok">
                <IconTiktok size={18} strokeWidth={2} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <IconLinkedin size={18} strokeWidth={2} />
              </a>
            </div>
          </div>
          <div className="app-footer-links">
            <div>
              <h4>Product</h4>
              <Link to="/scan">Skin Analysis</Link>
              <Link to="/recommendations">Recommendations</Link>
              <Link to="/digital-twin">Digital Twin</Link>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/history">History</Link>
              {isAuthenticated ? (
                <Link to="/profile">My Account</Link>
              ) : (
                <Link to="/auth">Login / Register</Link>
              )}
            </div>
            <div>
              <h4>Explore</h4>
              <Link to="/routine-builder">Routine Builder</Link>
              <Link to="/favorites">Favorites</Link>
              <Link to="/myshelf">My Shelf</Link>
              <Link to="/scanner">Product Scanner</Link>
              <Link to="/notifications">Notifications</Link>
              <Link to="/ingredients">Ingredient Dictionary</Link>
              <Link to="/skin-type-guide">Skin Type Guide</Link>
            </div>
            <div>
              <h4>Company</h4>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/blog">Blog</Link>
              <Link to="/tutorials">Video Tutorials</Link>
            </div>
            <div>
              <h4>Legal</h4>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/privacy#delete">Delete My Data</Link>
            </div>
          </div>
        </div>
        <div className="app-footer-bottom">
          <p>© 2026 SkinCareAI. All rights reserved.</p>
          <p className="app-footer-disclaimer">Not a medical device. For informational purposes only.</p>
          <p className="app-footer-build">Build 2026-01-18-02</p>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
