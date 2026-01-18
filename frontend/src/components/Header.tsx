// src/components/Header.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  return (
    <nav className="app-header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <span className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="url(#grad1)" />
              <circle cx="16" cy="16" r="3" fill="white" />
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#089182" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className="logo-text">SkinCare<span className="logo-highlight">AI</span></span>
        </Link>
        <div className="header-nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/scan" className="nav-link">Analysis</Link>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/scan" className="nav-btn-primary">Start Free Scan</Link>
        </div>
      </div>
    </nav>
  );
};

export default Header;
