import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';
import { IconTrendingUp, IconCheckCircle, IconCircle, IconDownload } from '../components/Icons';
import './CommonStyles.css';
import './ProgressTrackingPage.css';

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
    <div className="progress-tracking-page">
      <div className="progress-container">
        <div className="page-header">
          <h1>
            <IconTrendingUp size={32} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '12px' }} />
            Progress Tracking
          </h1>
          <p>Monitor your skin health journey over time</p>
        </div>

        <div className="stats-summary">
          <div className="summary-card">
            <div className="value">{progressData[0]?.overallScore || 0}</div>
            <div className="label">Current Score</div>
          </div>
          <div className="summary-card">
            <div className={`value ${getImprovement() >= 0 ? 'positive' : 'negative'}`}>
              {getImprovement() >= 0 ? '+' : ''}{getImprovement()}
            </div>
            <div className="label">Improvement</div>
          </div>
          <div className="summary-card">
            <div className="value">{progressData.length}</div>
            <div className="label">Total Scans</div>
          </div>
        </div>

        <div className="chart-section">
          <div className="chart-header">
            <h2>Progress Chart</h2>
            <div className="chart-controls">
              <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | '3months')}>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="3months">Last 3 Months</option>
              </select>
              <button onClick={() => alert('Export chart feature coming soon!')} className="btn-export-chart">
                <IconDownload size={16} strokeWidth={2} />
                Export
              </button>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorAcne" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="overallScore" 
                  stroke="var(--primary)" 
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  name="Overall Score"
                />
                <Line 
                  type="monotone" 
                  dataKey="acne" 
                  stroke="var(--secondary)" 
                  strokeWidth={2}
                  name="Acne"
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="hydration" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Hydration"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Trend Analysis */}
          <div className="trend-analysis">
            <h3>Trend Analysis</h3>
            <div className="trend-cards">
              <div className="trend-card">
                <div className="trend-label">Overall Trend</div>
                <div className="trend-value positive">
                  <IconTrendingUp size={24} strokeWidth={2} />
                  Improving
                </div>
                <div className="trend-description">Your skin health is improving steadily</div>
              </div>
              <div className="trend-card">
                <div className="trend-label">Acne Trend</div>
                <div className="trend-value positive">
                  <IconTrendingUp size={24} strokeWidth={2} />
                  Decreasing
                </div>
                <div className="trend-description">Acne concerns reduced by 15%</div>
              </div>
              <div className="trend-card">
                <div className="trend-label">Hydration Trend</div>
                <div className="trend-value positive">
                  <IconTrendingUp size={24} strokeWidth={2} />
                  Increasing
                </div>
                <div className="trend-description">Hydration improved by 10%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="milestones-section">
          <h2>Milestones</h2>
          <div className="milestones-list">
            {milestones.map(milestone => (
              <div key={milestone.id} className={`milestone-item${milestone.achieved ? ' achieved' : ''}`}>
                <span className="milestone-icon">
                  {milestone.achieved ? (
                    <IconCheckCircle size={24} strokeWidth={2} />
                  ) : (
                    <IconCircle size={24} strokeWidth={2} />
                  )}
                </span>
                <div className="milestone-content">
                  <h4>{milestone.title}</h4>
                  {milestone.date && <p>Achieved: {milestone.date}</p>}
                </div>
                <span className="milestone-status">{milestone.achieved ? 'Achieved' : 'In Progress'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="compare-section">
          <Link to="/comparison" className="btn btn-secondary">Compare Analyses</Link>
        </div>
      </div>
    </div>
  );
};

export default ProgressTrackingPage;
