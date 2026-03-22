/**
 * TODAY tab – Home Dashboard (Mobile Design System).
 * Sections: Your Skin Today, Your Top Concerns, AI Ingredient Match, Top Pick For You.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { getScanHistory } from '../services/scanApi';
import { useShelf } from '../context/ShelfContext';
import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';
import { IconSettings } from '../components/Icons';
import { Illustrations } from '../components/Illustrations';
import LazyImage from '../components/LazyImage';
import NotificationBell from '../components/notifications/NotificationBell';
import { getStreak, checkInToday, hasCheckedInToday } from '../utils/streakStorage';
import {
  getRoutineSteps,
  getCompletedStepsForToday,
  toggleStepForToday,
  type RoutineType,
} from '../utils/routineStorage';
import './TodayPage.css';

/** Time-of-day greeting: "Good morning" / "Good afternoon" / "Good evening" */
function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

interface TodayData {
  skinScore: number;
  skinTrend: 'improving' | 'stable' | 'declining';
  scanCount: number;
  routineProgress: number;
  routineTotal: number;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function formatLastScan(isoDate: string | null): string {
  if (!isoDate) return 'No scans yet';
  const d = new Date(isoDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const scanDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - scanDay.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

/** Top concerns for dashboard (from analysis or fallback) – level: HIGH/MED/LOW */
const TOP_CONCERNS_FALLBACK: { name: string; level: 'HIGH' | 'MED' | 'LOW' }[] = [
  { name: 'Dark Circles', level: 'HIGH' },
  { name: 'Dehydration', level: 'MED' },
  { name: 'Uneven Texture', level: 'LOW' },
  { name: 'Fine Lines', level: 'LOW' },
];

/** AI ingredient recommendations (ingredient-focused design) */
const AI_INGREDIENT_MATCH: { ingredient: string; emoji: string; forConcern: string }[] = [
  { ingredient: 'Hyaluronic Acid', emoji: '💧', forConcern: 'Dehydration' },
  { ingredient: 'Vitamin C', emoji: '🍊', forConcern: 'Dark Circles' },
  { ingredient: 'Caffeine', emoji: '☕', forConcern: 'Dark Circles' },
];

/** At least 3 recommended products for home page (Amazon affiliate placeholders) */
const RECOMMENDED_PRODUCTS = [
  {
    id: 'rec-1',
    name: 'Caffeine Solution 5% + EGCG',
    brand: 'The Ordinary',
    matchPct: 98,
    rating: 4.4,
    price: '€6.80',
    imageUrl: null as string | null,
    buyUrl: 'https://www.amazon.co.uk/dp/B07PQ43WR2',
  },
  {
    id: 'rec-2',
    name: 'Hyaluronic Acid 2% + B5',
    brand: 'The Ordinary',
    matchPct: 95,
    rating: 4.5,
    price: '€7.90',
    imageUrl: null as string | null,
    buyUrl: 'https://www.amazon.co.uk/dp/B01M0AE5OV',
  },
  {
    id: 'rec-3',
    name: 'Eye Repair Cream',
    brand: 'CeraVe',
    matchPct: 92,
    rating: 4.6,
    price: '€14.50',
    imageUrl: null as string | null,
    buyUrl: 'https://www.amazon.co.uk/dp/B07D5NPCYD',
  },
];

const TodayPage: React.FC = () => {
  usePageTitle('Today', 'Your skin today – score, routine, and recommendations.');
  const { user, isAuthenticated } = useAuth();
  const { totalCount: shelfCount } = useShelf();
  const navigate = useNavigate();
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [routineType, setRoutineType] = useState<RoutineType>('morning');
  const morningSteps = getRoutineSteps('morning');
  const eveningSteps = getRoutineSteps('evening');
  const routineSteps = routineType === 'evening' ? eveningSteps : morningSteps;
  const [completedMorning, setCompletedMorning] = useState<Set<number>>(() => getCompletedStepsForToday('morning'));
  const [completedEvening, setCompletedEvening] = useState<Set<number>>(() => getCompletedStepsForToday('evening'));
  const completedSteps = routineType === 'evening' ? completedEvening : completedMorning;
  const [showTwinIntro, setShowTwinIntro] = useState(() => {
    try {
      return !localStorage.getItem('pellicura_digital_twin_intro_seen');
    } catch {
      return false;
    }
  });
  const [twinSnapshotCount, setTwinSnapshotCount] = useState<number | null>(null);
  const [twinFirstScore, setTwinFirstScore] = useState<number | null>(null);
  const [lastScanDate, setLastScanDate] = useState<string | null>(null);
  const [gaugeScore, setGaugeScore] = useState(0);
  const [, setRefreshTrigger] = useState(0);

  const refreshToday = useCallback(() => {
    setLoading(true);
    setRefreshTrigger((t) => t + 1);
  }, []);
  const { pullProps } = usePullToRefresh(refreshToday, { enabled: !!isAuthenticated });

  const dismissTwinIntro = () => {
    try {
      localStorage.setItem('pellicura_digital_twin_intro_seen', '1');
    } catch {
      /* ignore */
    }
    setShowTwinIntro(false);
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      setData(null);
      return;
    }
    let cancelled = false;
    
    // Defer data fetch until after first paint (performance: reduce mobile lag)
    const loadData = async () => {
      try {
        const historyData = await getScanHistory();
        const scans = (historyData as { scans?: Array<Record<string, unknown>> }).scans || [];
        const statusStr = (s: Record<string, unknown>) => String(s.status ?? '').toLowerCase();
        const completed = scans.filter((s) => statusStr(s) === 'completed');
        const scores = completed
          .map((s) => {
            const summary = (s.summary || {}) as Record<string, unknown>;
            const raw = summary.overall_score;
            const n = typeof raw === 'number' && !Number.isNaN(raw) ? Math.round(Number(raw)) : null;
            return n;
          })
          .filter((n): n is number => typeof n === 'number');
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const trend: TodayData['skinTrend'] = avgScore >= 70 ? 'improving' : avgScore >= 40 ? 'stable' : 'declining';
        const lastCompleted = completed[0];
        const lastDate = lastCompleted?.created_at != null ? String(lastCompleted.created_at) : null;
        if (!cancelled) {
          setLastScanDate(lastDate);
          setData({
            skinScore: avgScore,
            skinTrend: trend,
            scanCount: scans.length,
            routineProgress: 0,
            routineTotal: 5,
          });
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    // Use requestIdleCallback to defer until after first paint
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => loadData());
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const id = window.setTimeout(() => loadData(), 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    setStreak(getStreak());
  }, []);

  useEffect(() => {
    if (data?.skinScore == null) return;
    const timer = requestAnimationFrame(() => {
      setGaugeScore(data!.skinScore);
    });
    return () => cancelAnimationFrame(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to skinScore
  }, [data?.skinScore]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    fetch(`${API_BASE_URL}/digital-twin/query?limit=200`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed'))))
      .then((data: { snapshots?: Array<{ meta?: { overall_score?: number } }> }) => {
        if (cancelled) return;
        const list = data.snapshots || [];
        setTwinSnapshotCount(list.length);
        const first = list[list.length - 1];
        if (first?.meta?.overall_score != null) {
          setTwinFirstScore(Math.round(Number(first.meta.overall_score)));
        }
      })
      .catch(() => {
        if (!cancelled) setTwinSnapshotCount(0);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const handleRoutineStepToggle = (index: number) => {
    const next = toggleStepForToday(index, routineType);
    if (routineType === 'morning') {
      setCompletedMorning(next);
      if (next.size === morningSteps.length && !hasCheckedInToday()) {
        checkInToday();
        setStreak(getStreak());
      }
    } else {
      setCompletedEvening(next);
    }
  };

  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const timeGreeting = getTimeGreeting();
  const routineDone = completedSteps.size;
  const routineTotal = routineSteps.length;
  const isStreakMilestone = streak >= 3;
  const currentScore = data?.skinScore ?? 0;
  const trend = data?.skinTrend ?? 'stable';
  const predictedDelta = trend === 'improving' ? 13 : trend === 'stable' ? 5 : 0;
  const predictedScore = Math.min(99, Math.max(1, currentScore + predictedDelta));
  const predictionTip = trend === 'improving'
    ? 'Keep your routine consistent. Your skin is on the right track.'
    : trend === 'stable'
      ? 'Small steps add up. Try adding one targeted product.'
      : 'Focus on basics: cleanse, moisturize, SPF. You\'ve got this.';

  if (!isAuthenticated) {
    return (
      <div className="today-page app-page">
        <header className="today-header">
          <h1 className="today-greeting">Your skin today</h1>
        </header>
        <div className="today-content">
          <div className="today-card today-card-welcome">
            <p className="today-welcome-text">
              Sign in to see your skin score, routine, and personalized recommendations.
            </p>
            <div className="today-cta-row">
              <button type="button" className="btn btn-primary" onClick={() => navigate('/auth')}>
                Sign in
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/scan')}>
                Try a free scan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="today-page app-page" {...pullProps}>
      <section className="today-header" aria-label="Today greeting and actions">
        <h1 className="today-greeting">{timeGreeting}, {firstName}</h1>
        <div className="today-header-actions">
          <span className="today-region-pill" title="Amazon prices for your region">🇮🇪</span>
          <NotificationBell />
          <Link to="/profile?tab=settings" className="today-settings-btn" aria-label="Settings">
            <IconSettings size={22} strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </section>

      <div className="today-content">
        {/* AI Prediction card – surface "See Your Skin's Future" */}
        {!loading && data != null && currentScore > 0 && (
          <section className="today-card today-card-prediction today-card-wide">
            <h2 className="today-prediction-title">🔮 Your skin&apos;s future</h2>
            <p className="today-prediction-statement">
              In 30 days: <strong>{predictedScore}</strong> {predictedDelta > 0 && <span className="today-prediction-delta">(+{predictedDelta} pts)</span>}
            </p>
            <p className="today-prediction-tip">&ldquo;{predictionTip}&rdquo;</p>
            <Link to="/digital-twin" className="today-prediction-link">
              See full prediction <Illustrations.ArrowRight className="today-ill today-ill-arrow" />
            </Link>
          </section>
        )}

        {/* 🧬 YOUR SKIN TODAY – compact score + actions */}
        <section className="today-card today-card-skin today-card-skin-glow today-card-skin-compact today-card-wide">
          <div className="today-card-title-row">
            <Illustrations.SkinToday className="today-ill today-ill-section" />
            <h2 className="today-card-title today-card-title-caps">Your skin today</h2>
          </div>
          {loading || data === null ? (
            <div className="today-skin-skeleton">
              <div className="today-skin-score-box">—</div>
              <div className="today-skin-meta">Loading…</div>
            </div>
          ) : (
            <>
              <div className="today-skin-compact-row">
                <div className="today-skin-gauge-wrap" aria-hidden>
                  <svg className="today-skin-gauge" viewBox="0 0 100 100" role="img" aria-label={`Skin score ${data.skinScore} out of 100`}>
                    <defs>
                      <linearGradient id="today-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary)" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                    <circle className="today-skin-gauge-bg" cx="50" cy="50" r="42" fill="none" strokeWidth="8" />
                    <circle
                      className="today-skin-gauge-fill"
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (264 * gaugeScore) / 100}
                    />
                  </svg>
                  <span className="today-skin-gauge-value">{data.skinScore}</span>
                  <span className="today-skin-gauge-label">Score</span>
                </div>
                <div className="today-skin-trend-block">
                  <span className="today-skin-trend today-skin-trend-inline">
                    {data.skinTrend === 'improving' && <>→ Improving</>}
                    {data.skinTrend === 'stable' && <>→ Stable</>}
                    {data.skinTrend === 'declining' && <>→ Needs attention</>}
                  </span>
                </div>
              </div>
              <p className="today-skin-meta">
                {data.scanCount} scan{data.scanCount !== 1 ? 's' : ''} · Last: {formatLastScan(lastScanDate)}
              </p>
              <div className="today-skin-actions">
                <Link to="/scan" className="btn btn-primary today-skin-btn">
                  <Illustrations.ScanCamera className="today-ill today-ill-btn" />
                  New Scan
                </Link>
                <Link to="/history" className="btn btn-secondary today-skin-btn">
                  <Illustrations.HistoryChart className="today-ill today-ill-btn" />
                  History
                </Link>
              </div>
              {showTwinIntro && (
                <div className="today-twin-intro" role="region" aria-label="New feature">
                  <p className="today-twin-intro-text">Track your skin over time with your Digital Twin.</p>
                  <div className="today-twin-intro-actions">
                    <Link to="/digital-twin" className="btn btn-primary btn-sm" onClick={dismissTwinIntro}>
                      Explore Digital Twin
                    </Link>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={dismissTwinIntro} aria-label="Dismiss">
                      Not now
                    </button>
                  </div>
                </div>
              )}
              <Link to="/digital-twin" className="today-card-link today-card-link-twin">
                View full analysis & timeline <Illustrations.ArrowRight className="today-ill today-ill-arrow" />
              </Link>
            </>
          )}
        </section>

        {/* 🎯 YOUR TOP CONCERNS – 2x2 grid */}
        <section className="today-card today-card-concerns">
          <h2 className="today-card-title today-card-title-caps">🎯 Your top concerns</h2>
          <div className="today-concerns-grid">
            {TOP_CONCERNS_FALLBACK.map((c) => (
              <div key={c.name} className={`today-concern-cell today-concern-${c.level.toLowerCase()}`}>
                <span className="today-concern-badge">
                  {c.level === 'HIGH' && '🔴 HIGH'}
                  {c.level === 'MED' && '🟠 MED'}
                  {c.level === 'LOW' && '🟡 LOW'}
                </span>
                <span className="today-concern-name">{c.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 🧪 AI INGREDIENT MATCH */}
        <section className="today-card today-card-ingredients">
          <div className="today-card-title-row">
            <Illustrations.Ingredients className="today-ill today-ill-section" />
            <h2 className="today-card-title today-card-title-caps">AI ingredient match</h2>
          </div>
          <p className="today-ingredients-intro">Based on your concerns, we recommend products with:</p>
          <ul className="today-ingredients-list">
            {AI_INGREDIENT_MATCH.map((item) => (
              <li key={item.ingredient} className="today-ingredient-item">
                <span className="today-ingredient-emoji" aria-hidden>{item.emoji}</span>
                <div className="today-ingredient-text">
                  <strong>{item.ingredient}</strong>
                  <span className="today-ingredient-for">For: {item.forConcern}</span>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/recommendations" className="btn btn-primary today-ingredients-cta">
            <Illustrations.Cart className="today-ill today-ill-btn" />
            Find matching products
          </Link>
        </section>

        {/* Mini Before/After – Your progress */}
        {(twinSnapshotCount != null && twinSnapshotCount > 0) && data != null && (
          <section className="today-card today-card-progress">
            <h2 className="today-card-title">📸 Your progress</h2>
            <div className="today-progress-mini">
              <div className="today-progress-thumb">
                <span className="today-progress-label">Day 1</span>
                <span className="today-progress-score">{twinFirstScore ?? '—'}</span>
              </div>
              <span className="today-progress-arrow">→</span>
              <div className="today-progress-thumb">
                <span className="today-progress-label">Today</span>
                <span className="today-progress-score">{data.skinScore}</span>
              </div>
            </div>
            <p className="today-progress-meta">
              {twinSnapshotCount} snapshot{twinSnapshotCount !== 1 ? 's' : ''}
              {twinFirstScore != null && (
                <> · {data.skinScore - twinFirstScore >= 0 ? '+' : ''}{data.skinScore - twinFirstScore} points</>
              )}
            </p>
            <Link to="/digital-twin" className="today-card-link">
              View before/after & timeline <Illustrations.ArrowRight className="today-ill today-ill-arrow" />
            </Link>
          </section>
        )}

        <section className="today-card today-card-routine">
          <div className="today-routine-tabs">
            <button
              type="button"
              className={`today-routine-tab ${routineType === 'morning' ? 'active' : ''}`}
              onClick={() => setRoutineType('morning')}
              aria-pressed={routineType === 'morning'}
            >
              <Illustrations.RoutineSun className="today-ill today-ill-tab" />
              Morning
            </button>
            <button
              type="button"
              className={`today-routine-tab ${routineType === 'evening' ? 'active' : ''}`}
              onClick={() => setRoutineType('evening')}
              aria-pressed={routineType === 'evening'}
            >
              <Illustrations.RoutineMoon className="today-ill today-ill-tab" />
              Evening
            </button>
          </div>
          <div className="today-card-head">
            <span className="today-routine-icon">
              {routineType === 'morning' ? <Illustrations.RoutineSun className="today-ill today-ill-head" /> : <Illustrations.RoutineMoon className="today-ill today-ill-head" />}
            </span>
            <h2 className="today-card-title">{routineType === 'morning' ? 'Morning' : 'Evening'} routine</h2>
            <span className="today-routine-count">
              {routineDone}/{routineTotal} done
            </span>
          </div>
          <div className="today-routine-bar">
            <div
              className="today-routine-bar-fill"
              style={{ width: `${(routineTotal ? (routineDone / routineTotal) * 100 : 0)}%` }}
            />
          </div>
          <ul className="today-routine-steps">
            {routineSteps.map((label, index) => (
              <li key={index}>
                <button
                  type="button"
                  className={`today-routine-step ${completedSteps.has(index) ? 'done' : ''}`}
                  onClick={() => handleRoutineStepToggle(index)}
                  aria-pressed={completedSteps.has(index)}
                >
                  <span className="today-routine-step-check">
                    {completedSteps.has(index) ? <Illustrations.Check className="today-ill today-ill-check" /> : null}
                  </span>
                  <span className="today-routine-step-label">{label}</span>
                </button>
              </li>
            ))}
          </ul>
          <Link to="/routine-builder" className="today-card-link">
            Edit routine <Illustrations.ArrowRight className="today-ill today-ill-arrow" />
          </Link>
        </section>

        {streak > 0 && (
          <section className={`today-card today-card-streak ${isStreakMilestone ? 'today-streak-milestone' : ''}`}>
            <div className="today-streak-header">
              <span className="today-streak-emoji" aria-hidden>🔥</span>
              <span className="today-streak-title">
                {streak}-Day Streak!
              </span>
            </div>
            {isStreakMilestone && (
              <p className="today-streak-celebration">
                {streak >= 7 ? 'Amazing! Week streak! 🎉' : 'Streak milestone! Keep it up!'}
              </p>
            )}
            <div className="today-streak-week" aria-hidden>
              {WEEKDAY_LABELS.map((label, i) => (
                <span key={i} className="today-streak-day">{label}</span>
              ))}
            </div>
            <p className="today-streak-hint">Complete your routine today to keep it going</p>
          </section>
        )}

        {/* Recommended for you – product cards */}
        <section className="today-card today-card-toppick today-card-wide" aria-labelledby="today-recommended-head">
          <div className="today-card-head">
            <span className="today-foryou-icon" aria-hidden="true">
              <Illustrations.Recommended className="today-ill today-ill-section" />
            </span>
            <h2 id="today-recommended-head" className="today-card-title today-card-title-caps">
              Recommended for you
            </h2>
            <Link to="/recommendations" className="today-see-all">
              See all →
            </Link>
          </div>
          <div className="today-products-grid" role="list">
            {RECOMMENDED_PRODUCTS.map((product) => (
              <article key={product.id} className="today-product-card" role="listitem">
                <div className="today-product-card-image">
                  {product.imageUrl ? (
                    <LazyImage
                      src={product.imageUrl}
                      alt={`${product.name} by ${product.brand}`}
                      width="100%"
                      height="100%"
                      objectFit="contain"
                    />
                  ) : (
                    <span className="today-product-card-placeholder" aria-hidden="true">
                      {product.brand}
                    </span>
                  )}
                </div>
                <div className="today-product-card-info">
                  <p className="today-product-card-brand">{product.brand}</p>
                  <h3 className="today-product-card-name">{product.name}</h3>
                  <div className="today-product-card-match">
                    <span className="today-product-card-match-pct">{product.matchPct}% match</span>
                    <div className="today-product-card-bar" role="presentation" aria-hidden="true">
                      <div className="today-product-card-bar-fill" style={{ width: `${product.matchPct}%` }} />
                    </div>
                  </div>
                  <p className="today-product-card-meta">
                    ⭐ {product.rating} · <span className="today-product-card-price">{product.price}</span>
                  </p>
                  <a
                    href={product.buyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary today-product-card-buy"
                    title={`View ${product.name} on retailer`}
                  >
                    <Illustrations.Cart className="today-ill today-ill-btn" aria-hidden="true" />
                    <span className="today-product-card-buy-text">View</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {shelfCount === 0 && (
          <section className="today-card today-card-cta today-card-wide">
            <Illustrations.Package className="today-cta-ill" />
            <p>Add products to your shelf to get better recommendations.</p>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/scan?mode=product')}>
              Scan a product
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

export default TodayPage;
