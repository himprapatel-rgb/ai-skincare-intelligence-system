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
            <span className="logo-icon">✨</span>
            <span className="logo-text">AI Skincare AI</span>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/scan" className="nav-link">Features</Link>
            <Link to="/auth" className="nav-link">About</Link>
            <Link to="/auth" className="nav-btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span>🔬 AI-Powered Skincare Analysis</span>
          </div>
          <h1 className="hero-title">
            Your Skin's Personal
            <br />
            <span className="gradient-text">Intelligence Platform</span>
          </h1>
          <p className="hero-description">
            Transform your skincare routine with AI-powered analysis.
            Upload a selfie and receive personalized recommendations,
            track your progress, and achieve your skin goals.
          </p>
          <div className="hero-buttons">
            <button 
              className="btn-primary"
              onClick={() => navigate('/scan')}
            >
              Start Free Scan
              <span className="btn-arrow">→</span>
            </button>
            <button 
              className="btn-secondary"
              onClick={() => navigate('/auth')}
            >
              Learn More
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Active Users</span>
            </div>
            <div className="stat">
              <span className="stat-number">1M+</span>
              <span className="stat-label">Scans Completed</span>
            </div>
            <div className="stat">
              <span className="stat-number">98%</span>
              <span className="stat-label">Satisfaction Rate</span>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-card animate-float">
            <div className="card-header">
              <div className="card-icon">📊</div>
              <div>
                <h3>Skin Analysis</h3>
                <p>Real-time results</p>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress" style={{width: '85%'}}></div>
            </div>
            <div className="metrics">
              <div className="metric">
                <span>Hydration</span>
                <strong>85%</strong>
              </div>
              <div className="metric">
                <span>Texture</span>
                <strong>72%</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="section-header">
          <span className="section-badge">Features</span>
          <h2 className="section-title">Everything You Need for Perfect Skin</h2>
          <p className="section-description">
            Advanced AI technology meets personalized skincare
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>AI-Powered Analysis</h3>
            <p>Advanced machine learning algorithms analyze your skin in seconds, detecting concerns and tracking improvements.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Privacy First</h3>
            <p>Your data is encrypted and secure. We never share your information without your explicit consent.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Progress Tracking</h3>
            <p>Monitor your skin's journey with detailed analytics, charts, and historical comparisons.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💎</div>
            <h3>Personalized Recommendations</h3>
            <p>Get product suggestions tailored to your unique skin type, concerns, and goals.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Routine Builder</h3>
            <p>Create and customize your perfect skincare routine with AI-guided recommendations.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⭐</div>
            <h3>Expert Insights</h3>
            <p>Access professional-grade analysis typically reserved for dermatologist offices.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="section-header">
          <span className="section-badge">Process</span>
          <h2 className="section-title">How It Works</h2>
          <p className="section-description">
            Get professional-grade skin analysis in 3 simple steps
          </p>
        </div>
        <div className="steps">
          <div className="step">
            <div className="step-number">01</div>
            <div className="step-icon">📸</div>
            <h3>Upload Your Selfie</h3>
            <p>Take a clear photo of your face in good lighting. Our AI supports all skin types and tones.</p>
          </div>
          <div className="step-line"></div>
          <div className="step">
            <div className="step-number">02</div>
            <div className="step-icon">🧠</div>
            <h3>AI Analysis</h3>
            <p>Our advanced algorithms analyze your skin, detecting concerns, texture, and hydration levels.</p>
          </div>
          <div className="step-line"></div>
          <div className="step">
            <div className="step-number">03</div>
            <div className="step-icon">✨</div>
            <h3>Get Recommendations</h3>
            <p>Receive personalized product suggestions and a custom skincare routine tailored to you.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2>Ready to Transform Your Skin?</h2>
          <p>Join thousands of users who have discovered their perfect skincare routine</p>
          <button 
            className="btn-cta"
            onClick={() => navigate('/scan')}
          >
            Start Your Free Analysis
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>AI Skincare AI</h4>
            <p>Your personal skincare intelligence platform</p>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <Link to="/scan">Features</Link>
            <Link to="/auth">Pricing</Link>
            <Link to="/auth">How It Works</Link>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <Link to="/auth">About Us</Link>
            <Link to="/auth">Privacy Policy</Link>
            <Link to="/auth">Terms of Service</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 AI Skincare AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
