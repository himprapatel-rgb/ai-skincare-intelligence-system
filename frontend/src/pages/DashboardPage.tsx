import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShelf } from '../context/ShelfContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { getScanHistory } from '../services/scanApi';
import { api } from '../services/api';
import { 
  IconTrendingUp, 
  IconCamera, 
  IconPackage, 
  IconSparkles,
  IconScan,
  IconCalendar,
  IconStar,
  IconTrendingDown,
  IconArrowRight,
  IconBell,
  IconRefresh
} from '../components/Icons';
import { EmptyState } from '../components/EmptyState';
import { ScanStreak } from '../components/ScanStreak';
import { SkeletonStat, SkeletonHeading, SkeletonText, SkeletonCard } from '../components/Skeleton';
import './DashboardPage.css';

interface DashboardData {
  recentScans: number;
  skinScore: number;
  productsInShelf: number;
  activeRoutines: number;
  nextScanDue: string;
  recentActivity: Array<{
    id: string;
    type: 'scan' | 'product' | 'routine';
    title: string;
    date: string;
  }>;
  skinTrend: 'improving' | 'stable' | 'declining';
}

const SCAN_REMINDER_KEY = 'scan_reminder';
const ONBOARDING_GOALS_KEY = 'onboarding_goals';
const RECENTLY_VIEWED_KEY = 'recently_viewed_products';
const ONBOARDING_PROGRESS_KEY = 'onboarding_progress';

