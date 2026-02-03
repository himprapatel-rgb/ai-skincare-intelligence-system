/**
 * TODAY tab – Daily hub (Jobs-To-Be-Done: CHECK + ACT).
 * Redesign: time greeting, AI Prediction, score, mini progress, routine, streak, For you.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { getScanHistory } from '../services/scanApi';
import { useShelf } from '../context/ShelfContext';
import { API_BASE_URL } from '../config';
import {
  IconSettings,
  IconSun,
  IconMoon,
  IconStar,
  IconPackage,
  IconArrowRight,
  IconCheck,
} from '../components/Icons';
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

/** Placeholder "For You" picks when no API data; show image + why to improve engagement */
const FOR_YOU_FALLBACK = [
  { id: 'rec-1', name: 'Barrier Repair Moisturizer', match: 92, why: 'Hydration, barrier support' },
  { id: 'rec-2', name: 'Vitamin C Serum', match: 88, why: 'Brightening, dark spots' },
  { id: 'rec-3', name: 'Lightweight SPF 50', match: 85, why: 'Protection, oil-free' },
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
    (async () => {
      try {
        const historyData = await getScanHistory();
        const scans = (historyData as { scans?: Array<Record<string, unknown>> }).scans || [];
        const completed = scans.filter((s) => String(s.status || '') !== 'failed');
        const scores = completed
          .map((s) => {
            const summary = (s.summary || {}) as Record<string, unknown>;
            const n = typeof summary.overall_score === 'number' ? Math.round(summary.overall_score) : null;
            return n ?? null;
          })
          .filter((n): n is number => typeof n === 'number' && !Number.isNaN(n));
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const trend: TodayData['skinTrend'] = avgScore >= 70 ? 'improving' : avgScore >= 40 ? 'stable' : 'declining';
        if (!cancelled) {
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
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, user]);

  useEffect(() => {
    setStreak(getStreak());
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const token = localStorage.getItem('auth_token');
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
    <div className="today-page app-page">
      <header className="today-header">
        <h1 className="today-greeting">{timeGreeting}, {firstName}</h1>
        <div className="today-header-actions">
          <NotificationBell />
          <Link to="/profile?tab=settings" className="today-settings-btn" aria-label="Settings">
            <IconSettings size={22} strokeWidth={2} />
          </Link>
        </div>
      </header>

      <div className="today-content">
        {/* AI Prediction card – surface "See Your Skin's Future" */}
        {!loading && data != null && currentScore > 0 && (
          <section className="today-card today-card-prediction">
            <h2 className="today-prediction-title">🔮 Your skin&apos;s future</h2>
            <p className="today-prediction-statement">
              In 30 days: <strong>{predictedScore}</strong> {predictedDelta > 0 && <span className="today-prediction-delta">(+{predictedDelta} pts)</span>}
            </p>
            <p className="today-prediction-tip">&ldquo;{predictionTip}&rdquo;</p>
            <Link to="/digital-twin" className="today-prediction-link">
              See full prediction <IconArrowRight size={18} strokeWidth={2} />
            </Link>
          </section>
        )}

        <section className="today-card today-card-skin today-card-skin-glow">
          <h2 className="today-card-title">Your skin today</h2>
          {loading || data === null ? (
            <div className="today-skin-skeleton">
              <div className="today-skin-score-box">—</div>
              <div className="today-skin-meta">Loading…</div>
            </div>
          ) : (
            <>
              <div className="today-skin-score-box">
                <div className="today-skin-ring-wrap" aria-hidden>
                  <svg className="today-skin-ring" viewBox="0 0 100 100">
                    <circle className="today-skin-ring-bg" cx="50" cy="50" r="42" fill="none" strokeWidth="8" />
                    <circle
                      className="today-skin-ring-fill"
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(data.skinScore / 100) * 264} 264`}
                    />
                  </svg>
                  <span className="today-skin-score today-skin-score-inner">{data.skinScore}</span>
                </div>
                <span className="today-skin-trend">
                  {data.skinTrend === 'improving' && <>↑ Improving</>}
                  {data.skinTrend === 'stable' && <>→ Stable</>}
                  {data.skinTrend === 'declining' && <>↓ Needs attention</>}
                </span>
                <span className="today-skin-label">Score</span>
              </div>
              <p className="today-skin-meta">
                {data.scanCount} scan{data.scanCount !== 1 ? 's' : ''} • Based on your latest analysis
              </p>
              {showTwinIntro && (
                <div className="today-twin-intro" role="region" aria-label="New feature">
                  <p className="today-twin-intro-text">Track your skin over time with your Digital Twin — timeline, before/after, and What-If simulation.</p>
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
                <span className="today-twin-badge">Timeline</span>
                View full analysis & Digital Twin <IconArrowRight size={18} strokeWidth={2} />
              </Link>
            </>
          )}
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
              View before/after & timeline <IconArrowRight size={18} strokeWidth={2} />
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
              <IconSun size={18} strokeWidth={2} />
              Morning
            </button>
            <button
              type="button"
              className={`today-routine-tab ${routineType === 'evening' ? 'active' : ''}`}
              onClick={() => setRoutineType('evening')}
              aria-pressed={routineType === 'evening'}
            >
              <IconMoon size={18} strokeWidth={2} />
              Evening
            </button>
          </div>
          <div className="today-card-head">
            <span className="today-routine-icon">{routineType === 'morning' ? <IconSun size={20} strokeWidth={2} /> : <IconMoon size={20} strokeWidth={2} />}</span>
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
                    {completedSteps.has(index) ? <IconCheck size={18} strokeWidth={2.5} /> : null}
                  </span>
                  <span className="today-routine-step-label">{label}</span>
                </button>
              </li>
            ))}
          </ul>
          <Link to="/routine-builder" className="today-card-link">
            Edit routine <IconArrowRight size={18} strokeWidth={2} />
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

        <section className="today-card today-card-foryou">
          <div className="today-card-head">
            <span className="today-foryou-icon"><IconStar size={20} strokeWidth={2} /></span>
            <h2 className="today-card-title">For you</h2>
            <Link to="/recommendations" className="today-see-all">See all →</Link>
          </div>
          <div className="today-foryou-tiles">
            {FOR_YOU_FALLBACK.map((item) => (
              <button
                key={item.id}
                type="button"
                className="today-foryou-tile"
                onClick={() => navigate('/recommendations')}
              >
                <div className="today-foryou-thumb" aria-hidden />
                <span className="today-foryou-pct">{item.match}%</span>
                <span className="today-foryou-name">{item.name}</span>
                <span className="today-foryou-why">Addresses: {item.why}</span>
              </button>
            ))}
          </div>
          <p className="today-foryou-hint">Personalized picks based on your skin profile</p>
        </section>

        {shelfCount === 0 && (
          <section className="today-card today-card-cta">
            <IconPackage size={32} strokeWidth={2} className="today-cta-icon" />
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
