import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      {/* Hero Section - Updated with safer claims */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">&#128161;</span>
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
            <button className="btn-primary" onClick={() => navigate('/scan')}>
              <span className="btn-icon">&#128247;</span>
              Start Free Skin Scan
            </button>
            <button className="btn-secondary" onClick={() => navigate('/analysis/demo')}>
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
              <p className="preview-disclaimer">Results are estimates based on visible features and image quality.</p>
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

        {/* FAQ Section */}
        <section className="faq-section">
          <div className="section-header">
            <span className="section-tag">Common Questions</span>
            <h2>FAQ</h2>
          </div>
          <div className="faq-container">
            <div className="faq-item">
              <h4>Is this a medical diagnosis?</h4>
              <p>No. This tool provides informational insights only. It is not intended to diagnose, treat, or prevent any condition.</p>
            </div>
            <div className="faq-item">
              <h4>Do you store my photos?</h4>
              <p>Photos are processed securely and can be deleted anytime from your account or automatically after analysis.</p>
            </div>
            <div className="faq-item">
              <h4>Is this free to use?</h4>
              <p>Yes! Basic skin analysis scans are completely free with no signup required. Advanced features like progress tracking require a free account.</p>
            </div>
          <div className="faq-item">
            <h4>What skin types are supported?</h4>
            <p>Our AI works with all skin types and tones. However, accuracy improves with clear, well-lit photos and front-facing angles.</p>
          </div>
          <div className="faq-item">
            <h4>How long does analysis take?</h4>
            <p>Most scans complete in 20-40 seconds. Complex images may take up to 60 seconds depending on server load.</p>
          </div>
          <div className="faq-item">
            <h4>Can I use this for medical purposes?</h4>
            <p>No. This is an informational tool only and should never replace professional medical advice from a qualified dermatologist or healthcare provider.</p>
          </div>
            <div className="faq-item">
              <h4>Do you sell my data?</h4>
              <p>Never. We do not sell, share, or monetize your personal data or photos. Your privacy is our priority.</p>
            </div>
            <div className="faq-item">
              <h4>What affects accuracy?</h4>
              <p>Lighting, camera quality, image clarity, and whether makeup is present can all affect the analysis results.</p>
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
