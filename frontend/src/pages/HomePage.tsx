import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      {/* Navigation Header */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
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
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link active">Home</Link>
            <Link to="/scan" className="nav-link">Analysis</Link>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/auth" className="nav-btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Dermatologist-Grade AI Technology</span>
            </div>
            <h1 className="hero-title">
              Advanced Skin<br />
              <span className="gradient-text">Health Analysis</span>
            </h1>
            <p className="hero-subtitle">
              Experience clinical-grade skin analysis powered by artificial intelligence. Get personalized recommendations backed by dermatological research and track your skin health journey with precision.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => navigate('/scan')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                Start Free Analysis
              </button>
              <button className="btn-secondary" onClick={() => navigate('/about')}>
                Learn More
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-card">
              <div className="scan-preview">
                <div className="scan-circle"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badge Bar with Custom SVG Icons */}
      <section className="trust-section">
        <div className="trust-container">
          <div className="trust-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill="#10B981" />
              <path d="M10 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="badge-text">FDA Compliant</span>
          </div>
          <div className="trust-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2" fill="#F59E0B" />
              <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="#F59E0B" strokeWidth="2" fill="none" />
              <circle cx="12" cy="16" r="1.5" fill="white" />
            </svg>
            <span className="badge-text">HIPAA Secure</span>
          </div>
          <div className="trust-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="9" r="6" fill="#EAB308" />
              <path d="M8 15l-1 7 5-3 5 3-1-7" fill="#EAB308" />
              <text x="12" y="11" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">98</text>
            </svg>
            <span className="badge-text">98% Accuracy</span>
          </div>
        </div>
        <div className="ai-scan-ready">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#089182" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          <span>AI Scan Ready</span>
        </div>
      </section>

      {/* How It Works Section with Custom Icons */}
      <section className="how-it-works-section">
        <div className="how-it-works-container">
          <div className="section-header">
            <span className="section-badge">Simple Process</span>
            <h2 className="section-title">How It Works</h2>
            <p className="section-description">Get your personalized skin analysis in three easy steps</p>
          </div>
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="8" width="32" height="32" rx="4" stroke="#089182" strokeWidth="2" fill="#E6F7F5" />
                  <circle cx="18" cy="18" r="4" fill="#089182" />
                  <path d="M8 32l10-10 6 6 8-8 8 8" stroke="#089182" strokeWidth="2" fill="none" />
                  <path d="M32 12v8h8" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="step-title">Upload Photo</h3>
              <p className="step-description">Take a clear photo of your skin concern</p>
            </div>
            <div className="step-connector">
              <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
                <path d="M0 8h32M28 4l4 4-4 4" stroke="#089182" strokeWidth="2" />
              </svg>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="20" cy="20" r="12" stroke="#089182" strokeWidth="2" fill="#E6F7F5" />
                  <path d="M28 28l10 10" stroke="#089182" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="20" cy="20" r="4" fill="#089182" />
                  <path d="M20 12v4M20 24v4M12 20h4M24 20h4" stroke="#06B6D4" strokeWidth="1.5" />
                </svg>
              </div>
              <h3 className="step-title">AI Analysis</h3>
              <p className="step-description">Our AI analyzes your skin in seconds</p>
            </div>
            <div className="step-connector">
              <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
                <path d="M0 8h32M28 4l4 4-4 4" stroke="#089182" strokeWidth="2" />
              </svg>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M12 8h24a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill="#E6F7F5" stroke="#089182" strokeWidth="2" />
                  <path d="M16 20h16M16 26h12M16 32h8" stroke="#089182" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="34" cy="14" r="6" fill="#10B981" />
                  <path d="M31 14l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="step-title">Get Results</h3>
              <p className="step-description">Receive personalized recommendations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-number">500K+</div>
            <div className="stat-label">Scans Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">98%</div>
            <div className="stat-label">Accuracy Rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">50+</div>
            <div className="stat-label">Skin Conditions</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">24/7</div>
            <div className="stat-label">AI Available</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Start Your Skin Health Journey Today</h2>
            <p className="cta-subtitle">Join thousands who have discovered their perfect skincare routine</p>
            <button className="cta-button" onClick={() => navigate('/scan')}>
              Get Free Analysis
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-text">SkinCare<span className="logo-highlight">AI</span></span>
            </div>
            <p className="footer-description">AI-powered skin analysis for everyone</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <Link to="/scan">Analysis</Link>
              <Link to="/dashboard">Dashboard</Link>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 SkinCareAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
