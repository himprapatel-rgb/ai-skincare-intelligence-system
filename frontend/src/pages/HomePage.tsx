import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  IconZap, IconScan, IconClock, IconShield, IconBookOpen, 
  IconTrash2, IconCheckCircle, IconBarChart, IconSearch, 
  IconSparkles, IconTrendingUp, IconCheck
} from '../components/Icons';
import './HomePage.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      {/* Hero Section - Updated with safer claims */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span className="badge-icon">
                <IconZap size={20} strokeWidth={2} />
              </span>
              Premium Skin Intelligence
            </div>
            <h1 className="hero-title">
              AI Skin Analysis<br />
              <span className="gradient-text">From a Single Photo</span>
            </h1>
            <p className="hero-subtitle">
              Upload a selfie to get instant insights on acne, spots, redness, and skin texture — plus personalized skincare recommendations.
            </p>
            <div className="hero-cta">
              <button className="btn-primary btn-primary-hero" onClick={() => navigate('/scan')}>
                <span className="btn-icon">
                  <IconScan size={20} strokeWidth={2} />
                </span>
                Start Free Skin Scan
              </button>
              <button className="btn-secondary btn-ghost" onClick={() => navigate('/analysis/demo')}>
                See Sample Report
              </button>
              <button className="btn-secondary btn-ghost" onClick={() => navigate('/digital-twin')}>
                <span className="btn-icon">
                  <IconTrendingUp size={20} strokeWidth={2} />
                </span>
                View Digital Twin
              </button>
            </div>
            <p className="hero-reassurance">
              <IconClock size={16} strokeWidth={2} className="inline-icon" />
              Takes ~30 seconds &bull; No signup required &bull; Delete your photo anytime
            </p>
          </div>
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
              <p className="preview-disclaimer">Results are estimates based on visible features and image quality.</p>
          </div>
        </div>
      </section>

      {/* Trust Badges - Safer language */}
      <section className="trust-badges">
        <div className="badge-item">
          <span className="badge-icon-trust">
            <IconShield size={24} strokeWidth={2} />
          </span>
          <span>Encrypted Uploads</span>
        </div>
        <div className="badge-item">
          <span className="badge-icon-trust">
            <IconBookOpen size={24} strokeWidth={2} />
          </span>
          <span>Built on Dermatology Research</span>
        </div>
        <div className="badge-item">
          <span className="badge-icon-trust">
            <IconTrash2 size={24} strokeWidth={2} />
          </span>
          <span>Delete Data Anytime</span>
        </div>
        <div className="badge-item">
          <span className="badge-icon-trust">
            <IconCheckCircle size={24} strokeWidth={2} />
          </span>
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
            <div className="result-icon">
              <IconBarChart size={48} strokeWidth={2} />
            </div>
            <h3>Skin Scores</h3>
            <p>Overall health, texture, hydration, and clarity scores from 0-100</p>
          </div>
          <div className="result-card">
            <div className="result-icon">
              <IconSearch size={48} strokeWidth={2} />
            </div>
            <h3>Concern Detection</h3>
            <p>Identifies visible signs of acne, redness, pigmentation, and fine lines</p>
          </div>
          <div className="result-card">
            <div className="result-icon">
              <IconSparkles size={48} strokeWidth={2} />
            </div>
            <h3>Routine Suggestions</h3>
            <p>Personalized AM/PM skincare routine recommendations</p>
          </div>
          <div className="result-card">
            <div className="result-icon">
              <IconTrendingUp size={48} strokeWidth={2} />
            </div>
            <h3>Progress Tracking</h3>
                        <p>Track improvements over time with scan history comparisons <span className="account-note">(Optional – requires account)</span></p>
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
            <div className="step-illustration step-illustration--primary" aria-hidden="true">
              <svg viewBox="0 0 180 130" fill="none">
                <rect x="44" y="10" width="76" height="110" rx="14" stroke="currentColor" strokeWidth="3" />
                <rect x="54" y="22" width="56" height="86" rx="10" stroke="currentColor" strokeWidth="2" opacity="0.45" />
                <circle cx="82" cy="62" r="18" stroke="currentColor" strokeWidth="2.5" />
                <path d="M74 58c2-2.8 4.8-4.2 8-4.2s6 1.4 8 4.2" stroke="currentColor" strokeWidth="2.5" />
                <path d="M72 68c3 3.6 6.6 5.4 10 5.4s7-1.8 10-5.4" stroke="currentColor" strokeWidth="2.5" />
                <path d="M58 30h10M104 30h10M58 104h10M104 104h10" stroke="currentColor" strokeWidth="2.5" />
                <path d="M18 32l12-6M18 64l12 0M18 96l12 6" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                <path d="M130 26l14 6M130 64h14M130 98l14-6" stroke="currentColor" strokeWidth="2" opacity="0.6" />
              </svg>
            </div>
            <h3>Upload Photo</h3>
            <p>Take or upload a clear selfie</p>
            <div className="step-tips">
              <span>
                <IconCheck size={16} strokeWidth={2} className="inline-icon" />
                Good lighting
              </span>
              <span>
                <IconCheck size={16} strokeWidth={2} className="inline-icon" />
                No makeup
              </span>
              <span>
                <IconCheck size={16} strokeWidth={2} className="inline-icon" />
                Front-facing
              </span>
            </div>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-illustration step-illustration--accent" aria-hidden="true">
              <svg viewBox="0 0 180 130" fill="none">
                <path d="M56 44c4-16 18-26 34-26 20 0 36 16 36 36 0 10-4 20-12 26" stroke="currentColor" strokeWidth="3" />
                <path d="M52 64c0 18 14 32 32 32h18c10 0 18-8 18-18 0-6-3-12-8-15" stroke="currentColor" strokeWidth="3" />
                <circle cx="74" cy="54" r="6" stroke="currentColor" strokeWidth="2" />
                <circle cx="100" cy="52" r="6" stroke="currentColor" strokeWidth="2" />
                <circle cx="90" cy="76" r="6" stroke="currentColor" strokeWidth="2" />
                <path d="M26 52h18M136 52h18M26 80h18M136 80h18" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                <path d="M40 34l10 8M130 34l-10 8M40 96l10-8M130 96l-10-8" stroke="currentColor" strokeWidth="2" opacity="0.6" />
              </svg>
            </div>
            <h3>AI Analysis</h3>
            <p>Our model detects visible signs of acne, redness, pigmentation, and texture patterns</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-illustration step-illustration--soft" aria-hidden="true">
              <svg viewBox="0 0 180 130" fill="none">
                <rect x="44" y="16" width="92" height="98" rx="14" stroke="currentColor" strokeWidth="3" />
                <rect x="60" y="32" width="60" height="10" rx="5" stroke="currentColor" strokeWidth="2" />
                <path d="M64 58h26M64 72h30M64 86h20" stroke="currentColor" strokeWidth="2" opacity="0.7" />
                <path d="M114 58v28" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                <path d="M100 88l12-18 12 10" stroke="currentColor" strokeWidth="3" />
                <circle cx="120" cy="90" r="6" stroke="currentColor" strokeWidth="2.5" />
                <path d="M26 30l12 8M26 100l12-8M142 30l12 8M142 100l12-8" stroke="currentColor" strokeWidth="2" opacity="0.6" />
              </svg>
            </div>
            <h3>Get Results</h3>
            <p>Receive a skin summary, concern scores, and personalized routine suggestions</p>
          </div>
        </div>
      </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <div className="section-header">
            <span className="section-tag">Common Questions</span>
            <h2>FAQ</h2>
          </div>
          <div className="faq-container">
            <details className="faq-item">
              <summary>Is this a medical diagnosis?</summary>
              <p>No. This tool provides informational insights only. It is not intended to diagnose, treat, or prevent any condition.</p>
            </details>
            <details className="faq-item">
              <summary>Do you store my photos?</summary>
              <p>Photos are processed securely and can be deleted anytime from your account or automatically after analysis.</p>
            </details>
            <details className="faq-item">
              <summary>Is this free to use?</summary>
              <p>Yes! Basic skin analysis scans are completely free with no signup required. Advanced features like progress tracking require a free account.</p>
            </details>
            <details className="faq-item">
              <summary>What skin types are supported?</summary>
              <p>Our AI works with all skin types and tones. However, accuracy improves with clear, well-lit photos and front-facing angles.</p>
            </details>
            <details className="faq-item">
              <summary>How long does analysis take?</summary>
              <p>Most scans complete in 20-40 seconds. Complex images may take up to 60 seconds depending on server load.</p>
            </details>
            <details className="faq-item">
              <summary>Can I use this for medical purposes?</summary>
              <p>No. This is an informational tool only and should never replace professional medical advice from a qualified dermatologist or healthcare provider.</p>
            </details>
            <details className="faq-item">
              <summary>Do you sell my data?</summary>
              <p>Never. We do not sell, share, or monetize your personal data or photos. Your privacy is our priority.</p>
            </details>
            <details className="faq-item">
              <summary>What affects accuracy?</summary>
              <p>Lighting, camera quality, image clarity, and whether makeup is present can all affect the analysis results.</p>
            </details>
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
            <IconShield size={16} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />
            Your photo is processed securely and never shared
          </p>
        </div>
      </section>

        {/* Mobile Sticky CTA */}
        <div className="mobile-sticky-cta">
          <button className="btn-primary" onClick={() => navigate('/scan')}>
            Start Free Skin Scan
          </button>
        </div>
    </div>
  );
};

export default HomePage;
