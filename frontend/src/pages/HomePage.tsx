import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  IconZap, IconScan, IconClock, IconShield, IconBookOpen,
  IconBarChart, IconSearch, IconSparkles, IconTrendingUp,
  IconCheck, IconStar, IconLock, IconTrash2
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
  const [count, setCount] = useState(end);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
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

/** Animated score ring for the hero card */
const ScoreRing: React.FC<{ score: number; label: string; color: string; delay?: number }> = ({ score, label, color, delay = 0 }) => {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<SVGCircleElement>(null);
  const circumference = 2 * Math.PI * 26;
  const offset = circumference - (score / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), delay + 300);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className="score-ring-item">
      <svg width="68" height="68" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5" />
        <circle
          ref={ref}
          cx="30" cy="30" r="26"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
          }}
        />
        <text x="30" y="33" textAnchor="middle" fontSize="15" fontWeight="800" fill={color}>
          {score}
        </text>
      </svg>
      <span className="score-ring-label">{label}</span>
    </div>
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

  return (
    <div className="homepage">
      {/* ===================== HERO SECTION ===================== */}
      <section className="hero-2026">
        <div className="hero-mesh-bg" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-text-col">
            <div className="hero-badge-2026">
              <span className="hero-badge-dot" />
              AI-Powered Skin Analysis
            </div>
            <h1 className="hero-title-2026">
              Understand Your Skin<br />
              <span className="hero-gradient-text">In Under 60 Seconds</span>
            </h1>
            <p className="hero-subtitle-2026">
              Upload a photo and receive a detailed skin health assessment with
              personalized care recommendations — powered by clinical-grade AI.
            </p>
            <div className="hero-actions">
              <button type="button" className="hero-btn-primary" onClick={() => navigate('/scan')}>
                <IconScan size={20} strokeWidth={2} />
                Start Free Analysis
              </button>
              <button type="button" className="hero-btn-secondary" onClick={() => navigate('/analysis/demo')}>
                View Sample Report
              </button>
            </div>
            <div className="hero-trust-row">
              <span><IconClock size={14} /> ~30 sec analysis</span>
              <span className="hero-trust-sep" aria-hidden="true" />
              <span><IconShield size={14} /> No signup required</span>
              <span className="hero-trust-sep" aria-hidden="true" />
              <span><IconTrash2 size={14} /> Delete anytime</span>
            </div>
          </div>

          <div className="hero-visual-col">
            <div className="hero-card-glass">
              <div className="hero-card-header">
                <span className="hero-card-dot hero-card-dot--live" />
                Live Analysis Preview
              </div>
              <div className="hero-card-scores">
                <ScoreRing score={85} label="Overall" color="#22c55e" delay={0} />
                <ScoreRing score={72} label="Texture" color="#f59e0b" delay={200} />
                <ScoreRing score={88} label="Hydration" color="#3b82f6" delay={400} />
              </div>
              <div className="hero-card-concerns">
                <span className="hero-concern-pill">Mild Acne</span>
                <span className="hero-concern-pill">Slight Redness</span>
                <span className="hero-concern-pill hero-concern-pill--good">Good Elasticity</span>
              </div>
              <div className="hero-card-footer">
                AI confidence: High &middot; Based on visible features
              </div>
            </div>
          </div>
        </div>
        <ScrollIndicator />
      </section>

      {/* ===================== TRUST BAR ===================== */}
      <FadeInSection className="trust-bar-section">
        <div className="trust-bar">
          <div className="trust-bar-item">
            <div className="trust-bar-icon trust-bar-icon--green">
              <IconShield size={22} strokeWidth={2.5} />
            </div>
            <div className="trust-bar-content">
              <span className="trust-bar-title">GDPR Compliant</span>
              <span className="trust-bar-desc">Your data is protected under EU privacy law</span>
            </div>
          </div>
          <div className="trust-bar-item">
            <div className="trust-bar-icon trust-bar-icon--blue">
              <IconLock size={22} strokeWidth={2.5} />
            </div>
            <div className="trust-bar-content">
              <span className="trust-bar-title">AES-256 Encrypted</span>
              <span className="trust-bar-desc">Bank-grade encryption for all uploads</span>
            </div>
          </div>
          <div className="trust-bar-item">
            <div className="trust-bar-icon trust-bar-icon--purple">
              <IconZap size={22} strokeWidth={2.5} />
            </div>
            <div className="trust-bar-content">
              <span className="trust-bar-title">AI-Powered</span>
              <span className="trust-bar-desc">GPT-4 Vision + dermatology models</span>
            </div>
          </div>
          <div className="trust-bar-item">
            <div className="trust-bar-icon trust-bar-icon--teal">
              <IconBookOpen size={22} strokeWidth={2.5} />
            </div>
            <div className="trust-bar-content">
              <span className="trust-bar-title">Research-Backed</span>
              <span className="trust-bar-desc">Based on peer-reviewed dermatology</span>
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* ===================== STATS ===================== */}
      <FadeInSection className="stats-section-2026">
        <div className="stats-inner">
          <div className="stat-card">
            <AnimatedCounter end={50000} suffix="+" />
            <span className="stat-label">Scans Completed</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-card">
            <AnimatedCounter end={12000} suffix="+" />
            <span className="stat-label">Active Users</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-card">
            <AnimatedCounter end={48} suffix="/5" decimal />
            <span className="stat-label">User Rating</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-card">
            <AnimatedCounter end={95} suffix="%" />
            <span className="stat-label">Satisfaction</span>
          </div>
        </div>
      </FadeInSection>

      {/* ===================== BENTO FEATURES ===================== */}
      <FadeInSection className="bento-section">
        <div className="section-header">
          <span className="section-tag">What You Get</span>
          <h2>Comprehensive Skin Intelligence</h2>
          <p>Everything you need to understand and improve your skin health</p>
        </div>
        <div className="bento-grid">
          <div className="bento-card bento-card--large bento-card--scores">
            <div className="bento-card-icon">
              <IconBarChart size={32} strokeWidth={1.5} />
            </div>
            <h3>Detailed Skin Scores</h3>
            <p>Overall health, texture, hydration, and clarity rated 0-100 with trend tracking over time</p>
            <div className="bento-mini-scores">
              <div className="bento-mini-bar"><span style={{ width: '85%', background: '#22c55e' }} /><label>Overall 85</label></div>
              <div className="bento-mini-bar"><span style={{ width: '72%', background: '#f59e0b' }} /><label>Texture 72</label></div>
              <div className="bento-mini-bar"><span style={{ width: '88%', background: '#3b82f6' }} /><label>Hydration 88</label></div>
            </div>
          </div>
          <div className="bento-card bento-card--concern">
            <div className="bento-card-icon">
              <IconSearch size={28} strokeWidth={1.5} />
            </div>
            <h3>Concern Detection</h3>
            <p>Identifies visible signs of acne, redness, pigmentation, and fine lines</p>
          </div>
          <div className="bento-card bento-card--routine">
            <div className="bento-card-icon">
              <IconSparkles size={28} strokeWidth={1.5} />
            </div>
            <h3>Smart Routines</h3>
            <p>Personalized AM/PM routines with product recommendations</p>
          </div>
          <div className="bento-card bento-card--tracking">
            <div className="bento-card-icon">
              <IconTrendingUp size={28} strokeWidth={1.5} />
            </div>
            <h3>Progress Tracking</h3>
            <p>Compare scans over time and see your skin improve</p>
            <span className="bento-badge-free">Free account</span>
          </div>
        </div>
      </FadeInSection>

      {/* ===================== HOW IT WORKS ===================== */}
      <FadeInSection className="how-it-works-2026">
        <div className="section-header">
          <span className="section-tag">3 Simple Steps</span>
          <h2>How It Works</h2>
          <p>From photo to personalized insights in under a minute</p>
        </div>
        <div className="steps-timeline">
          <div className="step-2026">
            <div className="step-number-2026">1</div>
            <div className="step-connector" aria-hidden="true" />
            <div className="step-content-2026">
              <div className="step-visual-2026">
                <div className="step-icon-box step-icon-box--blue">
                  <IconScan size={36} strokeWidth={1.5} />
                </div>
              </div>
              <h3>Upload Your Photo</h3>
              <p>Take a clear selfie or upload an existing photo</p>
              <div className="step-tips-2026">
                <span><IconCheck size={14} /> Good lighting</span>
                <span><IconCheck size={14} /> No makeup</span>
                <span><IconCheck size={14} /> Front-facing</span>
              </div>
            </div>
          </div>
          <div className="step-2026">
            <div className="step-number-2026">2</div>
            <div className="step-connector" aria-hidden="true" />
            <div className="step-content-2026">
              <div className="step-visual-2026">
                <div className="step-icon-box step-icon-box--purple">
                  <IconZap size={36} strokeWidth={1.5} />
                </div>
              </div>
              <h3>AI Analysis</h3>
              <p>Our model detects visible signs of acne, redness, pigmentation, and texture patterns</p>
            </div>
          </div>
          <div className="step-2026">
            <div className="step-number-2026">3</div>
            <div className="step-content-2026">
              <div className="step-visual-2026">
                <div className="step-icon-box step-icon-box--green">
                  <IconSparkles size={36} strokeWidth={1.5} />
                </div>
              </div>
              <h3>Get Your Report</h3>
              <p>Receive scores, concern breakdowns, and personalized routine suggestions</p>
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* ===================== TESTIMONIALS ===================== */}
      <FadeInSection className="testimonials-section-2026">
        <div className="section-header">
          <span className="section-tag">Real Results</span>
          <h2>What Our Users Say</h2>
          <p>See how people improved their routines with Pellicura</p>
        </div>
        <div className="testimonials-scroll">
          {[
            {
              name: 'Ananya P.',
              initials: 'AP',
              color: '#1f6feb',
              tag: 'Redness control',
              text: '"The weekly scans helped me spot patterns and adjust my routine. In six weeks, my redness score dropped and my skin felt calmer."',
            },
            {
              name: 'James R.',
              initials: 'JR',
              color: '#0f766e',
              tag: 'Texture improvement',
              text: '"I finally understood which products were working. The AI flagged irritation early, and my texture score improved fast."',
            },
            {
              name: 'Sarah K.',
              initials: 'SK',
              color: '#f97316',
              tag: 'Hydration + glow',
              text: '"The routine suggestions were spot on. My hydration went from low to balanced, and the before/after view kept me motivated."',
            },
          ].map((t, i) => (
            <div className="testimonial-card-2026" key={i}>
              <div className="testimonial-top">
                <div className="testimonial-avatar-2026" style={{ background: `${t.color}15`, color: t.color }}>
                  {t.initials}
                </div>
                <div>
                  <h4>{t.name}</h4>
                  <span className="testimonial-tag">{t.tag}</span>
                </div>
              </div>
              <div className="testimonial-stars-2026">
                {Array.from({ length: 5 }).map((_, j) => (
                  <IconStar key={j} size={15} strokeWidth={2} fill="#f59e0b" stroke="#f59e0b" />
                ))}
              </div>
              <p>{t.text}</p>
            </div>
          ))}
        </div>
      </FadeInSection>

      {/* ===================== FAQ ===================== */}
      <FadeInSection className="faq-section-2026">
        <div className="section-header">
          <span className="section-tag">Common Questions</span>
          <h2>Frequently Asked Questions</h2>
        </div>
        <FaqAccordion />
      </FadeInSection>

      {/* ===================== FINAL CTA ===================== */}
      <FadeInSection className="cta-section-2026">
        <div className="cta-inner-2026">
          <h2>Ready to Understand Your Skin?</h2>
          <p>Get instant AI-powered insights from a single photo</p>
          <button type="button" className="cta-btn-2026" onClick={() => navigate('/scan')}>
            <IconScan size={20} strokeWidth={2} />
            Start Free Skin Scan
          </button>
          <span className="cta-reassurance-2026">
            <IconShield size={14} />
            Your photo is processed securely and never shared
          </span>
        </div>
      </FadeInSection>
    </div>
  );
};

export default HomePage;
