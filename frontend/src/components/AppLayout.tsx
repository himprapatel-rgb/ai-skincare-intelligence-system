import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AppLayout.css';

type AppLayoutProps = {
  children: React.ReactNode;
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="app-layout">
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
            <Link className={`app-nav-link${location.pathname.startsWith('/about') ? ' active' : ''}`} to="/about">About</Link>
            <Link className={`app-nav-link${location.pathname.startsWith('/auth') ? ' active' : ''}`} to="/auth">Login</Link>
            <Link className="app-nav-link" to="/auth">Register</Link>
            <Link className="app-nav-cta" to="/scan">Start Free Scan</Link>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {children}
      </main>

      <footer className="app-footer">
        <div className="app-footer-container">
          <div className="app-footer-brand">
            <span className="app-logo-text">SkinCareAI</span>
            <p>Clinical-grade skin insights, personalized for you.</p>
          </div>
          <div className="app-footer-links">
            <div>
              <h4>Product</h4>
              <Link to="/scan">Skin Analysis</Link>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/history">History</Link>
              <Link to="/auth">Login / Register</Link>
            </div>
            <div>
              <h4>Company</h4>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
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
