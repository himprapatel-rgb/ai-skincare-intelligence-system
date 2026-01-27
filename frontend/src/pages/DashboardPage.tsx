import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getScanHistory } from '../services/scanApi';
import { mockProducts } from '../data/mockProducts';
import { 
  IconTrendingUp, 
  IconCamera, 
  IconPackage, 
  IconSparkles,
  IconScan,
  IconShoppingCart,
  IconCalendar,
  IconStar,
  IconClock,
  IconTrendingDown,
  IconArrowRight
} from '../components/Icons';
import LoadingScreen from '../components/LoadingScreen';
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

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setData(null);
      return;
    }
    fetchDashboardData();
  }, [user]);

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
        productsInShelf: mockProducts.length,
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
        productsInShelf: mockProducts.length,
        activeRoutines: 0,
        nextScanDue: new Date().toISOString(),
        recentActivity: [],
        skinTrend: 'stable',
      });
    } finally {
      setLoading(false);
    }
  };

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
    return <div className="dashboard-page"><LoadingScreen message="Loading dashboard" fullscreen={false} /></div>;
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
          </div>
        </button>

        <button type="button" className="stat-card" onClick={() => navigate('/routine-builder')}>
          <div className="stat-icon">
            <IconSparkles size={32} strokeWidth={2} />
          </div>
          <div className="stat-content">
            <h3>{data.activeRoutines}</h3>
            <p>Active Routines</p>
          </div>
        </button>
      </div>

      <div className="dashboard-content">
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

        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {data.recentActivity.length === 0 ? (
              <p className="empty-state">No recent activity</p>
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
            <IconClock size={48} strokeWidth={2} />
          </div>
          <div className="reminder-content">
            <h3>Next Scan Reminder</h3>
            <p>Schedule your next skin analysis on {new Date(data.nextScanDue).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            <button className="btn-primary" onClick={() => navigate('/scan')}>Scan Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
