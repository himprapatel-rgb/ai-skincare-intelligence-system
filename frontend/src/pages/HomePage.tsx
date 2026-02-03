import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { 
  IconZap, IconScan, IconClock, IconShield, IconBookOpen, 
  IconBarChart, IconSearch, IconSparkles, IconTrendingUp, 
  IconCheck, IconStar
} from '../components/Icons';
import './HomePage.css';

const HomePage: React.FC = () => {
  usePageTitle(null);
  const navigate = useNavigate();
  const avatarBase = (initials: string, color: string) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0.35"/>
          </linearGradient>
        </defs>
        <rect width="96" height="96" rx="48" fill="url(#g)"/>
        <text x="50%" y="54%" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" fill="${color}" font-weight="700">
          ${initials}
        </text>
      </svg>`
    )}`;

  return (
    <div className="homepage app-page">
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
              Get instant AI insights on your skin health and personalized routine recommendations.
            </p>
            <div className="hero-cta">
              <button type="button" className="btn btn-primary btn-primary--hero" onClick={() => navigate('/scan')}>
                <span className="btn-icon">
                  <IconScan size={20} strokeWidth={2} />
                </span>
                Start Free Skin Scan
              </button>
              <button type="button" className="btn btn-ghost hero-cta-secondary" onClick={() => navigate('/analysis/demo')}>
                See Sample Report
              </button>
            </div>
            <p className="hero-reassurance">
              <IconClock size={16} strokeWidth={2} className="inline-icon" />
              Takes ~30 seconds &bull; No signup required &bull; Delete your photo anytime
            </p>
            <Link to="/about" className="hero-learn-more">Learn more</Link>
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

      <div className="app-page-content">
      {/* Trust Badges - Privacy first, then Encrypted, Research, Delete */}
      <section className="trust-badges-section">
        <div className="trust-badges-grid">
          <div className="trust-badge-card trust-badge-privacy">
            <span className="trust-badge-icon">
              <IconShield size={28} strokeWidth={2.5} fill="currentColor" />
            </span>
            <span className="trust-badge-text">Privacy-First Processing</span>
          </div>
          <div className="trust-badge-card trust-badge-security">
            <span className="trust-badge-icon">
              <IconShield size={28} strokeWidth={2.5} fill="currentColor" />
            </span>
            <span className="trust-badge-text">Encrypted Uploads</span>
          </div>
          <div className="trust-badge-card trust-badge-research">
            <span className="trust-badge-icon">
              <IconBookOpen size={28} strokeWidth={2.5} fill="currentColor" />
            </span>
            <span className="trust-badge-text">Dermatology Research</span>
          </div>
          <div className="trust-badge-card trust-badge-delete">
            <span className="trust-badge-icon">
              <IconShield size={28} strokeWidth={2.5} fill="currentColor" />
            </span>
            <span className="trust-badge-text">Delete Data Anytime</span>
          </div>
        </div>
      </section>

      {/* As featured / Social proof (Task 213) */}
      <section className="as-featured-section" aria-label="As featured in">
        <p className="as-featured-label">As featured in</p>
        <div className="as-featured-logos">
          <span className="as-featured-name">Allure</span>
          <span className="as-featured-name">Derm Review</span>
          <span className="as-featured-name">TechCrunch</span>
          <span className="as-featured-name">Skincare.com</span>
        </div>
      </section>

      {/* Community Stats */}
      <section className="stats-section">
        <div className="section-header">
          <span className="section-tag">Trusted Platform</span>
          <h2>Join Thousands of Skincare Enthusiasts</h2>
          <p>Real results from real users improving their skin health</p>
        </div>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">50,000+</span>
            <span className="stat-label">Scans Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">12,000+</span>
            <span className="stat-label">Active Users</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">4.8/5</span>
            <span className="stat-label">User Rating</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">95%</span>
            <span className="stat-label">Satisfaction Rate</span>
          </div>
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
              <img src="/how-it-works-upload.svg" alt="Upload your photo for skin analysis" loading="lazy" width="200" height="160" />
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
              <img src="/how-it-works-analysis.svg" alt="AI analyzes your skin" loading="lazy" width="200" height="160" />
            </div>
            <h3>AI Analysis</h3>
            <p>Our model detects visible signs of acne, redness, pigmentation, and texture patterns</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-illustration step-illustration--soft" aria-hidden="true">
              <img src="/how-it-works-results.svg" alt="View your personalized results" loading="lazy" width="200" height="160" />
            </div>
            <h3>Get Results</h3>
            <p>Receive a skin summary, concern scores, and personalized routine suggestions</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="section-header">
          <span className="section-tag">Real Results</span>
          <h2>Stories from Our Users</h2>
          <p>See how people improved their routines with SkinCareAI</p>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-header">
              <div className="testimonial-avatar">
                <img src={avatarBase('AP', '#1f6feb')} alt="Ananya P." />
              </div>
              <div>
                <h3>Ananya P.</h3>
                <span>Before/After: Redness control</span>
              </div>
            </div>
            <div className="testimonial-stars">
              {Array.from({ length: 5 }).map((_, index) => (
                <IconStar key={index} size={16} strokeWidth={2} />
              ))}
            </div>
            <p>
              “The weekly scans helped me spot patterns and adjust my routine.
              In six weeks, my redness score dropped and my skin felt calmer.”
            </p>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-header">
              <div className="testimonial-avatar">
                <img src={avatarBase('JR', '#0f766e')} alt="James R." />
              </div>
              <div>
                <h3>James R.</h3>
                <span>Before/After: Texture improvements</span>
              </div>
            </div>
            <div className="testimonial-stars">
              {Array.from({ length: 5 }).map((_, index) => (
                <IconStar key={index} size={16} strokeWidth={2} />
              ))}
            </div>
            <p>
              “I finally understood which products were working. The AI
              flagged irritation early, and my texture score improved fast.”
            </p>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-header">
              <div className="testimonial-avatar">
                <img src={avatarBase('SK', '#f97316')} alt="Sarah K." />
              </div>
              <div>
                <h3>Sarah K.</h3>
                <span>Before/After: Hydration + glow</span>
              </div>
            </div>
            <div className="testimonial-stars">
              {Array.from({ length: 5 }).map((_, index) => (
                <IconStar key={index} size={16} strokeWidth={2} />
              ))}
            </div>
            <p>
              “The routine suggestions were spot on. My hydration went from
              low to balanced, and the before/after view kept me motivated.”
            </p>
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

      {/* CTA Section - single link to avoid duplicate primary CTA (Phase 1 fix) */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Understand Your Skin?</h2>
          <p>Get instant AI-powered insights from a single photo</p>
          <Link to="/scan" className="cta-section-link">Go to free skin scan</Link>
          <p className="cta-reassurance">
            <IconShield size={16} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />
            Your photo is processed securely and never shared
          </p>
        </div>
      </section>
      </div>

      {/* Single CTA on home: hero button only (no floating CTA to avoid duplicate) */}
    </div>
  );
};

export default HomePage;
