import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Mock data
      const mockData: DashboardData = {
        recentScans: 12,
        skinScore: 78,
        productsInShelf: 8,
        activeRoutines: 2,
        nextScanDue: '2025-01-15',
        recentActivity: [
          { id: '1', type: 'scan', title: 'Completed skin scan', date: '2025-01-11' },
          { id: '2', type: 'product', title: 'Added Vitamin C Serum', date: '2025-01-10' },
          { id: '3', type: 'routine', title: 'Updated morning routine', date: '2025-01-08' }
        ],
        skinTrend: 'improving'
      };
      setData(mockData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div className="dashboard-page"><div className="loading-spinner">Loading dashboard...</div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
            <h1>Welcome back, {user?.full_name || 'User'}!</h1>        <p className="subtitle">Here's your skincare overview</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card primary" onClick={() => navigate('/history')}>
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{data.skinScore}%</h3>
            <p>Skin Health Score</p>
            <span className={`trend ${data.skinTrend}`}>
              {data.skinTrend === 'improving' ? '↑ Improving' : 
               data.skinTrend === 'declining' ? '↓ Declining' : '→ Stable'}
            </span>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/history')}>
          <div className="stat-icon">📷</div>
          <div className="stat-content">
            <h3>{data.recentScans}</h3>
            <p>Total Scans</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/myshelf')}>
          <div className="stat-icon">🧴</div>
          <div className="stat-content">
            <h3>{data.productsInShelf}</h3>
            <p>Products in Shelf</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/routine-builder')}>
          <div className="stat-icon">✨</div>
          <div className="stat-content">
            <h3>{data.activeRoutines}</h3>
            <p>Active Routines</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button className="action-card" onClick={() => navigate('/scan')}>
              <div className="action-icon">📸</div>
              <h3>New Scan</h3>
              <p>Analyze your skin</p>
            </button>
            <button className="action-card" onClick={() => navigate('/myshelf')}>
              <div className="action-icon">🛒</div>
              <h3>My Shelf</h3>
              <p>Manage products</p>
            </button>
            <button className="action-card" onClick={() => navigate('/routine-builder')}>
              <div className="action-icon">📅</div>
              <h3>Routines</h3>
              <p>Build routine</p>
            </button>
            <button className="action-card" onClick={() => navigate('/recommendations')}>
              <div className="action-icon">🌟</div>
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
                    {activity.type === 'scan' ? '📷' :
                     activity.type === 'product' ? '🧴' : '✨'}
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
          <div className="reminder-icon">⏰</div>
          <div className="reminder-content">
            <h3>Next Scan Reminder</h3>
            <p>Schedule your next skin analysis on {new Date(data.nextScanDue).toLocaleDateString('en', { month: 'long', day: 'numeric' })}</p>
            <button className="btn-primary" onClick={() => navigate('/scan')}>Scan Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
