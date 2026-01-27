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
    oiliness: number;
    redness: number;
  };
  improvements: string[];
}

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

/**
 * Digital Twin Timeline Page (FR1-FR9 from SRS)
 * Showcase user's skin improvement over time with timeline visualization
 */
const DigitalTwinTimelinePage: React.FC = () => {
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState<DigitalTwinSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [comparisonBefore, setComparisonBefore] = useState<string | null>(null);
  const [comparisonAfter, setComparisonAfter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>(() => {
    const stored = localStorage.getItem('digital_twin_range');
    if (stored === '7d' || stored === '30d' || stored === '90d' || stored === 'all') {
      return stored;
    }
    return '30d';
  });
  const [compareSplit, setCompareSplit] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [insights, setInsights] = useState<ApiInsights | null>(null);

  const formatMoodLabel = (mood: string) => mood.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const formatConcernLabel = (concern: string) => concern.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const formatTrendLabel = (trend?: string) => (trend ? formatMoodLabel(trend) : 'Stable');
  const formatFullDate = (dateValue: string) => {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return 'Unknown date';
    }
    return parsed.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const formatFullDateTime = (dateValue: string) => {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return 'Unknown date';
    }
    return parsed.toLocaleDateString('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const formatShortDate = (timestamp: number) => new Date(timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' });
  const fallbackImage = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f7f9fc"/>
          <stop offset="100%" stop-color="#eef2f7"/>
        </linearGradient>
      </defs>
      <rect width="600" height="750" rx="32" fill="url(#bg)"/>
      <circle cx="300" cy="280" r="120" fill="#d9e4f5"/>
      <rect x="170" y="430" width="260" height="26" rx="13" fill="#c7d3e6"/>
      <rect x="210" y="470" width="180" height="18" rx="9" fill="#d5deed"/>
      <text x="50%" y="560" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" fill="#6b7c93">Snapshot image unavailable</text>
    </svg>`
  )}`;
  const apiBase = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';
  const apiOrigin = apiBase.replace(/\/api\/v1\/?$/, '');
  const getSafeImageUrl = (url?: string) => {
    if (!url || url.trim().length === 0) {
      return fallbackImage;
    }
    if (url.startsWith('data:')) {
      return url;
    }
    if (url.startsWith('http')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `${apiOrigin}${url}`;
    }
    return `${apiOrigin}/${url}`;
  };
  const getScoreTone = (score: number) => {
    if (score >= 70) return 'score-good';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  };

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const API_BASE = apiBase;
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
            oiliness: Math.round((state.oiliness_level || 0) * 100),
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
            imageUrl: getSafeImageUrl(snapshot.meta?.image_url),
            overallScore,
            skinMoodLabel,
            skinMoodScore,
            topConcerns: (snapshot.meta?.concerns || []).map(formatConcernLabel),
            concerns: concernScores,
            improvements,
          };
        });
        const filteredSnapshots = mapped.filter((snapshot) => snapshot.overallScore > 0 || snapshot.topConcerns.length > 0);
        const finalSnapshots = filteredSnapshots.length > 0 ? filteredSnapshots : mapped;
        const latestSnapshotId = finalSnapshots[0]?.id ?? null;
        setSnapshots(finalSnapshots);
        setInsights(mergedInsights);
        setSelectedSnapshot((current) => current ?? latestSnapshotId);
        setComparisonBefore((current) => current ?? finalSnapshots[finalSnapshots.length - 1]?.id ?? null);
        setComparisonAfter((current) => current ?? finalSnapshots[0]?.id ?? null);
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

  useEffect(() => {
    localStorage.setItem('digital_twin_range', dateRange);
  }, [dateRange]);

  const sortedSnapshots = [...snapshots].sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();
    if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
      return 0;
    }
    return aTime - bTime;
  });

  const rangeSnapshots = (() => {
    if (dateRange === 'all') {
      return sortedSnapshots;
    }
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const filtered = sortedSnapshots.filter((snapshot) => {
      const parsed = new Date(snapshot.date);
      const timestamp = parsed.getTime();
      return Number.isNaN(timestamp) ? true : timestamp >= cutoff;
    });
    return filtered.length >= 2 ? filtered : sortedSnapshots;
  })();

  const chartData = rangeSnapshots.map((snapshot, index) => {
    const parsed = new Date(snapshot.date);
    const timestamp = parsed.getTime();
    const safeTimestamp = Number.isNaN(timestamp)
      ? Date.now() - (rangeSnapshots.length - index) * 24 * 60 * 60 * 1000
      : timestamp + index * 1000;
    const labelSuffix = rangeSnapshots.length > 1 ? ` • ${index + 1}` : '';
    return {
      timestamp: safeTimestamp,
      dateLabel: `${formatShortDate(safeTimestamp)}${labelSuffix}`,
      fullLabel: formatFullDate(snapshot.date),
      score: snapshot.overallScore,
      mood: snapshot.skinMoodScore,
      acne: snapshot.concerns.acne,
      hydration: snapshot.concerns.hydration
    };
  });

  const selectedData = snapshots.find(s => s.id === selectedSnapshot) || snapshots[0] || null;
  const latestSnapshot = snapshots[0] || null;
  const beforeSnapshot = snapshots.find(s => s.id === comparisonBefore) || snapshots[snapshots.length - 1] || null;
  const afterSnapshot = snapshots.find(s => s.id === comparisonAfter) || snapshots[0] || null;
  const chartTooltipLabel = (label: string | number, payload?: { payload?: { fullLabel?: string } }) => {
    if (payload?.payload?.fullLabel) return payload.payload.fullLabel;
    return String(label);
  };

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
            <IconTarget size={32} strokeWidth={2} className="icon-inline-lg" />
            Digital Twin Timeline
          </h1>
          <p>Track your skin's journey and see how it evolves over time</p>
        </div>

        <div className="twin-explainer">
          <div className="twin-explainer-card">
            <h3>What is a Digital Twin?</h3>
            <p>
              Your Digital Twin is a living profile of your skin, created from each scan.
              It summarizes your scores and makes progress easy to visualize over time.
            </p>
          </div>
          <div className="twin-explainer-card">
            <h3>How Tracking Works</h3>
            <p>
              Each scan adds a new snapshot. We chart your overall score, mood, and
              concern metrics so you can spot trends and celebrate improvements.
            </p>
          </div>
          <div className="twin-explainer-card">
            <h3>Why It Matters</h3>
            <p>
              Consistent tracking helps you connect skincare choices with results,
              making routines more intentional and measurable.
            </p>
          </div>
        </div>

        {/* Overall Progress Summary */}
        <div className="progress-summary">
          <div className="summary-card">
            <div className="summary-icon">
              <IconTrendingUp size={32} strokeWidth={2} />
            </div>
            <div className="summary-content">
              <div className="summary-value">
                {latestSnapshot?.overallScore || 0}
                <span className="summary-unit">/100</span>
              </div>
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
              <div className="summary-value summary-value--concerns">
                {latestSnapshot?.topConcerns?.length ? latestSnapshot.topConcerns.join(', ') : '—'}
              </div>
              <div className="summary-label">Top Concerns</div>
            </div>
          </div>
        </div>

        {insights && (
          <div className="progress-summary">
            <div className={`summary-card summary-card--trend ${insights.trend === 'improving' ? 'tone-positive' : insights.trend === 'declining' ? 'tone-negative' : 'tone-neutral'}`}>
              <div className="summary-icon">
                <IconTrendingUp size={32} strokeWidth={2} />
              </div>
              <div className="summary-content">
                <div className="summary-value">{formatTrendLabel(insights.trend)}</div>
                <div className="summary-label">Trend</div>
              </div>
            </div>
            <div className="summary-card summary-card--highlight">
              <div className="summary-icon">
                <IconTarget size={32} strokeWidth={2} />
              </div>
              <div className="summary-content">
                <div className="summary-value">{insights.best_improvement || '—'}</div>
                <div className="summary-label">Best Improvement</div>
              </div>
            </div>
            <div className="summary-card summary-card--concern tone-negative">
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
            <div className="chart-controls">
              <label>
                Range
                <select value={dateRange} onChange={(event) => setDateRange(event.target.value as typeof dateRange)}>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </label>
            </div>
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
                <XAxis dataKey="dateLabel" interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}`} />
                <Tooltip
                  formatter={(value, name) => [`${value}`, name]}
                  labelFormatter={(label, payload) => chartTooltipLabel(label, payload?.[0])}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="var(--primary)" 
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  name="Overall Score"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="var(--secondary)" 
                  fillOpacity={1}
                  fill="url(#colorMood)"
                  name="Skin Mood"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
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
              <IconCamera size={18} strokeWidth={2} className="icon-inline" />
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
                    <img
                      src={snapshot.imageUrl}
                      alt={`Snapshot ${index + 1}`}
                      loading="lazy"
                      onError={(event) => {
                        const target = event.currentTarget;
                        if (target.src !== fallbackImage) {
                          target.src = fallbackImage;
                        }
                      }}
                    />
                    <div className="snapshot-date">
                      {formatFullDate(snapshot.date)}
                    </div>
                  </div>
                  <div className="snapshot-info">
                    <div className={`snapshot-score ${getScoreTone(snapshot.overallScore)}`}>Score: {snapshot.overallScore}</div>
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
                  <img
                    src={selectedData.imageUrl}
                    alt="Selected snapshot"
                    loading="lazy"
                    onError={(event) => {
                      const target = event.currentTarget;
                      if (target.src !== fallbackImage) {
                        target.src = fallbackImage;
                      }
                    }}
                  />
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
                        <span className="metric-label">Oiliness</span>
                        <span className="metric-value">{selectedData.concerns.oiliness}%</span>
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
                        <IconTrendingUp size={16} strokeWidth={2} className="icon-inline trend-icon" />
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
              <div className="comparison-controls">
                <label>
                  Before
                  <select value={beforeSnapshot?.id || ''} onChange={(event) => setComparisonBefore(event.target.value)}>
                    {snapshots.map((snapshot) => (
                      <option key={snapshot.id} value={snapshot.id}>
                        {formatFullDateTime(snapshot.date)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  After
                  <select value={afterSnapshot?.id || ''} onChange={(event) => setComparisonAfter(event.target.value)}>
                    {snapshots.map((snapshot) => (
                      <option key={snapshot.id} value={snapshot.id}>
                        {formatFullDateTime(snapshot.date)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="card-content">
              {beforeSnapshot && afterSnapshot && (
                <div className="before-after-slider">
                  <div className="before-after-stack" aria-label="Before and after comparison">
                    <img
                      className="before-image"
                      src={beforeSnapshot.imageUrl}
                      alt="Before"
                      loading="lazy"
                      onError={(event) => {
                        const target = event.currentTarget;
                        if (target.src !== fallbackImage) {
                          target.src = fallbackImage;
                        }
                      }}
                    />
                    <div className="after-layer" style={{ width: `${compareSplit}%` }}>
                      <img
                        className="after-image"
                        src={afterSnapshot.imageUrl}
                        alt="After"
                        loading="lazy"
                        onError={(event) => {
                          const target = event.currentTarget;
                          if (target.src !== fallbackImage) {
                            target.src = fallbackImage;
                          }
                        }}
                      />
                    </div>
                    <div className="slider-handle" style={{ left: `${compareSplit}%` }}>
                      <span className="slider-percent">{compareSplit}%</span>
                    </div>
                  </div>
                  <input
                    className="compare-range"
                    type="range"
                    min={0}
                    max={100}
                    value={compareSplit}
                    onChange={(event) => setCompareSplit(Number(event.target.value))}
                    aria-label="Compare before and after"
                  />
                  <div className="compare-actions">
                    <button
                      type="button"
                      className="btn-secondary btn-reset"
                      onClick={() => setCompareSplit(50)}
                    >
                      Reset
                    </button>
                  </div>
                  <div className="compare-meta">
                    <div className="compare-item">
                      <span className="compare-label">Before</span>
                      <span className="compare-date">{formatFullDate(beforeSnapshot.date)}</span>
                      <span className="compare-score">Score: {beforeSnapshot.overallScore}</span>
                    </div>
                    <div className="compare-item">
                      <span className="compare-label">After</span>
                      <span className="compare-date">{formatFullDate(afterSnapshot.date)}</span>
                      <span className="compare-score">Score: {afterSnapshot.overallScore}</span>
                    </div>
                  </div>
                </div>
              )}
              {beforeSnapshot && afterSnapshot && (
                <div className="improvement-summary">
                  <div className="improvement-value">
                    {afterSnapshot.overallScore - beforeSnapshot.overallScore >= 0 ? '+' : ''}
                    {afterSnapshot.overallScore - beforeSnapshot.overallScore} points
                  </div>
                  <div className="improvement-label">Overall Improvement</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalTwinTimelinePage;
