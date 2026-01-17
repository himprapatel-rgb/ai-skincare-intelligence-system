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

      {/* Trust Badge Bar */}
      <section className="trust-section">
        <div className="trust-container">
          <div className="trust-badge">
            <span className="badge-icon">✅</span>
            <span className="badge-text">FDA Compliant</span>
          </div>
          <div className="trust-badge">
            <span className="badge-icon">🔒</span>
            <span className="badge-text">HIPAA Secure</span>
          </div>
          <div className="trust-badge">
            <span className="badge-icon">🏆</span>
            <span className="badge-text">98% Accuracy</span>
          </div>
        </div>
        <div className="ai-scan-ready">
          <span>AI Scan Ready</span>
        </div>
      </section>

      {/* How It Works Section */}
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
              <h3 className="step-title">Upload Photo</h3>
              <p className="step-description">Take a clear photo of your skin concern</p>
            </div>
            <div className="step-connector"></div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">AI Analysis</h3>
              <p className="step-description">Our AI analyzes your skin in seconds</p>
            </div>
            <div className="step-connector"></div>
            <div className="step-card">
              <div className="step-number">3</div>
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
