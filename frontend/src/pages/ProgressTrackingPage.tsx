import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';
import { IconTrendingUp, IconCheckCircle, IconCircle, IconDownload } from '../components/Icons';
import { getScanHistory } from '../services/scanApi';
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
    const fetchProgress = async () => {
      try {
        setIsLoading(true);
        const historyData = await getScanHistory();
        const scans = (historyData as { scans?: Array<Record<string, unknown>> }).scans || [];

        const now = new Date();
        const rangeDays = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
        const filtered = scans.filter((scan) => {
          const createdAt = new Date(String(scan.created_at || ''));
          if (Number.isNaN(createdAt.getTime())) return false;
          const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= rangeDays;
        });

        const mapped = filtered.map((scan) => {
          const summary = (scan.summary || {}) as Record<string, unknown>;
          const scores = (summary.scores || {}) as Record<string, unknown>;

          const getScore = (keys: string[]) => {
            for (const key of keys) {
              const value = scores[key];
              if (typeof value === 'number') {
                return Math.round(value);
              }
            }
            return 0;
          };

          const overall = typeof summary.overall_score === 'number'
            ? Math.round(summary.overall_score)
            : 0;

          return {
            date: String(scan.created_at || ''),
            overallScore: overall,
            acne: getScore(['acne', 'hd_acne']),
            wrinkles: getScore(['wrinkle', 'hd_wrinkle']),
            hydration: getScore(['moisture', 'hd_moisture']),
            darkSpots: getScore(['age_spot', 'hd_age_spot']),
          } as ProgressData;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setProgressData(mapped);
      } catch (error) {
        console.error('Failed to load progress data:', error);
        setProgressData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [timeRange]);

  const getImprovement = () => {
    if (progressData.length < 2) return 0;
    return progressData[0].overallScore - progressData[progressData.length - 1].overallScore;
  };

  const milestones = [
    { id: 1, title: 'First Scan Completed', achieved: progressData.length > 0, date: progressData[progressData.length - 1]?.date || null },
    { id: 2, title: '5 Scans Milestone', achieved: progressData.length >= 5, date: progressData[0]?.date || null },
    { id: 3, title: '10% Improvement', achieved: getImprovement() >= 10, date: getImprovement() >= 10 ? progressData[0]?.date || null : null },
    { id: 4, title: '30-Day Streak', achieved: progressData.length >= 30, date: null },
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
