import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { IconCamera, IconTrendingUp, IconCalendar, IconSparkles, IconTarget } from '../components/Icons';
import './DigitalTwinTimelinePage.css';

interface ApiStateVector {
  hydration_level: number;
  oiliness_level: number;
  sensitivity_level: number;
  barrier_impairment: number;
  inflammation_level: number;
  pigmentation_issues: number;
  aging_signs: number;
  congestion_level: number;
}

interface ApiSnapshot {
  snapshot_id: string;
  created_at: string;
  skin_mood: string;
  global_state_vector: ApiStateVector;
  meta: {
    overall_score?: number;
    image_url?: string;
    concerns?: string[];
  };
}

interface ApiInsights {
  latest_score?: number;
  trend?: string;
  delta_score?: number;
  best_improvement?: string;
  top_concern?: string;
}

interface DigitalTwinSnapshot {
  id: string;
  date: string;
  imageUrl: string;
  overallScore: number;
  skinMoodLabel: string;
  skinMoodScore: number;
  topConcerns: string[];
  concerns: {
    acne: number;
    wrinkles: number;
    darkSpots: number;
    hydration: number;
    redness: number;
  };
  improvements: string[];
}

/**
 * Digital Twin Timeline Page (FR1-FR9 from SRS)
 * Showcase user's skin improvement over time with timeline visualization
 */
