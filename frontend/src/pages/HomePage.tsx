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
            <Link to="/scan" className="nav-btn-primary">Start Free Scan</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Updated with safer claims */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">&#128161;</span>
            AI-Powered Skin Insights
          </div>
          <h1 className="hero-title">
            AI Skin Analysis<br />
            <span className="gradient-text">From a Single Photo</span>
          </h1>
          <p className="hero-subtitle">
            Upload a selfie to get instant insights on acne, spots, redness, and skin texture — plus personalized skincare recommendations.
          </p>
          <div className="hero-cta">
            <button className="btn-primary" onClick={() => navigate('/scan')}>
              <span className="btn-icon">&#128247;</span>
              Start Free Skin Scan
            </button>
            <button className="btn-secondary" onClick={() => navigate('/about')}>
              See Sample Report
            </button>
          </div>
          <p className="hero-reassurance">
            &#9201; Takes ~30 seconds &bull; No signup required &bull; Delete your photo anytime
          </p>
        </div>
        <div className="hero-visual">
          <div className="sample-report-preview">
            <div className="preview-header">Sample Analysis Result</div>
            <div className="preview-scores">
              <div className="score-item">
                <div className="score-circle good">85</div>
                <span>Overall</span>
              </div>
              <div className="score-item">
                <div className="score-circle medium">72</div>
                <span>Texture</span>
              </div>
              <div className="score-item">
                <div className="score-circle good">88</div>
                <span>Hydration</span>
              </div>
            </div>
            <div className="preview-concerns">
              <span className="concern-badge">Mild Acne</span>
              <span className="concern-badge">Slight Redness</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges - Safer language */}
      <section className="trust-badges">
        <div className="badge-item">
          <span className="badge-icon-trust">&#128274;</span>
          <span>Encrypted Uploads</span>
        </div>
        <div className="badge-item">
          <span className="badge-icon-trust">&#128218;</span>
          <span>Built on Dermatology Research</span>
        </div>
        <div className="badge-item">
          <span className="badge-icon-trust">&#128465;</span>
          <span>Delete Data Anytime</span>
        </div>
        <div className="badge-item">
          <span className="badge-icon-trust">&#9989;</span>
          <span>Privacy-First Processing</span>
        </div>
      </section>

      {/* What You'll Get Section - NEW */}
      <section className="results-preview">
        <div className="section-header">
          <span className="section-tag">Your Results</span>
          <h2>What You'll Get</h2>
          <p>Comprehensive skin analysis with actionable insights</p>
        </div>
        <div className="results-grid">
          <div className="result-card">
            <div className="result-icon">&#128200;</div>
            <h3>Skin Scores</h3>
            <p>Overall health, texture, hydration, and clarity scores from 0-100</p>
          </div>
          <div className="result-card">
            <div className="result-icon">&#128269;</div>
            <h3>Concern Detection</h3>
            <p>Identifies visible signs of acne, redness, pigmentation, and fine lines</p>
          </div>
          <div className="result-card">
            <div className="result-icon">&#128161;</div>
            <h3>Routine Suggestions</h3>
            <p>Personalized AM/PM skincare routine recommendations</p>
          </div>
          <div className="result-card">
            <div className="result-icon">&#128202;</div>
            <h3>Progress Tracking</h3>
            <p>Track improvements over time with scan history comparisons</p>
          </div>
        </div>
      </section>

      {/* How It Works - Updated with guidance */}
      <section className="how-it-works">
        <div className="section-header">
          <span className="section-tag">Simple Process</span>
          <h2>How It Works</h2>
          <p>Get your personalized skin analysis in three easy steps</p>
        </div>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon">&#128247;</div>
            <h3>Upload Photo</h3>
            <p>Take or upload a clear selfie</p>
            <div className="step-tips">
              <span>&#9989; Good lighting</span>
              <span>&#9989; No makeup</span>
              <span>&#9989; Front-facing</span>
            </div>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon">&#129302;</div>
            <h3>AI Analysis</h3>
            <p>Our model detects visible signs of acne, redness, pigmentation, and texture patterns</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">&#128203;</div>
            <h3>Get Results</h3>
            <p>Receive a skin summary, concern scores, and personalized routine suggestions</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Understand Your Skin?</h2>
          <p>Get instant AI-powered insights from a single photo</p>
          <button className="btn-primary large" onClick={() => navigate('/scan')}>
            Start Free Skin Scan
          </button>
          <p className="cta-reassurance">
            &#128274; Your photo is processed securely and never shared
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo-text">SkinCare<span className="logo-highlight">AI</span></span>
            <p>AI-powered skin analysis for everyone</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Product</h4>
              <Link to="/scan">Skin Analysis</Link>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/history">History</Link>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/privacy#delete">Delete My Data</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 SkinCareAI. All rights reserved.</p>
          <p className="disclaimer">Not a medical device. Not intended to diagnose, treat, or prevent any condition. For informational purposes only.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
