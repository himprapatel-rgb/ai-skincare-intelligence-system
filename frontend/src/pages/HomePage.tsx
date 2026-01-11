// src/pages/HomePage.tsx - Ultra Modern 2026 Design
// BUILD TRIGGER: Force rebuild with modern 2026 premium UI
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import '../CommonStyles.css';
import './HomePage.css';

const HomePage = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: '🧬',
      title: 'AI-Powered Analysis',
      description: 'Advanced machine learning algorithms analyze your skin in real-time',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: '📸',
      title: 'Instant Skin Scan',
      description: 'Upload a selfie and get detailed insights within seconds',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '📊',
      title: 'Track Progress',
      description: 'Monitor your skin health journey with beautiful data visualizations',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: '✨',
      title: 'Personalized Routines',
      description: 'Get custom skincare recommendations based on your unique skin profile',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="homepage-container">
      {/* Hero Section with Parallax */}
      <section 
        className="hero-section"
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      >
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">✨</span>
            <span>Powered by Advanced AI</span>
          </div>
          
          <h1 className="hero-title">
            Your Skin,
            <span className="gradient-text"> Decoded</span>
            <br />
            in Seconds
          </h1>
          
          <p className="hero-subtitle">
            Experience the future of skincare with AI-powered analysis.
            Upload a selfie and unlock personalized insights for healthier, glowing skin.
          </p>

          <div className="hero-cta">
            <Link to="/scan" className="cta-button cta-primary">
              <span>📸</span>
              Start AI Scan
            </Link>
            <Link to="/dashboard" className="cta-button cta-secondary">
              <span>📊</span>
              View Dashboard
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">Accuracy</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Users</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">4.9★</div>
              <div className="stat-label">Rating</div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="floating-elements">
          <div className="float-circle float-1"></div>
          <div className="float-circle float-2"></div>
          <div className="float-circle float-3"></div>
        </div>
      </section>

      {/* Features Section with Glass Cards */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Why Choose AuraSkin AI</h2>
          <p className="section-subtitle">
            Cutting-edge technology meets personalized skincare
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <div className={`feature-gradient bg-gradient-to-r ${feature.gradient}`}></div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">Get Started in 3 Simple Steps</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Upload Photo</h3>
              <p>Take or upload a selfie</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>AI Analysis</h3>
              <p>Our AI scans your skin</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Get Results</h3>
              <p>Receive personalized insights</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Your Skincare?</h2>
          <p className="cta-text">
            Join thousands of users who have discovered their perfect skincare routine
          </p>
          <Link to="/scan" className="cta-button-large">
            Start Your Free Analysis
            <span className="cta-arrow">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
