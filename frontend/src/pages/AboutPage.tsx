import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutPage.css';

const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <div className="about-container">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="hero-content">
            <h1 className="about-title">About SkinCareAI</h1>
            <p className="about-subtitle">
              AI-powered skin analysis for everyone, everywhere
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="about-section">
          <h2 className="section-title">Our Mission</h2>
          <div className="mission-content">
            <p>
              At SkinCareAI, we believe everyone deserves access to professional-grade
              skin analysis. Our mission is to democratize skincare by making AI-powered
              dermatological insights accessible, affordable, and easy to understand.
            </p>
            <p>
              We're building a future where personalized skincare isn't a luxury—it's
              a standard. By combining cutting-edge machine learning with evidence-based
              dermatology research, we help millions make informed decisions about their
              skin health.
            </p>
          </div>
        </section>

        {/* Technology Section */}
        <section className="about-section">
          <h2 className="section-title">Our Technology</h2>
          <div className="tech-grid">
            <div className="tech-card">
              <div className="tech-icon">🤖</div>
              <h3>AI-Powered Analysis</h3>
              <p>
                Advanced computer vision models trained on millions of dermatological
                images to detect skin conditions with clinical-grade accuracy.
              </p>
            </div>
            <div className="tech-card">
              <div className="tech-icon">🔒</div>
              <h3>Privacy First</h3>
              <p>
                Your photos are encrypted, processed securely, and never shared.
                Delete your data anytime with one click.
              </p>
            </div>
            <div className="tech-card">
              <div className="tech-icon">📚</div>
              <h3>Evidence-Based</h3>
              <p>
                Built on peer-reviewed dermatology research and validated by
                skincare professionals worldwide.
              </p>
            </div>
            <div className="tech-card">
              <div className="tech-icon">⚡</div>
              <h3>Instant Results</h3>
              <p>
                Get comprehensive skin analysis in under 30 seconds. No appointments,
                no waiting rooms, no hassle.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="about-section">
          <h2 className="section-title">Our Values</h2>
          <div className="values-list">
            <div className="value-item">
              <h4>Accessibility</h4>
              <p>
                Professional skincare insights should be available to everyone,
                regardless of location or income.
              </p>
            </div>
            <div className="value-item">
              <h4>Transparency</h4>
              <p>
                We're clear about what our technology can and cannot do. We're not
                a replacement for dermatologists—we're a helpful first step.
              </p>
            </div>
            <div className="value-item">
              <h4>Continuous Improvement</h4>
              <p>
                We constantly refine our AI models, incorporate user feedback, and
                stay updated with the latest dermatology research.
              </p>
            </div>
            <div className="value-item">
              <h4>User Privacy</h4>
              <p>
                Your data is yours. We never sell personal information and follow
                strict GDPR and privacy regulations.
              </p>
            </div>
          </div>
        </section>

        {/* Disclaimer Section */}
        <section className="about-section disclaimer-section">
          <div className="disclaimer-box">
            <h3>⚕️ Important Medical Disclaimer</h3>
            <p>
              SkinCareAI is not a medical device and is not intended to diagnose, treat,
              cure, or prevent any disease or condition. Our service provides informational
              insights only and should not replace professional medical advice. Always
              consult with a board-certified dermatologist for medical concerns.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="about-cta">
          <h2>Ready to understand your skin?</h2>
          <p>Get instant AI-powered insights from a single photo</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/scan')}
          >
            Start Free Skin Scan
          </button>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
