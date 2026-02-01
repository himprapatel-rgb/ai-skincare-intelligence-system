import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShelf } from '../context/ShelfContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { getScanHistory } from '../services/scanApi';
import { 
  IconTrendingUp, 
  IconCamera, 
  IconPackage, 
  IconSparkles,
  IconScan,
  IconShoppingCart,
  IconCalendar,
  IconStar,
  IconTrendingDown,
  IconArrowRight,
  IconTarget,
  IconBell
} from '../components/Icons';
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

const DashboardPage: React.FC = () => {
  usePageTitle('Dashboard', 'Your skincare dashboard: recent scans, skin score, shelf, and quick actions.');
  const { user } = useAuth();
  const { totalCount: shelfProductCount } = useShelf();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
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
  }, [shelfProductCount]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const historyData = await getScanHistory();
      const scans = (historyData as { scans?: Array<Record<string, unknown>> }).scans || [];
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
      <div className="dashboard-page">
        <div className="dashboard-empty empty-state">
          <h2>Your Dashboard</h2>
          <p>Sign in to view your skin analysis history and track your progress.</p>
          <button className="btn-primary" onClick={() => navigate('/auth')}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="dashboard-page dashboard-page--skeleton">
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
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.full_name || 'User'}!</h1>
        <p className="subtitle">Here's your skincare overview</p>
      </div>

      <div className="dashboard-stats">
        <button type="button" className="stat-card primary" onClick={() => navigate('/history')}>
          <div className="stat-icon">
            <IconTrendingUp size={32} strokeWidth={2} />
          </div>
          <div className="stat-content">
            <h3>{data.skinScore}%</h3>
            <p>Skin Health Score</p>
            <span className={`trend ${data.skinTrend}`}>
              {data.skinTrend === 'improving' ? (
                <>
                  <IconTrendingUp size={16} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                  Improving
                </>
              ) : data.skinTrend === 'declining' ? (
                <>
                  <IconTrendingDown size={16} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                  Declining
                </>
              ) : (
                <>
                  <IconArrowRight size={16} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
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

      <div className="dashboard-content">
        {onboardingProgress != null && onboardingProgress.step < 5 && (
          <div className="dashboard-section continue-onboarding">
            <h2>Continue where you left off</h2>
            <p>You started onboarding. Pick up from step {onboardingProgress.step}.</p>
            <button type="button" className="btn-primary" onClick={() => navigate('/onboarding')}>
              Continue onboarding
            </button>
          </div>
        )}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button className="action-card" onClick={() => navigate('/scan')}>
              <div className="action-icon">
                <IconScan size={24} strokeWidth={2} />
              </div>
              <h3>New Scan</h3>
              <p>Analyze your skin</p>
            </button>
            <button className="action-card" onClick={() => navigate('/myshelf')}>
              <div className="action-icon">
                <IconShoppingCart size={24} strokeWidth={2} />
              </div>
              <h3>My Shelf</h3>
              <p>Manage products</p>
            </button>
            <button className="action-card" onClick={() => navigate('/routine-builder')}>
              <div className="action-icon">
                <IconCalendar size={24} strokeWidth={2} />
              </div>
              <h3>Routines</h3>
              <p>Build routine</p>
            </button>
            <button className="action-card" onClick={() => navigate('/recommendations')}>
              <div className="action-icon">
                <IconStar size={24} strokeWidth={2} />
              </div>
              <h3>Discover</h3>
              <p>Get recommendations</p>
            </button>
          </div>
        </div>

        {recentlyViewed.length > 0 ? (
          <div className="dashboard-section recently-viewed">
            <h2>Recently viewed products</h2>
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
          <div className="dashboard-section dashboard-goals">
            <h2><IconTarget size={22} strokeWidth={2} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Your goals</h2>
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

        <div className="dashboard-section next-steps">
          <h2>Next steps</h2>
          <p className="next-steps-desc">Recommended actions based on your progress.</p>
          <div className="next-steps-list">
            {nextSteps.map((step, i) => (
              <button key={i} type="button" className="next-step-item" onClick={() => navigate(step.href)}>
                <span className="next-step-icon">{step.icon}</span>
                <span>{step.label}</span>
                <IconArrowRight size={18} strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {data.recentActivity.length === 0 ? (
              data.recentScans === 0 ? (
                <div className="dashboard-first-scan empty-state">
                  <p>Take your first scan to see your skin insights and track progress here.</p>
                  <button type="button" className="btn-primary" onClick={() => navigate('/scan')}>
                    Start your first scan
                  </button>
                </div>
              ) : (
                <p className="empty-state">No recent activity</p>
              )
            ) : (
              data.recentActivity.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'scan' ? <IconCamera size={20} strokeWidth={2} /> :
                     activity.type === 'product' ? <IconPackage size={20} strokeWidth={2} /> : 
                     <IconSparkles size={20} strokeWidth={2} />}
                  </div>
                  <div className="activity-details">
                    <h4>{activity.title}</h4>
                    <p>{new Date(activity.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-section reminder">
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
                  value={scanReminder.date ?? ''}
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
            <button className="btn-primary" onClick={() => navigate('/scan')}>Scan Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