const DigitalTwinTimelinePage: React.FC = () => {
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState<DigitalTwinSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [insights, setInsights] = useState<ApiInsights | null>(null);

  const moodScoreMap: Record<string, number> = {
    happy: 90,
    balanced: 75,
    dry: 45,
    oily: 55,
    combination: 60,
    sensitive: 50,
    stressed: 45,
    irritated: 40,
    breakout_prone: 40,
    recovering: 60,
    aggravated: 35,
    unknown: 50,
  };

  const formatMoodLabel = (mood: string) => mood.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const formatConcernLabel = (concern: string) => concern.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE}/digital-twin/query?limit=200`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok) {
          throw new Error('Failed to load digital twin timeline');
        }
        const data = await response.json();
        const apiSnapshots: ApiSnapshot[] = data.snapshots || [];
        const latestSnapshot: ApiSnapshot | null = data.latest_snapshot || apiSnapshots[0] || null;
        const mergedInsights: ApiInsights = {
          ...(data.timeline?.summary_insights || {}),
          ...(data.insights || {}),
        };
        const mapped: DigitalTwinSnapshot[] = apiSnapshots.map((snapshot, index) => {
          const state = snapshot.global_state_vector || {
            hydration_level: 0,
            oiliness_level: 0,
            sensitivity_level: 0,
            barrier_impairment: 0,
            inflammation_level: 0,
            pigmentation_issues: 0,
            aging_signs: 0,
            congestion_level: 0,
          };
          const overallScore = Math.round(snapshot.meta?.overall_score ?? 0);
          const moodKey = (snapshot.skin_mood || 'unknown').toLowerCase();
          const skinMoodScore = moodScoreMap[moodKey] ?? 50;
          const skinMoodLabel = formatMoodLabel(moodKey || 'unknown');
          const concernScores = {
            acne: Math.round((state.inflammation_level || 0) * 100),
            wrinkles: Math.round((state.aging_signs || 0) * 100),
            darkSpots: Math.round((state.pigmentation_issues || 0) * 100),
            hydration: Math.round((state.hydration_level || 0) * 100),
            redness: Math.round((state.barrier_impairment || 0) * 100),
          };
          const previous = index > 0 ? apiSnapshots[index - 1] : null;
          const improvements: string[] = [];
          if (previous?.meta?.overall_score != null) {
            const diff = Math.round(overallScore - (previous.meta?.overall_score || 0));
            if (diff > 0) {
              improvements.push(`Overall score improved by ${diff}`);
            }
          }
          if (concernScores.hydration >= 70) {
            improvements.push('Hydration levels looking strong');
          }
          return {
            id: snapshot.snapshot_id,
            date: snapshot.created_at,
            imageUrl: snapshot.meta?.image_url || '/placeholder.jpg',
            overallScore,
            skinMoodLabel,
            skinMoodScore,
            topConcerns: (snapshot.meta?.concerns || []).map(formatConcernLabel),
            concerns: concernScores,
            improvements,
          };
        });
        setSnapshots(mapped);
        setInsights(mergedInsights);
        if (!selectedSnapshot && latestSnapshot?.snapshot_id) {
          setSelectedSnapshot(latestSnapshot.snapshot_id);
        }
      } catch (error) {
        console.error('Failed to load digital twin timeline:', error);
        setHasError(true);
        setSnapshots([]);
        setInsights(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSnapshots();
  }, []);

  const chartData = [...snapshots]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(s => ({
      date: new Date(s.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      score: s.overallScore,
      mood: s.skinMoodScore,
      acne: s.concerns.acne,
      hydration: s.concerns.hydration
    }));

  const selectedData = snapshots.find(s => s.id === selectedSnapshot) || snapshots[0] || null;
  const latestSnapshot = snapshots[0] || null;

  if (isLoading) {
    return (
      <div className="digital-twin-page">
        <div className="loading-spinner">Loading timeline...</div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="digital-twin-page">
        <div className="digital-twin-container">
          <div className="page-header">
            <h1>Digital Twin Timeline</h1>
            <p>We couldn't load your digital twin timeline. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="digital-twin-page">
        <div className="digital-twin-container">
          <div className="page-header">
            <h1>Digital Twin Timeline</h1>
            <p>Complete a scan to generate your first digital twin snapshot.</p>
          </div>
          <div className="empty-state">
            <h2>No snapshots yet</h2>
            <p>Your digital twin will appear after you complete a skin scan.</p>
            <div className="empty-state-actions">
              <button type="button" className="btn-primary" onClick={() => navigate('/scan')}>
                Start a Scan
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="digital-twin-page">
      <div className="digital-twin-container">
        <div className="page-header">
          <h1>
            <IconTarget size={32} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '12px' }} />
            Digital Twin Timeline
          </h1>
          <p>Track your skin's journey and see how it evolves over time</p>
        </div>

        {/* Overall Progress Summary */}
        <div className="progress-summary">
          <div className="summary-card">
            <div className="summary-icon">
              <IconTrendingUp size={32} strokeWidth={2} />
            </div>
            <div className="summary-content">
              <div className="summary-value">{latestSnapshot?.overallScore || 0}</div>
              <div className="summary-label">Current Score</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">
              <IconSparkles size={32} strokeWidth={2} />
            </div>
            <div className="summary-content">
              <div className="summary-value">{latestSnapshot?.skinMoodLabel || 'Unknown'}</div>
              <div className="summary-label">Skin Mood</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">
              <IconCalendar size={32} strokeWidth={2} />
            </div>
            <div className="summary-content">
              <div className="summary-value">{snapshots.length}</div>
              <div className="summary-label">Total Snapshots</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">
              <IconTarget size={32} strokeWidth={2} />
            </div>
            <div className="summary-content">
              <div className="summary-value">
                {latestSnapshot?.topConcerns?.length ? latestSnapshot.topConcerns.join(', ') : '—'}
              </div>
              <div className="summary-label">Top Concerns</div>
            </div>
          </div>
        </div>

        {insights && (
          <div className="progress-summary">
            <div className="summary-card">
              <div className="summary-icon">
                <IconTrendingUp size={32} strokeWidth={2} />
              </div>
              <div className="summary-content">
                <div className="summary-value">{insights.trend || 'stable'}</div>
                <div className="summary-label">Trend</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">
                <IconTarget size={32} strokeWidth={2} />
              </div>
              <div className="summary-content">
                <div className="summary-value">{insights.best_improvement || '—'}</div>
                <div className="summary-label">Best Improvement</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">
                <IconSparkles size={32} strokeWidth={2} />
              </div>
              <div className="summary-content">
                <div className="summary-value">{insights.top_concern || '—'}</div>
                <div className="summary-label">Top Concern</div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Chart */}
        <div className="card timeline-chart-card">
          <div className="card-header">
            <h2>Progress Over Time</h2>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="score" 
                  stroke="var(--primary)" 
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  name="Overall Score"
                />
                <Area 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="var(--secondary)" 
                  fillOpacity={1}
                  fill="url(#colorMood)"
                  name="Skin Mood"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline Snapshots */}
        <div className="card timeline-snapshots-card">
          <div className="card-header">
            <h2>Timeline Snapshots</h2>
            <button onClick={() => navigate('/scan')} className="btn-primary">
              <IconCamera size={18} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Take New Snapshot
            </button>
          </div>
          <div className="card-content">
            <div className="timeline-snapshots">
              {snapshots.map((snapshot, index) => (
                <div
                  key={snapshot.id}
                  className={`snapshot-item ${selectedSnapshot === snapshot.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSnapshot(snapshot.id)}
                >
                  <div className="snapshot-image">
                    <img src={snapshot.imageUrl} alt={`Snapshot ${index + 1}`} />
                    <div className="snapshot-date">
                      {new Date(snapshot.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="snapshot-info">
                    <div className="snapshot-score">Score: {snapshot.overallScore}</div>
                    <div className="snapshot-mood">Mood: {snapshot.skinMoodLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Snapshot Details */}
        {selectedData && (
          <div className="card snapshot-details-card">
            <div className="card-header">
              <h2>Snapshot Details - {new Date(selectedData.date).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</h2>
            </div>
            <div className="card-content">
              <div className="snapshot-details-grid">
                <div className="detail-image">
                  <img src={selectedData.imageUrl} alt="Selected snapshot" />
                </div>
                <div className="detail-metrics">
                  <h3>Metrics</h3>
                  <div className="metrics-grid">
                    <div className="metric-item">
                      <span className="metric-label">Overall Score</span>
                      <span className="metric-value">{selectedData.overallScore}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Skin Mood</span>
                      <span className="metric-value">{selectedData.skinMoodLabel}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Acne</span>
                      <span className="metric-value">{selectedData.concerns.acne}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Wrinkles</span>
                      <span className="metric-value">{selectedData.concerns.wrinkles}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Dark Spots</span>
                      <span className="metric-value">{selectedData.concerns.darkSpots}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Hydration</span>
                      <span className="metric-value">{selectedData.concerns.hydration}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Redness</span>
                      <span className="metric-value">{selectedData.concerns.redness}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedData.improvements.length > 0 && (
                <div className="improvements-section">
                  <h3>Key Improvements</h3>
                  <ul className="improvements-list">
                    {selectedData.improvements.map((improvement, idx) => (
                      <li key={idx}>
                        <IconTrendingUp size={16} strokeWidth={2} style={{ marginRight: '8px', color: 'var(--primary)' }} />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Before/After Comparison */}
        {snapshots.length >= 2 && (
          <div className="card comparison-card">
            <div className="card-header">
              <h2>Before & After</h2>
            </div>
            <div className="card-content">
              <div className="before-after-grid">
                <div className="before-after-item">
                  <div className="ba-label">Before</div>
                  <img src={snapshots[snapshots.length - 1].imageUrl} alt="Before" />
                  <div className="ba-date">{new Date(snapshots[snapshots.length - 1].date).toLocaleDateString()}</div>
                  <div className="ba-score">Score: {snapshots[snapshots.length - 1].overallScore}</div>
                </div>
                <div className="before-after-item">
                  <div className="ba-label">After</div>
                  <img src={snapshots[0].imageUrl} alt="After" />
                  <div className="ba-date">{new Date(snapshots[0].date).toLocaleDateString()}</div>
                  <div className="ba-score">Score: {snapshots[0].overallScore}</div>
                </div>
              </div>
              <div className="improvement-summary">
                <div className="improvement-value">
                  +{snapshots[0].overallScore - snapshots[snapshots.length - 1].overallScore} points
                </div>
                <div className="improvement-label">Overall Improvement</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalTwinTimelinePage;
