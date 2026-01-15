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
                <path d="M16 8C11.6 8 8 11.6 8 16s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" fill="white" />
                <circle cx="16" cy="16" r="3" fill="white" />
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#0891B2" />
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
            <Link to="/auth" className="nav-link">About</Link>
            <Link to="/auth" className="nav-btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon">&#x1F3E5;</span>
              <span>Dermatologist-Grade AI Technology</span>
            </div>
            <h1 className="hero-title">
              Advanced Skin
              <br />
              <span className="gradient-text">Health Analysis</span>
            </h1>
            <p className="hero-description">
              Experience clinical-grade skin analysis powered by artificial intelligence. 
              Get personalized recommendations backed by dermatological research and 
              track your skin's health journey with precision.
            </p>
            <div className="hero-buttons">
              <button 
                className="btn-primary"
                onClick={() => navigate('/scan')}
              >
                <span className="btn-icon">&#x1F50D;</span>
                Start Free Analysis
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/auth')}
              >
                Learn More
              </button>
            </div>
            <div className="trust-indicators">
              <div className="trust-item">
                <span className="trust-icon">&#x2705;</span>
                <span>FDA Compliant</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">&#x1F512;</span>
                <span>HIPAA Secure</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">&#x1F3C6;</span>
                <span>98% Accuracy</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-card">
              <div className="scan-preview">
                <div className="scan-circle">
                  <div className="scan-inner"></div>
                  <div className="scan-ring"></div>
                </div>
                <div className="scan-label">AI Scan Ready</div>
              </div>
              <div className="analysis-preview">
                <div className="analysis-item">
                  <span className="analysis-label">Hydration</span>
                  <div className="analysis-bar">
                    <div className="analysis-fill" style={{width: '85%'}}></div>
                  </div>
                  <span className="analysis-value">85%</span>
                </div>
                <div className="analysis-item">
                  <span className="analysis-label">Elasticity</span>
                  <div className="analysis-bar">
                    <div className="analysis-fill" style={{width: '72%'}}></div>
                  </div>
                  <span className="analysis-value">72%</span>
                </div>
                <div className="analysis-item">
                  <span className="analysis-label">UV Protection</span>
                  <div className="analysis-bar">
                    <div className="analysis-fill warning" style={{width: '45%'}}></div>
                  </div>
                  <span className="analysis-value">45%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon">&#x1F465;</div>
            <div className="stat-number">500K+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">&#x1F4CA;</div>
            <div className="stat-number">2M+</div>
            <div className="stat-label">Scans Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">&#x1F468;&#x200D;&#x2695;&#xFE0F;</div>
            <div className="stat-number">50+</div>
            <div className="stat-label">Dermatologists</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">&#x2B50;</div>
            <div className="stat-number">4.9</div>
            <div className="stat-label">User Rating</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title">Clinical-Grade Skin Intelligence</h2>
            <p className="section-subtitle">
              Our AI platform combines advanced machine learning with dermatological expertise
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">&#x1F9EC;</span>
              </div>
              <h3 className="feature-title">AI Skin Analysis</h3>
              <p className="feature-description">
                Advanced neural networks analyze 50+ skin parameters for comprehensive health assessment
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">&#x1F4CA;</span>
              </div>
              <h3 className="feature-title">Progress Tracking</h3>
              <p className="feature-description">
                Monitor your skin's health journey with detailed analytics and trend visualization
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">&#x1F48A;</span>
              </div>
              <h3 className="feature-title">Smart Recommendations</h3>
              <p className="feature-description">
                Personalized skincare routines based on your unique skin profile and concerns
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">&#x1F468;&#x200D;&#x2695;&#xFE0F;</span>
              </div>
              <h3 className="feature-title">Expert Consultation</h3>
              <p className="feature-description">
                Connect with certified dermatologists for professional guidance and treatment plans
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Start Your Skin Health Journey Today</h2>
            <p className="cta-description">
              Join thousands of users who have transformed their skincare routine with AI-powered insights
            </p>
            <button 
              className="cta-button"
              onClick={() => navigate('/auth')}
            >
              Create Free Account
              <span className="cta-arrow">&#x2192;</span>
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
            <p className="footer-tagline">Advanced AI-powered skin health analysis</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <Link to="/scan">Skin Analysis</Link>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/">Pricing</Link>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <Link to="/">About Us</Link>
              <Link to="/">Careers</Link>
              <Link to="/">Contact</Link>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <Link to="/">Privacy Policy</Link>
              <Link to="/">Terms of Service</Link>
              <Link to="/">HIPAA Compliance</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 SkinCareAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