type ScanReminder = { date?: string; frequency?: 'weekly' | 'biweekly' | 'monthly' };

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const DashboardPage: React.FC = () => {
  usePageTitle('Dashboard', 'Your skincare dashboard: recent scans, skin score, shelf, and quick actions.');
  const { user } = useAuth();
  const { totalCount: shelfProductCount } = useShelf();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanDates, setScanDates] = useState<string[]>([]);
  const [prediction, setPrediction] = useState<{ projected_score?: number; improvements?: string[]; summary?: string } | null>(null);
  const [routineAdherence, setRoutineAdherence] = useState<{ completion_rate: number; current_streak: number; this_week: Array<{ day: string; completed: boolean }> } | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<{ scans_this_week: number; score_trend: string; routine_adherence_pct: number; insight: string; active_goals: number } | null>(null);
  const [scanReminder, setScanReminder] = useState<ScanReminder>(() => {
    try {
      const raw = localStorage.getItem(SCAN_REMINDER_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [onboardingGoals] = useState<{ goals: string[]; concerns: string[]; skinType: string } | null>(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_GOALS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [onboardingProgress] = useState<{ step: number } | null>(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_PROGRESS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [recentlyViewed] = useState<{ id: string; name: string; brand: string }[]>(() => {
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setData(null);
      return;
    }
    fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Update shelf count when it changes (from ShelfContext)
  useEffect(() => {
    if (data) {
      setData(prev => prev ? { ...prev, productsInShelf: shelfProductCount } : prev);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to shelf count
  }, [shelfProductCount]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const historyData = await getScanHistory();
      const scans = (historyData as Record<string, unknown>).data as Array<Record<string, unknown>> || (historyData as Record<string, unknown>).scans as Array<Record<string, unknown>> || [];
      const completedScans = scans.filter((scan) => String(scan.status || '') !== 'failed');
      const scores = completedScans
        .map((scan) => {
          const summary = (scan.summary || {}) as Record<string, unknown>;
          const overallScore = typeof summary.overall_score === 'number'
            ? Math.round(summary.overall_score)
            : null;
          return overallScore ?? null;
        })
        .filter((score): score is number => typeof score === 'number' && !Number.isNaN(score));
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;

      const sortedScans = scans
        .filter((scan) => typeof scan.created_at === 'string')
        .sort((a, b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime());
      const latestScanDate = sortedScans.length > 0 ? new Date(String(sortedScans[0].created_at)) : null;
      const nextScanDue = new Date(latestScanDate || new Date());
      nextScanDue.setDate(nextScanDue.getDate() + 14);

      const recentActivity = sortedScans.slice(0, 3).map((scan, index) => ({
        id: String(scan.scan_id || index),
        type: 'scan' as const,
        title: 'Completed skin scan',
        date: String(scan.created_at || new Date().toISOString()),
      }));

      // Collect scan dates for streak tracking
      const dates = sortedScans
        .map(s => String(s.created_at || ''))
        .filter(d => d.length > 0);
      setScanDates(dates);

      const dashboardData: DashboardData = {
        recentScans: scans.length,
        skinScore: avgScore,
        productsInShelf: shelfProductCount,
        activeRoutines: 0,
        nextScanDue: nextScanDue.toISOString(),
        recentActivity,
        skinTrend: avgScore >= 70 ? 'improving' : avgScore >= 40 ? 'stable' : 'declining',
      };
      setData(dashboardData);

      // Single aggregated call for dashboard widgets (replaces 4 separate calls)
      api.get('/api/v1/reports/dashboard-aggregate').then(res => {
        const d = res.data;
        if (d.weekly_summary) setWeeklySummary({ ...d.weekly_summary, score_trend: 'stable', insight: '' });
        if (d.adherence) setRoutineAdherence(d.adherence);
        if (typeof d.active_routines === 'number') {
          setData(prev => prev ? { ...prev, activeRoutines: d.active_routines } : prev);
        }
      }).catch(() => {});

      // AI prediction is slow (OpenAI call) — keep separate and non-blocking
      api.post('/api/v1/ai/predict', {}).then(res => {
        setPrediction(res.data);
      }).catch(() => {});

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setData({
        recentScans: 0,
        skinScore: 0,
        productsInShelf: shelfProductCount,
        activeRoutines: 0,
        nextScanDue: new Date().toISOString(),
        recentActivity: [],
        skinTrend: 'stable',
      });
    } finally {
      setLoading(false);
    }
  };

  const displayNextScan = ((): string => {
    if (scanReminder.date) return scanReminder.date;
    const lastScanDate = data?.recentActivity?.[0]?.date;
    if (scanReminder.frequency && lastScanDate) {
      const d = new Date(lastScanDate);
      if (scanReminder.frequency === 'weekly') d.setDate(d.getDate() + 7);
      else if (scanReminder.frequency === 'biweekly') d.setDate(d.getDate() + 14);
      else if (scanReminder.frequency === 'monthly') d.setDate(d.getDate() + 30);
      return d.toISOString().slice(0, 10);
    }
    return data?.nextScanDue ? new Date(data.nextScanDue).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  })();

  const saveScanReminder = (next: ScanReminder) => {
    setScanReminder(next);
    try {
      localStorage.setItem(SCAN_REMINDER_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const nextSteps = (() => {
    const steps: { label: string; href: string; icon: React.ReactNode; priority: number }[] = [];
    if (!data) return steps;
    if (data.recentScans === 0) steps.push({ label: 'Take your first scan', href: '/scan', icon: <IconScan size={20} strokeWidth={2} />, priority: 1 });
    else steps.push({ label: 'Take a new scan', href: '/scan', icon: <IconScan size={20} strokeWidth={2} />, priority: 2 });
    steps.push({ label: 'View recommendations', href: '/recommendations', icon: <IconStar size={20} strokeWidth={2} />, priority: 3 });
    steps.push({ label: 'Build your routine', href: '/routine-builder', icon: <IconCalendar size={20} strokeWidth={2} />, priority: 4 });
    if (data.productsInShelf === 0) steps.push({ label: 'Add products to your shelf', href: '/scanner', icon: <IconPackage size={20} strokeWidth={2} />, priority: 5 });
    return steps.sort((a, b) => a.priority - b.priority).slice(0, 4);
  })();

  if (!user) {
    return (
      <div className="dashboard-page app-page clinical-page dashboard-page--guest">
        <header className="app-header-card dashboard-hero">
          <h1>Your Dashboard</h1>
          <p className="app-header-subtitle">Track your skin observations and routine adherence in one place</p>
        </header>
        <div className="app-page-content dashboard-guest-content">
          <EmptyState
            icon={<IconCamera size={48} strokeWidth={2} />}
            title="Sign in to see your dashboard"
            description="View your skin score, scan history, shelf, and personalized next steps."
          />
          <div className="dashboard-guest-preview">
            <p className="dashboard-guest-preview-title">What you&apos;ll get</p>
            <ul>
              <li>Skin health score and trend over time</li>
              <li>Scan history and before/after comparison</li>
              <li>My Shelf and personalized recommendations</li>
              <li>Routine builder and reminders</li>
            </ul>
          </div>
          <div className="dashboard-guest-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate('/auth')}>
              Sign In
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/auth?mode=register')}>
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="dashboard-page app-page clinical-page dashboard-page--skeleton">
        <div className="dashboard-header" style={{ marginBottom: 32 }}>
          <SkeletonHeading style={{ width: 280, margin: '0 auto 8px', height: 32 }} />
          <SkeletonText style={{ width: 200, margin: '0 auto' }} />
        </div>
        <div className="dashboard-stats" style={{ marginBottom: 48 }}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
        <div className="dashboard-content">
          <div className="dashboard-section">
            <SkeletonHeading style={{ width: '60%', marginBottom: 24 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} hasImage={false} style={{ minHeight: 100 }} />
              ))}
            </div>
          </div>
          <div className="dashboard-section">
            <SkeletonHeading style={{ width: '50%', marginBottom: 24 }} />
            <SkeletonText lines={4} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page app-page clinical-page">
      <header className="app-header-card dashboard-hero dashboard-hero-with-refresh">
        <div className="dashboard-hero-text">
          <h1>{getGreeting()}, {user?.full_name || 'User'}!</h1>
          <p className="app-header-subtitle">Here is your current skin-care overview</p>
        </div>
        <button
          type="button"
          className="dashboard-refresh-btn"
          onClick={() => fetchDashboardData()}
          disabled={loading}
          aria-label="Refresh dashboard"
          title="Refresh"
        >
          <IconRefresh size={20} strokeWidth={2} className={loading ? 'spin' : ''} />
        </button>
      </header>

      <div className="app-page-content">
      {data.recentScans === 0 && (
        <div className="dashboard-empty-wrapper">
          <div className="preview-dashboard blurred" aria-hidden="true">
            <div className="dashboard-stats preview-stats">
              <div className="stat-card primary"><div className="stat-icon"><IconTrendingUp size={32} strokeWidth={2} /></div><div className="stat-content"><h3>—</h3><p>Skin Health Score</p></div></div>
              <div className="stat-card"><div className="stat-icon"><IconCamera size={32} strokeWidth={2} /></div><div className="stat-content"><h3>0</h3><p>Total Scans</p></div></div>
              <div className="stat-card"><div className="stat-icon"><IconPackage size={32} strokeWidth={2} /></div><div className="stat-content"><h3>0</h3><p>My Products</p></div></div>
              <div className="stat-card"><div className="stat-icon"><IconSparkles size={32} strokeWidth={2} /></div><div className="stat-content"><h3>0</h3><p>Active Routines</p></div></div>
            </div>
            <div className="preview-list">
              <div className="app-list-item"><span className="app-list-icon blue"><IconScan size={20} strokeWidth={2} /></span><span className="app-list-label">New Scan</span></div>
              <div className="app-list-item"><span className="app-list-icon purple"><IconPackage size={20} strokeWidth={2} /></span><span className="app-list-label">My Shelf</span></div>
              <div className="app-list-item"><span className="app-list-icon green"><IconCalendar size={20} strokeWidth={2} /></span><span className="app-list-label">Routines</span></div>
            </div>
          </div>
          <div className="overlay-cta">
            <div className="overlay-cta__icon-row">
              <span className="overlay-cta__icon-circle"><IconCamera size={24} strokeWidth={2} /></span>
              <span className="overlay-cta__icon-circle"><IconTrendingUp size={24} strokeWidth={2} /></span>
              <span className="overlay-cta__icon-circle"><IconSparkles size={24} strokeWidth={2} /></span>
            </div>
            <h2>Your Skin Dashboard</h2>
            <p>Track your skin health over time with personalized insights</p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/scan')}>
              Start Your First Scan
              <IconArrowRight size={18} strokeWidth={2} className="icon-inline" />
            </button>
          </div>
        </div>
      )}
      <div className="dashboard-stats">
        <button type="button" className="stat-card primary" onClick={() => navigate('/history')}>
          <div
            className="skin-score-ring"
            style={{ '--score': data.skinScore } as React.CSSProperties}
            aria-label={`Skin health score: ${data.skinScore}%`}
          >
            <span className="skin-score-ring__value">{data.skinScore}%</span>
          </div>
          <div className="stat-content">
            <p>Skin Health Score</p>
            <span className={`trend ${data.skinTrend}`}>
              {data.skinTrend === 'improving' ? (
                <>
                  <IconTrendingUp size={16} strokeWidth={2} className="icon-inline" />
                  Improving
                </>
              ) : data.skinTrend === 'declining' ? (
                <>
                  <IconTrendingDown size={16} strokeWidth={2} className="icon-inline" />
                  Declining
                </>
              ) : (
                <>
                  <IconArrowRight size={16} strokeWidth={2} className="icon-inline" />
                  Stable
                </>
              )}
            </span>
          </div>
        </button>

        <button type="button" className="stat-card" onClick={() => navigate('/history')}>
          <div className="stat-icon">
            <IconCamera size={32} strokeWidth={2} />
          </div>
          <div className="stat-content">
            <h3>{data.recentScans}</h3>
            <p>Total Scans</p>
          </div>
        </button>

        <button type="button" className="stat-card" onClick={() => navigate('/myshelf')}>
          <div className="stat-icon">
            <IconPackage size={32} strokeWidth={2} />
          </div>
          <div className="stat-content">
            <h3>{data.productsInShelf}</h3>
            <p>My Products</p>
            {data.productsInShelf === 0 && (
              <span className="stat-cta">Add your first product</span>
            )}
          </div>
        </button>

        <button type="button" className="stat-card" onClick={() => navigate('/routine-builder')}>
          <div className="stat-icon">
            <IconSparkles size={32} strokeWidth={2} />
          </div>
          <div className="stat-content">
            <h3>{data.activeRoutines}</h3>
            <p>Active Routines</p>
            {data.activeRoutines === 0 && (
              <span className="stat-cta">Build your routine</span>
            )}
          </div>
        </button>
      </div>

      {/* Scan Streak Widget */}
      {scanDates.length > 0 && (
        <div className="app-section dashboard-section">
          <h2 className="app-section-title">Your Scan Streak</h2>
          <ScanStreak
            scanDates={scanDates}
            frequency={scanReminder.frequency || 'weekly'}
          />
        </div>
      )}

      <div className="dashboard-content">
        {onboardingProgress != null && onboardingProgress.step < 5 && (
          <div className="app-section dashboard-section continue-onboarding">
            <h2 className="app-section-title">Continue</h2>
            <p>You started onboarding. Pick up from step {onboardingProgress.step}.</p>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/onboarding')}>
              Continue onboarding
            </button>
          </div>
        )}
        {/* Weekly Summary Widget */}
        {weeklySummary && (
          <div className="app-section dashboard-section">
            <h2 className="app-section-title">This Week</h2>
            <div className="app-card" style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{weeklySummary.scans_this_week}</span>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Scans</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: weeklySummary.score_trend === 'improving' ? '#16a34a' : weeklySummary.score_trend === 'declining' ? '#dc2626' : 'var(--text-primary)' }}>
                    {weeklySummary.score_trend === 'improving' ? '↑' : weeklySummary.score_trend === 'declining' ? '↓' : '→'}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Score Trend</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{weeklySummary.routine_adherence_pct}%</span>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Adherence</span>
                </div>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{weeklySummary.insight}</p>
            </div>
          </div>
        )}

        {/* Routine Adherence Widget */}
        {routineAdherence && routineAdherence.completion_rate > 0 && (
          <div className="app-section dashboard-section">
            <h2 className="app-section-title">Routine Adherence</h2>
            <div className="app-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Last 30 days</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{routineAdherence.completion_rate}%</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {routineAdherence.this_week.map((d, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      width: '100%', height: 28, borderRadius: 6,
                      background: d.completed ? 'var(--primary)' : 'var(--bg-tertiary, #eef2f6)',
                    }} />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>{d.day}</span>
                  </div>
                ))}
              </div>
              {routineAdherence.current_streak > 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  Current streak: {routineAdherence.current_streak} day{routineAdherence.current_streak !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 4-Week Skin Prediction */}
        {prediction && (prediction.projected_score || prediction.summary) && (
          <div className="app-section dashboard-section">
            <h2 className="app-section-title">4-Week Outlook</h2>
            <div className="app-card" style={{ padding: 20 }}>
              {prediction.projected_score && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{prediction.projected_score}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>projected score</span>
                </div>
              )}
              {prediction.summary && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{prediction.summary}</p>
              )}
              {prediction.improvements && prediction.improvements.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {prediction.improvements.map((imp, i) => (
                    <span key={i} style={{
                      fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px',
                      background: 'rgba(var(--primary-rgb), 0.06)', color: 'var(--primary)',
                      borderRadius: 12,
                    }}>{imp}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="app-section dashboard-section">
          <h2 className="app-section-title">Quick Actions</h2>
          <div className="app-list-group">
            <button type="button" className="app-list-item" onClick={() => navigate('/scan')}>
              <span className="app-list-icon blue"><IconScan size={20} strokeWidth={2} /></span>
              <span className="app-list-label">New Scan</span>
              <span className="app-list-value">Analyze your skin</span>
              <IconArrowRight size={20} strokeWidth={2} className="app-list-arrow" />
            </button>
            <button type="button" className="app-list-item" onClick={() => navigate('/myshelf')}>
              <span className="app-list-icon purple"><IconPackage size={20} strokeWidth={2} /></span>
              <span className="app-list-label">My Shelf</span>
              <span className="app-list-value">{data.productsInShelf} products</span>
              <IconArrowRight size={20} strokeWidth={2} className="app-list-arrow" />
            </button>
            <button type="button" className="app-list-item" onClick={() => navigate('/routine-builder')}>
              <span className="app-list-icon green"><IconCalendar size={20} strokeWidth={2} /></span>
              <span className="app-list-label">Routines</span>
              <span className="app-list-value">Build routine</span>
              <IconArrowRight size={20} strokeWidth={2} className="app-list-arrow" />
            </button>
            <button type="button" className="app-list-item" onClick={() => navigate('/recommendations')}>
              <span className="app-list-icon orange"><IconStar size={20} strokeWidth={2} /></span>
              <span className="app-list-label">Discover</span>
              <span className="app-list-value">Recommendations</span>
              <IconArrowRight size={20} strokeWidth={2} className="app-list-arrow" />
            </button>
          </div>
        </div>

        {recentlyViewed.length > 0 ? (
          <div className="app-section dashboard-section recently-viewed">
            <h2 className="app-section-title">Recently Viewed</h2>
            <div className="recently-viewed-list">
              {recentlyViewed.slice(0, 6).map((p) => (
                <button key={p.id} type="button" className="recently-viewed-item" onClick={() => navigate(`/product/${p.id}`)}>
                  <span className="recently-viewed-name">{p.name}</span>
                  <span className="recently-viewed-brand">{p.brand}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {onboardingGoals?.goals?.length ? (
          <div className="app-section dashboard-section dashboard-goals">
            <h2 className="app-section-title">Your Goals</h2>
            <p className="dashboard-goals-skin">Skin type: {onboardingGoals.skinType}</p>
            <div className="dashboard-goals-tags">
              {onboardingGoals.goals.map((g, i) => (
                <span key={i} className="goal-tag">{g}</span>
              ))}
            </div>
            {onboardingGoals.concerns?.length ? (
              <p className="dashboard-goals-concerns">Concerns: {onboardingGoals.concerns.join(', ')}</p>
            ) : null}
          </div>
        ) : null}

        <div className="app-section dashboard-section next-steps">
          <h2 className="app-section-title">Next Steps</h2>
          <div className="app-list-group">
            {nextSteps.map((step, i) => (
              <button key={i} type="button" className="app-list-item" onClick={() => navigate(step.href)}>
                <span className="app-list-icon blue">{step.icon}</span>
                <span className="app-list-label">{step.label}</span>
                <IconArrowRight size={20} strokeWidth={2} className="app-list-arrow" />
              </button>
            ))}
          </div>
        </div>

        <div className="app-section dashboard-section dashboard-activity-section">
          <div className="dashboard-section-heading">
            <h2 className="app-section-title">Recent Activity</h2>
            {data.recentScans > 0 && (
              <button type="button" className="dashboard-view-all" onClick={() => navigate('/history')}>
                View all
              </button>
            )}
          </div>
          <div className="activity-list app-list-group">
            {data.recentActivity.length === 0 ? (
              data.recentScans === 0 ? (
                <div className="app-empty-state dashboard-first-scan">
                  <div className="app-empty-state-icon"><IconCamera size={28} strokeWidth={2} /></div>
                  <h3>No activity yet</h3>
                  <p>Take your first scan to see your skin insights and track progress here.</p>
                  <button type="button" className="btn btn-ghost dashboard-empty-link" onClick={() => navigate('/scan')}>
                    Take a scan
                  </button>
                </div>
              ) : (
                <p className="app-empty-state">No recent activity</p>
              )
            ) : (
              data.recentActivity.map(activity => (
                <button
                  key={activity.id}
                  type="button"
                  className="activity-item app-list-item activity-item-clickable"
                  onClick={() => activity.type === 'scan' && navigate(`/analysis/${activity.id}`)}
                >
                  <span className="app-list-icon blue">
                    {activity.type === 'scan' ? <IconCamera size={20} strokeWidth={2} /> :
                     activity.type === 'product' ? <IconPackage size={20} strokeWidth={2} /> :
                     <IconSparkles size={20} strokeWidth={2} />}
                  </span>
                  <span className="app-list-label">{activity.title}</span>
                  <span className="app-list-value">{new Date(activity.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  {activity.type === 'scan' && <IconArrowRight size={18} strokeWidth={2} className="app-list-arrow" />}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="app-section dashboard-section reminder">
          <div className="reminder-icon">
            <IconBell size={48} strokeWidth={2} />
          </div>
          <div className="reminder-content">
            <h3>Remind me to scan</h3>
            <p>Next scan: {new Date(displayNextScan + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            <div className="reminder-controls">
              <label className="reminder-label">
                <span>Date</span>
                <input
                  type="date"
                  value={scanReminder.date ?? displayNextScan}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => saveScanReminder({ ...scanReminder, date: e.target.value || undefined })}
                  className="reminder-date-input"
                />
              </label>
              <label className="reminder-label">
                <span>Frequency</span>
                <select
                  value={scanReminder.frequency ?? ''}
                  onChange={(e) => saveScanReminder({ ...scanReminder, frequency: (e.target.value || undefined) as ScanReminder['frequency'] })}
                  className="reminder-frequency-select"
                >
                  <option value="">—</option>
                  <option value="weekly">Every week</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Every month</option>
                </select>
              </label>
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/scan')}>Scan Now</button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default DashboardPage;
