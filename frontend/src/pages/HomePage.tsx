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

      {/* Hero Section - Sprint HP-1: US-HP-1.1, US-HP-1.2, US-HP-1.3 */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Dermatologist-Grade AI Technology</span>
            </div>
            <h1 className="hero-title">Understand Your Skin<br /><span className="gradient-text">in 60 Seconds</span></h1>
            <p className="hero-subtitle">AI-powered skin analysis backed by dermatological research</p>
            <div className="time-indicator"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Results in under 60 seconds</span></div>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => navigate('/scan')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>Start Free Analysis</button>
            </div>
          </div>
          <div className="hero-visual"><div className="visual-card"><div className="scan-preview"><div className="scan-circle"><div className="scan-inner"></div><div className="scan-ring"></div></div><div className="scan-label">AI Scan Ready</div></div><div className="analysis-preview"><div className="analysis-item"><span className="analysis-label">Hydration</span><div className="analysis-bar"><div className="analysis-fill" style={{width: '85%'}}></div></div><span className="analysis-value">85%</span></div><div className="analysis-item"><span className="analysis-label">Elasticity</span><div className="analysis-bar"><div className="analysis-fill" style={{width: '72%'}}></div></div><span className="analysis-value">72%</span></div><div className="analysis-item"><span className="analysis-label">UV Protection</span><div className="analysis-bar"><div className="analysis-fill warning" style={{width: '45%'}}></div></div><span className="analysis-value">45%</span></div></div></div></div>
        </div>
      </section>

      {/* Trust Badge Bar - Sprint HP-1 US-HP-2.1: Professional SVG badges with Learn more links */}
      <section className="trust-section"><div className="trust-container"><div className="trust-badge"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><div className="trust-content"><span className="trust-title">Dermatologist-Backed</span><a href="#" className="trust-link">Learn more</a></div></div><div className="trust-badge"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><div className="trust-content"><span className="trust-title">Privacy-First</span><a href="#" className="trust-link">Learn more</a></div></div><div className="trust-badge"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><div className="trust-content"><span className="trust-title">AI-Powered Analysis</span><a href="#" className="trust-link">Learn more</a></div></div></div></section>

      {/* How It Works - Sprint HP-1 US-HP-3.1: 3-step visual process */}
      <section className="how-it-works-section"><div className="how-it-works-container"><div className="section-header"><span className="section-badge">Simple Process</span><h2 className="section-title">How It Works</h2><p className="section-subtitle">Get personalized skin insights in three easy steps</p></div><div className="steps-grid"><div className="step-card"><div className="step-number">1</div><div className="step-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div><h3 className="step-title">Take a Photo</h3><p className="step-description">Use your camera to capture a clear photo of your skin</p></div><div className="step-card"><div className="step-number">2</div><div className="step-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><h3 className="step-title">AI Analysis</h3><p className="step-description">Our AI analyzes 50+ skin parameters in seconds</p></div><div className="step-card"><div className="step-number">3</div><div className="step-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div><h3 className="step-title">Get Results</h3><p className="step-description">Receive personalized recommendations for your skin</p></div></div></div></section>

      {/* Stats Section */}
      <section className="stats-section"><div className="stats-container"><div className="stat-card"><div className="stat-number">500K+</div><div className="stat-label">Active Users</div></div><div className="stat-card"><div className="stat-number">2M+</div><div className="stat-label">Scans Completed</div></div><div className="stat-card"><div className="stat-number">50+</div><div className="stat-label">Dermatologists</div></div><div className="stat-card"><div className="stat-number">4.9</div><div className="stat-label">User Rating</div></div></div></section>

      {/* CTA Section */}
      <section className="cta-section"><div className="cta-container"><div className="cta-content"><h2 className="cta-title">Start Your Skin Health Journey Today</h2><p className="cta-description">Join thousands of users who have transformed their skincare routine with AI-powered insights</p><button className="cta-button" onClick={() => navigate('/auth')}>Create Free Account<span className="cta-arrow">-></span></button></div></div></section>

      {/* Footer */}
      <footer className="footer"><div className="footer-container"><div className="footer-brand"><div className="footer-logo"><span className="logo-text">SkinCare<span className="logo-highlight">AI</span></span></div><p className="footer-tagline">Advanced AI-powered skin health analysis</p></div><div className="footer-links"><div className="footer-column"><h4>Product</h4><Link to="/scan">Skin Analysis</Link><Link to="/dashboard">Dashboard</Link><Link to="/">Pricing</Link></div><div className="footer-column"><h4>Company</h4><Link to="/">About Us</Link><Link to="/">Careers</Link><Link to="/">Contact</Link></div><div className="footer-column"><h4>Legal</h4><Link to="/">Privacy Policy</Link><Link to="/">Terms of Service</Link><Link to="/">HIPAA Compliance</Link></div></div></div><div className="footer-bottom"><p>2026 SkinCareAI. All rights reserved.</p></div></footer>
    </div>
  );
};

export default HomePage;import React from 'react';
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
