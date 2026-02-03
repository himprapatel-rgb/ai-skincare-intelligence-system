import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';
import html2canvas from 'html2canvas';
import { IconTrendingUp, IconCheckCircle, IconCircle, IconDownload } from '../components/Icons';
import { getProgressSummary } from '../services/scanApi';
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
  const chartSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setIsLoading(true);
        const summary = await getProgressSummary(timeRange);
        const mapped = summary.points.map((point) => ({
          date: point.date,
          overallScore: Math.round(point.overall_score),
          acne: Math.round(point.acne),
          wrinkles: Math.round(point.wrinkles),
          hydration: Math.round(point.hydration),
          darkSpots: Math.round(point.dark_spots),
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

        <div className="chart-section" ref={chartSectionRef} role="img" aria-label={`Progress chart: overall score and acne over time. ${progressData.length} data points. Current score ${progressData[0]?.overallScore ?? 0}. Improvement ${getImprovement() >= 0 ? '+' : ''}${getImprovement()}.`}>
          <div className="chart-header">
            <h2>Progress Chart</h2>
            <div className="chart-controls">
              <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | '3months')}>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="3months">Last 3 Months</option>
              </select>
              <button
                onClick={async () => {
                  const el = chartSectionRef.current;
                  if (!el) return;
                  try {
                    const canvas = await html2canvas(el, { useCORS: true, scale: 2, backgroundColor: '#ffffff' });
                    const link = document.createElement('a');
                    link.download = `progress-chart-${timeRange}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                  } catch (err) {
                    console.error('Export failed:', err);
                    alert('Export failed. Please try again.');
                  }
                }}
                className="btn-export-chart"
              >
                <IconDownload size={16} strokeWidth={2} />
                Export
              </button>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={progressData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35}/>
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="colorAcne" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35}/>
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0"
                  strokeOpacity={0.6}
                  vertical={false}
                />
                <XAxis 
                  dataKey="date" 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  dy={8}
                  label={{ value: 'Date', position: 'insideBottom', offset: -8, fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  dx={-4}
                  label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.96)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                    padding: '12px 16px',
                    fontWeight: 500
                  }}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Area 
                  type="monotone" 
                  dataKey="overallScore" 
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  name="Overall Score"
                  dot={{ r: 4, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={1000}
                />
                <Line 
                  type="monotone" 
                  dataKey="acne" 
                  stroke="#8b5cf6" 
                  strokeWidth={2.5}
                  name="Acne"
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={1000}
                />
                <Line 
                  type="monotone" 
                  dataKey="hydration" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  name="Hydration"
                  dot={{ r: 3, fill: '#fff', stroke: '#10b981', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={1000}
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
