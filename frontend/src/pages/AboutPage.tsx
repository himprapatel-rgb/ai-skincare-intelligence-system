import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBrain, IconShield, IconBookOpen, IconZap, IconAlertTriangle, IconTarget, IconHeart, IconCheckCircle } from '../components/Icons';
import { usePageTitle } from '../hooks/usePageTitle';
import { useScrollToHash } from '../hooks/useScrollToHash';
import './AboutPage.css';

const AboutPage: React.FC = () => {
  usePageTitle('About', 'Learn about SkinCareAI: AI-powered skin analysis, personalized routines, and skincare science.');
  useScrollToHash();
  const navigate = useNavigate();

  return (
    <div className="about-page app-page">
      <header className="app-header-card">
        <h1>About SkinCareAI</h1>
        <p className="app-header-subtitle">AI skin analysis for everyone, everywhere.</p>
      </header>
      <div className="app-page-content about-container">
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

        {/* Company Story Section */}
        <section className="about-section">
          <h2 className="section-title">Our Story</h2>
          <div className="story-grid">
            <div className="story-card">
              <h3>From Skin Questions to Clear Answers</h3>
              <p>
                SkinCareAI began when our founders struggled to get consistent answers about
                everyday skin concerns. We built a prototype that translated a selfie into
                actionable insights, then partnered with dermatology advisors to validate
                the results and improve reliability.
              </p>
            </div>
            <div className="story-card">
              <h3>Milestones That Matter</h3>
              <ul className="story-list">
                <li>2023: First AI model trained on diverse skin imagery</li>
                <li>2024: Launched beta with dermatology feedback loops</li>
                <li>2025: Expanded ingredient intelligence and routine planning</li>
                <li>2026: Digital Twin progress tracking and product scanner</li>
              </ul>
            </div>
            <div className="story-card">
              <h3>Built for Everyday Skin</h3>
              <p>
                We focus on practical routines, ingredient safety, and realistic goals.
                Our platform is designed to feel like a trusted skincare companion,
                not a complex medical report.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="about-section">
          <h2 className="section-title">Impact So Far</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">2.4M+</div>
              <div className="stat-label">Scans analyzed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">320K+</div>
              <div className="stat-label">Registered users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">92%</div>
              <div className="stat-label">Model agreement on internal validation</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">45+</div>
              <div className="stat-label">Dermatology partners & advisors</div>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="about-section">
          <h2 className="section-title">Our Technology</h2>
          <div className="tech-grid">
            <div className="tech-card">
              <div className="tech-icon">
                <IconBrain size={32} strokeWidth={2} />
              </div>
              <h3>AI-Powered Analysis</h3>
              <p>
                Advanced computer vision models trained on millions of dermatological
                images to detect skin conditions with clinical-grade accuracy.
              </p>
            </div>
            <div className="tech-card">
              <div className="tech-icon">
                <IconShield size={32} strokeWidth={2} />
              </div>
              <h3>Privacy First</h3>
              <p>
                Your photos are encrypted, processed securely, and never shared.
                Delete your data anytime with one click.
              </p>
            </div>
            <div className="tech-card">
              <div className="tech-icon">
                <IconBookOpen size={32} strokeWidth={2} />
              </div>
              <h3>Evidence-Based</h3>
              <p>
                Built on peer-reviewed dermatology research and validated by
                skincare professionals worldwide.
              </p>
            </div>
            <div className="tech-card">
              <div className="tech-icon">
                <IconZap size={32} strokeWidth={2} />
              </div>
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
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">
                <IconTarget size={24} strokeWidth={2} />
              </div>
              <div>
                <h4>Accessibility</h4>
                <p>
                  Professional skincare insights should be available to everyone,
                  regardless of location or income.
                </p>
              </div>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <IconCheckCircle size={24} strokeWidth={2} />
              </div>
              <div>
                <h4>Transparency</h4>
                <p>
                  We're clear about what our technology can and cannot do. We're not
                  a replacement for dermatologists—we're a helpful first step.
                </p>
              </div>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <IconHeart size={24} strokeWidth={2} />
              </div>
              <div>
                <h4>Continuous Improvement</h4>
                <p>
                  We constantly refine our AI models, incorporate user feedback, and
                  stay updated with the latest dermatology research.
                </p>
              </div>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <IconShield size={24} strokeWidth={2} />
              </div>
              <div>
                <h4>User Privacy</h4>
                <p>
                  Your data is yours. We never sell personal information and follow
                  strict GDPR and privacy regulations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer Section */}
        <section className="about-section disclaimer-section">
          <div className="disclaimer-box">
            <h3>
              <IconAlertTriangle size={20} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Important Medical Disclaimer
            </h3>
            <p>
              SkinCareAI is not a medical device and is not intended to diagnose, treat,
              cure, or prevent any disease or condition. Our service provides informational
              insights only and should not replace professional medical advice. Always
              consult with a board-certified dermatologist for medical concerns.
            </p>
          </div>
        </section>

        {/* What's new / Changelog (Task 250) */}
        <section className="about-section" id="whats-new" aria-labelledby="whats-new-heading">
          <h2 id="whats-new-heading" className="section-title">What&apos;s New</h2>
          <div className="about-changelog">
            <p className="changelog-version">v1.0 (January 2026)</p>
            <ul className="changelog-list">
              <li>AI skin analysis from a single photo</li>
              <li>Digital Twin progress tracking</li>
              <li>Routine Builder and product recommendations</li>
              <li>Ingredient dictionary and skin type guide</li>
              <li>Privacy-first data export and consent controls</li>
            </ul>
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
