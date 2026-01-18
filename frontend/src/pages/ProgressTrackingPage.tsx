import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CommonStyles.css';

interface ProgressData {
  date: string;
  overallScore: number;
  acne: number;
  wrinkles: number;
  hydration: number;
  darkSpots: number;
}

/**
 * Progress Tracking Page (US-403)
 * Track skin health progress over time with charts and milestones
 */
const ProgressTrackingPage: React.FC = () => {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with API call
    const mockData: ProgressData[] = [
      { date: '2026-01-14', overallScore: 75, acne: 30, wrinkles: 20, hydration: 70, darkSpots: 25 },
      { date: '2026-01-07', overallScore: 72, acne: 35, wrinkles: 22, hydration: 65, darkSpots: 28 },
      { date: '2025-12-31', overallScore: 68, acne: 40, wrinkles: 20, hydration: 60, darkSpots: 30 },
      { date: '2025-12-24', overallScore: 65, acne: 45, wrinkles: 18, hydration: 55, darkSpots: 32 },
      { date: '2025-12-17', overallScore: 62, acne: 50, wrinkles: 22, hydration: 50, darkSpots: 35 },
    ];
    setProgressData(mockData);
    setIsLoading(false);
  }, [timeRange]);

  const getImprovement = () => {
    if (progressData.length < 2) return 0;
    return progressData[0].overallScore - progressData[progressData.length - 1].overallScore;
  };

  const milestones = [
    { id: 1, title: 'First Scan Completed', achieved: true, date: '2025-12-17' },
    { id: 2, title: '5 Scans Milestone', achieved: true, date: '2026-01-07' },
    { id: 3, title: '10% Improvement', achieved: getImprovement() >= 10, date: getImprovement() >= 10 ? '2026-01-14' : null },
    { id: 4, title: '30-Day Streak', achieved: false, date: null },
  ];

  if (isLoading) return <div className="page-container"><p>Loading progress data...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📈 Progress Tracking</h1>
        <p>Monitor your skin health journey over time</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--primary)' }}>
              {progressData[0]?.overallScore || 0}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>Current Score</div>
          </div>
        </div>
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: getImprovement() >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {getImprovement() >= 0 ? '+' : ''}{getImprovement()}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>Improvement</div>
          </div>
        </div>
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{progressData.length}</div>
            <div style={{ color: 'var(--text-secondary)' }}>Total Scans</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Progress Chart</h3>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)} style={{ padding: '8px' }}>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="3months">Last 3 Months</option>
          </select>
        </div>
        <div className="card-content">
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '16px 0' }}>
            {progressData.map((data, index) => (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ background: 'var(--primary)', width: '100%', maxWidth: '40px', height: `${data.overallScore * 1.5}px`, borderRadius: '4px 4px 0 0' }} />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>{data.date.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>🏆 Milestones</h3></div>
        <div className="card-content">
          {milestones.map(milestone => (
            <div key={milestone.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '24px', marginRight: '16px' }}>{milestone.achieved ? '✅' : '⭕'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: milestone.achieved ? 'bold' : 'normal' }}>{milestone.title}</div>
                {milestone.date && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Achieved: {milestone.date}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Link to="/comparison" className="btn btn-secondary">Compare Analyses</Link>
      </div>
    </div>
  );
};

export default ProgressTrackingPage;
