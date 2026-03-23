import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { IconTrendingUp, IconCheckCircle, IconCircle, IconDownload } from '../components/Icons';
import { SkeletonHeading, SkeletonText, SkeletonCard } from '../components/Skeleton';
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
  const [rechartsModule, setRechartsModule] = useState<typeof import('recharts') | null>(null);
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

  useEffect(() => {
    let isMounted = true;
    import('recharts')
      .then((mod) => {
        if (isMounted) setRechartsModule(mod);
      })
      .catch(() => {
        if (isMounted) setRechartsModule(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const improvement = useMemo(() => {
    if (progressData.length < 2) return 0;
    return progressData[0].overallScore - progressData[progressData.length - 1].overallScore;
  }, [progressData]);

  const milestones = useMemo(() => ([
    { id: 1, title: 'First Scan Completed', achieved: progressData.length > 0, date: progressData[progressData.length - 1]?.date || null },
    { id: 2, title: '5 Scans Milestone', achieved: progressData.length >= 5, date: progressData[0]?.date || null },
    { id: 3, title: '10% Improvement', achieved: improvement >= 10, date: improvement >= 10 ? progressData[0]?.date || null : null },
    { id: 4, title: '30-Day Streak', achieved: progressData.length >= 30, date: null },
  ]), [progressData, improvement]);

  if (isLoading) {
    return (
      <div className="progress-tracking-page app-page">
        <header className="app-header-card">
          <SkeletonHeading style={{ width: 180, height: 28 }} />
          <SkeletonText style={{ width: 220, marginTop: 8 }} />
        </header>
        <div className="app-page-content">
          <div className="stats-summary">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} hasImage={false} style={{ minHeight: 80 }} />
            ))}
          </div>
          <SkeletonCard hasImage={false} style={{ minHeight: 200, marginTop: 24 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="progress-tracking-page app-page">
      <header className="app-header-card">
        <h1>
          <IconTrendingUp size={24} strokeWidth={2} className="progress-header-icon" aria-hidden />
          Progress
        </h1>
        <p className="app-header-subtitle">Your skin health over time</p>
      </header>
      <div className="app-page-content">
        <div className="stats-summary">
          <div className="summary-card">
            <div className="value">{progressData[0]?.overallScore || 0}</div>
            <div className="label">Current Score</div>
          </div>
          <div className="summary-card">
            <div className={`value ${improvement >= 0 ? 'positive' : 'negative'}`}>
              {improvement >= 0 ? '+' : ''}{improvement}
            </div>
            <div className="label">Improvement</div>
          </div>
          <div className="summary-card">
            <div className="value">{progressData.length}</div>
            <div className="label">Total Scans</div>
          </div>
        </div>

        <div className="chart-section" ref={chartSectionRef} role="img" aria-label={`Progress chart: overall score and acne over time. ${progressData.length} data points. Current score ${progressData[0]?.overallScore ?? 0}. Improvement ${improvement >= 0 ? '+' : ''}${improvement}.`}>
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
                    const { default: html2canvas } = await import('html2canvas');
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
            {rechartsModule ? (
              <rechartsModule.ResponsiveContainer width="100%" height={400}>
                <rechartsModule.AreaChart data={progressData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                  <rechartsModule.CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e2e8f0"
                    strokeOpacity={0.6}
                    vertical={false}
                  />
                  <rechartsModule.XAxis 
                    dataKey="date" 
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    dy={8}
                    label={{ value: 'Date', position: 'insideBottom', offset: -8, fill: '#64748b', fontSize: 12 }}
                  />
                  <rechartsModule.YAxis 
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    dx={-4}
                    label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
                  />
                  <rechartsModule.Tooltip 
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
                  <rechartsModule.Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <rechartsModule.Area 
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
                  <rechartsModule.Line 
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
                  <rechartsModule.Line 
                    type="monotone" 
                    dataKey="hydration" 
                    stroke="#10b981" 
                    strokeWidth={2.5}
                    name="Hydration"
                    dot={{ r: 3, fill: '#fff', stroke: '#10b981', strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={1000}
                  />
                </rechartsModule.AreaChart>
              </rechartsModule.ResponsiveContainer>
            ) : (
              <div className="chart-placeholder">Loading chart…</div>
            )}
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
          <Link to="/comparison" className="btn btn-secondary">Compare analyses</Link>
        </div>
      </div>
    </div>
  );
};

export default ProgressTrackingPage;
