// src/pages/HomePage.tsx
import { Link } from "react-router-dom";

function IconSparkles() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path fill="currentColor" d="M12 2l1.2 4.2L17.5 8l-4.3 1.6L12 14l-1.2-4.4L6.5 8l4.3-1.8L12 2zm7 6l.7 2.2L22 11l-2.3.8L19 14l-.7-2.2L16 11l2.3-.8L19 8zM5 12l.9 3.2L9 16l-3.1 1.1L5 20l-.9-2.9L1 16l3.1-.8L5 12z" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path fill="currentColor" d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4zm0 4.2L6 9v3c0 3.7 2.4 6.8 6 7.7 3.6-.9 6-4 6-7.7V9l-6-2.8z" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path fill="currentColor" d="M4 19h16v2H2V3h2v16zm4-8h2v6H8v-6zm4-4h2v10h-2V7zm4 2h2v8h-2V9z" />
    </svg>
  );
}

function IconScan() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path fill="currentColor" d="M4 7V4h3V2H2v5h2zm17-5h-5v2h3v3h2V2zM4 17H2v5h5v-2H4v-3zm18 0h-2v3h-3v2h5v-5zM7 7h10v10H7V7zm2 2v6h6V9H9z" />
    </svg>
  );
}

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string; }) => (
  <div className="feature-card glass tilt">
    <div className="feature-icon">{icon}</div>
    <div className="feature-body">
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{desc}</p>
    </div>
  </div>
);

