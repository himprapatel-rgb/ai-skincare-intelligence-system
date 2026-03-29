import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  IconZap, IconScan, IconClock, IconShield, IconBookOpen,
  IconBarChart, IconSearch, IconSparkles, IconTrendingUp,
  IconCheck, IconStar
} from '../components/Icons';
import './HomePage.css';

interface FadeInSectionProps {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

const FadeInSection: React.FC<FadeInSectionProps> = ({ children, className = '', 'aria-label': ariaLabel }) => {
  const shouldAnimate =
    typeof window !== 'undefined' &&
    'IntersectionObserver' in window &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [isVisible, setVisible] = useState(!shouldAnimate);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shouldAnimate) return;
    const current = domRef.current;
    if (!current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    observer.observe(current);
    return () => {
      observer.unobserve(current);
    };
  }, [shouldAnimate]);

  return (
    <section
      className={`fade-in-section ${isVisible ? 'is-visible' : ''} ${className}`}
      ref={domRef}
      aria-label={ariaLabel}
    >
      {children}
    </section>
  );
};

/** Animated number counter — shows final value immediately, then does a subtle count-up from ~80% when scrolled into view. Never shows low/zero numbers. */
const AnimatedCounter: React.FC<{
  end: number; suffix?: string; prefix?: string; duration?: number; decimal?: boolean;
}> = ({ end, suffix = '', prefix = '', duration = 1200, decimal = false }) => {
  // Start at final value so the page never shows 0 or bad numbers
  const [count, setCount] = useState(end);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return; // Already showing end value
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          // Animate from 80% of the target to 100% — subtle, never shows bad numbers
          const start = Math.round(end * 0.8);
          setCount(start);
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(start + eased * (end - start)));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  const displayValue = decimal
    ? (count / 10).toFixed(1)
    : count.toLocaleString();

  return (
    <span ref={ref} className="stat-number stat-number--animated">
      {prefix}{displayValue}{suffix}
    </span>
  );
};

/** Scroll-down chevron indicator */
const ScrollIndicator: React.FC = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY < 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={`scroll-indicator ${visible ? 'scroll-indicator--visible' : ''}`} aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 13l5 5 5-5" />
        <path d="M7 6l5 5 5-5" />
      </svg>
    </div>
  );
};

const faqData = [
  { q: 'Is this a medical diagnosis?', a: 'No. This tool provides informational insights only. It is not intended to diagnose, treat, or prevent any condition.' },
  { q: 'Do you store my photos?', a: 'Photos are processed securely and can be deleted anytime from your account or automatically after analysis.' },
  { q: 'Is this free to use?', a: 'Yes! Basic skin analysis scans are completely free with no signup required. Advanced features like progress tracking require a free account.' },
  { q: 'What skin types are supported?', a: 'Our AI works with all skin types and tones. However, accuracy improves with clear, well-lit photos and front-facing angles.' },
  { q: 'How long does analysis take?', a: 'Most scans complete in 20-40 seconds. Complex images may take up to 60 seconds depending on server load.' },
  { q: 'Can I use this for medical purposes?', a: 'No. This is an informational tool only and should never replace professional medical advice from a qualified dermatologist or healthcare provider.' },
  { q: 'Do you sell my data?', a: 'Never. We do not sell, share, or monetize your personal data or photos. Your privacy is our priority.' },
  { q: 'What affects accuracy?', a: 'Lighting, camera quality, image clarity, and whether makeup is present can all affect the analysis results.' },
];

const FaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = useCallback((i: number) => {
    setOpenIndex(prev => (prev === i ? null : i));
  }, []);

  return (
    <div className="faq-container">
      {faqData.map((item, i) => (
        <div
          key={i}
          className={`faq-item ${openIndex === i ? 'faq-item--open' : ''}`}
          role="region"
        >
          <button
            type="button"
            className="faq-summary"
            onClick={() => toggle(i)}
            aria-expanded={openIndex === i}
          >
            {item.q}
            <span className="faq-chevron" aria-hidden="true" />
          </button>
          <div className="faq-answer">
            <p>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

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
    <div className="homepage">
      {/* Hero Section - Updated with safer claims */}
      <FadeInSection className="hero">
        <div className="hero-decoration" aria-hidden="true">
          <span className="hero-blob hero-blob--1" />
          <span className="hero-blob hero-blob--2" />
          <span className="hero-blob hero-blob--3" />
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span className="badge-icon">
                <IconZap size={20} strokeWidth={2} />
              </span>
              Clinical Skin Insights
            </div>
            <h1 className="hero-title">
              AI Skin Assessment<br />
              <span className="gradient-text">From a Single Photo</span>
            </h1>
            <p className="hero-subtitle">
              Receive clear skin-quality insights and practical care recommendations in under a minute.
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
            {/* Learn more link removed — all sections now visible on mobile */}
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
        <ScrollIndicator />
      </FadeInSection>

      {/* Trust Badges - Privacy first, then Encrypted, Research, Delete */}
      <FadeInSection className="trust-badges-section">
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
      </FadeInSection>

      {/* Trust / Compliance badges (replacing unverifiable press mentions) */}
      <FadeInSection className="as-featured-section" aria-label="Built with trust">
        <p className="as-featured-label">Built with clinical standards</p>
        <div className="as-featured-logos" role="list">
          <span className="as-featured-badge" role="listitem">GDPR Compliant</span>
          <span className="as-featured-badge" role="listitem">AI-Powered Analysis</span>
          <span className="as-featured-badge" role="listitem">Dermatology Research</span>
          <span className="as-featured-badge" role="listitem">AES-256 Encrypted</span>
        </div>
      </FadeInSection>

      {/* Community Stats */}
      <FadeInSection className="stats-section">
        <div className="section-header">
          <span className="section-tag">Trusted Platform</span>
          <h2>Join Thousands of Skincare Enthusiasts</h2>
          <p>Real results from real users improving their skin health</p>
        </div>
        <div className="stats-grid">
          <div className="stat-item">
            <AnimatedCounter end={50000} suffix="+" />
            <span className="stat-label">Scans Completed</span>
          </div>
          <div className="stat-item">
            <AnimatedCounter end={12000} suffix="+" />
            <span className="stat-label">Active Users</span>
          </div>
          <div className="stat-item">
            <AnimatedCounter end={48} suffix="/5" decimal />
            <span className="stat-label">User Rating</span>
          </div>
          <div className="stat-item">
            <AnimatedCounter end={95} suffix="%" />
            <span className="stat-label">Satisfaction Rate</span>
          </div>
        </div>
      </FadeInSection>

      {/* What You'll Get Section - NEW */}
      <FadeInSection className="results-preview">
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
      </FadeInSection>

      {/* How It Works - Updated with guidance */}
      <FadeInSection className="how-it-works">
        <div className="section-header">
          <span className="section-tag">Simple Process</span>
          <h2>How It Works</h2>
          <p>Get your personalized skin analysis in three easy steps</p>
        </div>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-illustration step-illustration--primary" aria-hidden="true">
              <img src="/how-it-works-upload.svg" alt="Upload your photo for skin analysis" loading="lazy" width="200" height="160" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
              <img src="/how-it-works-analysis.svg" alt="AI analyzes your skin" loading="lazy" width="200" height="160" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <h3>AI Analysis</h3>
            <p>Our model detects visible signs of acne, redness, pigmentation, and texture patterns</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-illustration step-illustration--soft" aria-hidden="true">
              <img src="/how-it-works-results.svg" alt="View your personalized results" loading="lazy" width="200" height="160" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <h3>Get Results</h3>
            <p>Receive a skin summary, concern scores, and personalized routine suggestions</p>
          </div>
        </div>
      </FadeInSection>

      {/* Skin Expert CTA */}
      <FadeInSection className="skin-expert-section">
        <div className="skin-expert-container">
          <div className="skin-expert-text">
            <span className="section-tag">Ask an Expert</span>
            <h2>Talk to Our Skin Expert</h2>
            <p>Get personalized skincare guidance from our AI-powered skin consultant — trained on dermatology research, ingredient science, and your unique skin profile.</p>
            <ul className="skin-expert-features">
              <li><IconCheck size={16} strokeWidth={2} className="inline-icon" /> Personalized routine recommendations</li>
              <li><IconCheck size={16} strokeWidth={2} className="inline-icon" /> Ingredient analysis &amp; conflict detection</li>
              <li><IconCheck size={16} strokeWidth={2} className="inline-icon" /> Progress interpretation from your scans</li>
              <li><IconCheck size={16} strokeWidth={2} className="inline-icon" /> Available 24/7, instant responses</li>
            </ul>
            <button type="button" className="btn btn-primary btn-primary--hero" onClick={() => navigate('/chat')}>
              <IconSparkles size={18} strokeWidth={2} />
              Ask Skin Expert
            </button>
          </div>
          <div className="skin-expert-preview">
            <div className="skin-expert-chat-preview">
              <div className="chat-bubble chat-bubble--user">
                My skin feels dry after using retinol. What should I do?
              </div>
              <div className="chat-bubble chat-bubble--expert">
                <span className="expert-label"><span className="expert-dot" /> Skin Expert</span>
                That's a common response when starting retinol. I'd recommend reducing frequency to every other night and adding a ceramide-rich moisturizer...
              </div>
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* Testimonials */}
      <FadeInSection className="testimonials-section">
        <div className="section-header">
          <span className="section-tag">Real Results</span>
          <h2>Stories from Our Users</h2>
          <p>See how people improved their routines with SkinCareAI</p>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-header">
              <div className="testimonial-avatar">
                <img loading="lazy" src={avatarBase('AP', '#1f6feb')} alt="Ananya P." />
              </div>
              <div>
                <h3>Ananya P.</h3>
                <span>Before/After: Redness control</span>
              </div>
            </div>
            <div className="testimonial-stars">
              {Array.from({ length: 5 }).map((_, index) => (
                <IconStar key={index} size={16} strokeWidth={2} fill="#f59e0b" stroke="#f59e0b" />
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
                <img loading="lazy" src={avatarBase('JR', '#0f766e')} alt="James R." />
              </div>
              <div>
                <h3>James R.</h3>
                <span>Before/After: Texture improvements</span>
              </div>
            </div>
            <div className="testimonial-stars">
              {Array.from({ length: 5 }).map((_, index) => (
                <IconStar key={index} size={16} strokeWidth={2} fill="#f59e0b" stroke="#f59e0b" />
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
                <img loading="lazy" src={avatarBase('SK', '#f97316')} alt="Sarah K." />
              </div>
              <div>
                <h3>Sarah K.</h3>
                <span>Before/After: Hydration + glow</span>
              </div>
            </div>
            <div className="testimonial-stars">
              {Array.from({ length: 5 }).map((_, index) => (
                <IconStar key={index} size={16} strokeWidth={2} fill="#f59e0b" stroke="#f59e0b" />
              ))}
            </div>
            <p>
              “The routine suggestions were spot on. My hydration went from
              low to balanced, and the before/after view kept me motivated.”
            </p>
          </div>
        </div>
      </FadeInSection>

        {/* FAQ Section */}
        <FadeInSection className="faq-section">
          <div className="section-header">
            <span className="section-tag">Common Questions</span>
            <h2>FAQ</h2>
          </div>
          <FaqAccordion />
        </FadeInSection>

      {/* CTA Section - single link to avoid duplicate primary CTA (Phase 1 fix) */}
      <FadeInSection className="cta-section">
        <div className="cta-content">
          <h2>Ready to Understand Your Skin?</h2>
          <p>Get instant AI-powered insights from a single photo</p>
          <button type="button" className="btn btn-cta-hero" onClick={() => navigate('/scan')}>Start Free Skin Scan</button>
          <p className="cta-reassurance">
            <IconShield size={16} strokeWidth={2} className="icon-inline" />
            Your photo is processed securely and never shared
          </p>
        </div>
      </FadeInSection>
      {/* Single CTA on home: hero button only (no floating CTA to avoid duplicate) */}
    </div>
  );
};

export default HomePage;