export default function HomePage() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true"> ✦ </span>
            <span className="brand-name">AuraSkin AI</span>
          </Link>
          <nav className="nav">
            <a className="nav-link" href="#features"> Features </a>
            <a className="nav-link" href="#how"> How it works </a>
            <Link className="btn btn-ghost" to="/scan"> Try scan </Link>
          </nav>
        </div>
      </header>

      <div className="hero-bg">
        <div className="hero-orbs" aria-hidden="true">
          <div className="orb orb-a" />
          <div className="orb orb-b" />
          <div className="orb orb-c" />
          <div className="grid-noise" />
        </div>
        <div className="container hero">
          <div className="hero-left">
            <div className="pill">
              <span className="pill-dot" /> AI Skin Intelligence • Premium Experience
            </div>
            <h1 className="hero-title">
              Your skin,{" "}
              <span className="grad-text">decoded</span> in seconds.
            </h1>
            <p className="hero-subtitle">
              Upload a selfie and get a clean, modern report: skin signals, patterns, and next-step guidance — built for a professional skincare workflow.
            </p>
            <div className="hero-actions">
              <Link to="/scan" className="btn btn-primary btn-xl">
                <span className="btn-glow" aria-hidden="true" />
                Start AI Scan
              </Link>
              <a href="#features" className="btn btn-secondary btn-xl"> Explore features </a>
            </div>
            <div className="trust-row">
              <div className="trust-chip">
                <span className="trust-icon">⚡</span> Fast analysis
              </div>
              <div className="trust-chip">
                <span className="trust-icon">🔒</span> Privacy-first
              </div>
              <div className="trust-chip">
                <span className="trust-icon">✨</span> Premium UI
              </div>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-card glass">
              <div className="hero-card-head">
                <div className="dot dot-red" />
                <div className="dot dot-yellow" />
                <div className="dot dot-green" />
                <span className="hero-card-title">Live Skin Report</span>
              </div>
              <div className="hero-card-body">
                <div className="metric">
                  <span className="metric-label">Hydration</span>
                  <div className="meter">
                    <div className="meter-fill w-72" />
                  </div>
                  <span className="metric-value">72%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Texture</span>
                  <div className="meter">
                    <div className="meter-fill w-58" />
                  </div>
                  <span className="metric-value">58%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Clarity</span>
                  <div className="meter">
                    <div className="meter-fill w-81" />
                  </div>
                  <span className="metric-value">81%</span>
                </div>
                <div className="mini-cards">
                  <div className="mini-card">
                    <div className="mini-title">Detected</div>
                    <div className="mini-value">3 signals</div>
                  </div>
                  <div className="mini-card">
                    <div className="mini-title">Confidence</div>
                    <div className="mini-value">High</div>
                  </div>
                </div>
                <div className="hero-card-cta">
                  <Link to="/scan" className="btn btn-primary btn-full"> Scan now </Link>
                </div>
              </div>
            </div>
            <div className="hero-badge glass">
              <div className="hero-badge-icon" aria-hidden="true">
                <IconScan />
              </div>
              <div>
                <div className="hero-badge-title">Modern scan flow</div>
                <div className="hero-badge-desc">Drag & drop • progress • elegant results</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="features" className="container section">
        <div className="section-head">
          <h2 className="section-title">Premium features built for trust</h2>
          <p className="section-subtitle">
            A polished experience that feels like a production-grade AI skincare product.
          </p>
        </div>
        <div className="features-grid">
          <FeatureCard icon={<IconSparkles />} title="Beautiful analysis reports" desc="Elegant cards, clean typography, and readable insights designed for real users." />
          <FeatureCard icon={<IconShield />} title="Privacy-first by design" desc="Clear states, transparent processing, and simple controls for confidence." />
          <FeatureCard icon={<IconChart />} title="Progress + confidence signals" desc="Professional progress indicators and results presentation with polished motion." />
        </div>
      </section>

      <section id="how" className="container section">
        <div className="how">
          <div className="how-left">
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle">
              Designed for speed and clarity — from upload to results.
            </p>
            <div className="steps">
              <div className="step glass">
                <div className="step-num">01</div>
                <div>
                  <div className="step-title">Upload a clear selfie</div>
                  <div className="step-desc">Drag & drop or browse — built-in preview.</div>
                </div>
              </div>
              <div className="step glass">
                <div className="step-num">02</div>
                <div>
                  <div className="step-title">AI scan session starts</div>
                  <div className="step-desc">We initialize and process with live status updates.</div>
                </div>
              </div>
              <div className="step glass">
                <div className="step-num">03</div>
                <div>
                  <div className="step-title">Review your results</div>
                  <div className="step-desc">Insights displayed in premium, structured cards.</div>
                </div>
              </div>
            </div>
            <div className="how-actions">
              <Link to="/scan" className="btn btn-primary"> Start scan </Link>
              <a href="#features" className="btn btn-ghost"> See features </a>
            </div>
          </div>
          <div className="how-right">
            <div className="showcase glass">
              <div className="showcase-top">
                <div className="showcase-title">Sample insight</div>
                <div className="showcase-chip">AI powered</div>
              </div>
              <div className="showcase-content">
                <div className="insight">
                  <div className="insight-kicker">Hydration</div>
                  <div className="insight-main">Suggest a richer moisturizer + occlusive at night</div>
                </div>
                <div className="insight">
                  <div className="insight-kicker">Texture</div>
                  <div className="insight-main">Add gentle exfoliation 1–2×/week</div>
                </div>
                <div className="insight">
                  <div className="insight-kicker">Barrier</div>
                  <div className="insight-main">Prioritize ceramides + soothing ingredients</div>
                </div>
              </div>
              <div className="showcase-bottom">
                <Link to="/scan" className="btn btn-secondary btn-full"> Try it yourself </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-left">
            <Link to="/" className="brand brand-sm">
              <span className="brand-mark" aria-hidden="true"> ✦ </span>
              <span className="brand-name">AuraSkin AI</span>
            </Link>
            <p className="footer-note">
              Premium UI/UX demo — connect to your backend scan endpoints.
            </p>
          </div>
          <div className="footer-right">
            <Link className="footer-link" to="/scan"> Scan </Link>
            <a className="footer-link" href="#features"> Features </a>
            <a className="footer-link" href="#how"> How it works </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
