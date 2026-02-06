import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/digital-twin/HeroSection';
import StatsCards from '../components/digital-twin/StatsCards';
import ProgressChart from '../components/digital-twin/ProgressChart';
import TimelineSnapshots from '../components/digital-twin/TimelineSnapshots';
import SnapshotDetails from '../components/digital-twin/SnapshotDetails';
import BeforeAfterCircle from '../components/digital-twin/BeforeAfterCircle';
import SimulationPanel from '../components/digital-twin/SimulationPanel';
import { SkeletonDigitalTwin } from '../components/Skeleton';
import { usePageTitle } from '../hooks/usePageTitle';
import { API_BASE_URL } from '../config';
import { api } from '../services/api';
import '../components/digital-twin/styles/digital-twin.css';

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
  usePageTitle('Digital Twin');
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
  const apiBase = API_BASE_URL;
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
  const [refreshKey, setRefreshKey] = useState(0);

  const FETCH_TIMEOUT_MS = 15000;

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const API_BASE = apiBase;
        const token = localStorage.getItem('auth_token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const response = await fetch(`${API_BASE}/digital-twin/query?limit=200`, {
          signal: controller.signal,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        clearTimeout(timeoutId);
        if (response.status === 401) {
          setHasError(true);
          setSnapshots([]);
          setInsights(null);
          setIsLoading(false);
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to load digital twin timeline');
        }
        let data: { snapshots?: ApiSnapshot[]; timeline?: { summary_insights?: ApiInsights }; insights?: ApiInsights };
        try {
          data = await response.json();
        } catch {
          throw new Error('Invalid response from server');
        }
        if (!data || typeof data !== 'object') {
          data = { snapshots: [] };
        }
        const apiSnapshots: ApiSnapshot[] = Array.isArray(data.snapshots) ? data.snapshots : [];
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load and refreshKey
  }, [refreshKey]);

  const handleDeleteSnapshot = async (snapshotId: string) => {
    if (!window.confirm('Are you sure you want to delete this snapshot? It will be removed from your history.')) return;
    try {
      await api.delete(`/scan/${snapshotId}`);
      setSelectedSnapshot(null);
      setComparisonBefore(null);
      setComparisonAfter(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Failed to delete snapshot:', err);
      alert('Failed to delete snapshot. Please try again.');
    }
  };

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
  const chartTooltipLabel = (label: string | number, payload: ReadonlyArray<{ payload?: { fullLabel?: string } }>) => {
    if (payload?.[0]?.payload?.fullLabel) return payload[0].payload.fullLabel;
    return String(label);
  };

  if (isLoading) {
    return <SkeletonDigitalTwin />;
  }

  if (hasError) {
    return (
      <div className="dt-page app-page dt-page--guest">
        <header className="app-header-card">
          <h1>Digital Twin</h1>
          <p className="app-header-subtitle">Visualize your skin transformation over time</p>
        </header>
        <div className="app-page-content dt-container dt-guest-content">
          <section className="dt-card dt-guest-card">
            <h2 className="dt-guest-heading">What is Digital Twin?</h2>
            <p className="dt-guest-desc">
              Your Digital Twin tracks skin scores, concerns, and progress across scans. See trends, compare before/after, and run &quot;what-if&quot; simulations.
            </p>
            <ul className="dt-guest-features">
              <li>Score and trend chart over time</li>
              <li>Before/after snapshot comparison</li>
              <li>Top concerns and improvements</li>
              <li>Simulate impact of routines</li>
            </ul>
            <p className="dt-guest-hint">Sign in to load your timeline, or try again if you're already signed in.</p>
            <div className="dt-card-body dt-guest-actions">
              <button type="button" className="btn btn-primary" onClick={() => navigate('/auth')}>
                Log in to access
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setRefreshKey((k) => k + 1)}>
                Try again
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="dt-page app-page">
        <header className="app-header-card">
          <h1>Your Digital Skin Twin</h1>
          <p className="app-header-subtitle">See how your skin changes over time with AI-powered tracking</p>
        </header>
        <div className="app-page-content dt-container">
          <section className="dt-card digital-twin-preview">
            <div className="digital-twin-preview-features">
              <div className="dt-preview-feature">
                <span className="dt-preview-feature-icon" aria-hidden>📈</span>
                <span>Track improvements</span>
              </div>
              <div className="dt-preview-feature">
                <span className="dt-preview-feature-icon" aria-hidden>🎯</span>
                <span>Set skin goals</span>
              </div>
              <div className="dt-preview-feature">
                <span className="dt-preview-feature-icon" aria-hidden>📅</span>
                <span>Weekly check-ins</span>
              </div>
            </div>
            <p className="dt-preview-desc">
              Your Digital Twin tracks skin scores, concerns, and progress across scans. See trends, compare before/after, and run &quot;what-if&quot; simulations.
            </p>
            <div className="dt-card-body dt-guest-actions">
              <button type="button" className="btn btn-primary" onClick={() => navigate('/scan')}>
                Create Your Digital Twin
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="dt-page app-page">
      <div className="app-page-content dt-container">
        <HeroSection
          currentScore={latestSnapshot?.overallScore ?? 0}
          skinMood={latestSnapshot?.skinMoodLabel ?? 'Unknown'}
          totalSnapshots={snapshots.length}
        />
        <StatsCards
          stats={{
            trend: formatTrendLabel(insights?.trend),
            topConcerns: latestSnapshot?.topConcerns?.join(', ') || '—',
            bestImprovement: insights?.best_improvement || '—',
            topConcern: insights?.top_concern || '—',
          }}
        />
        <ProgressChart
          chartData={chartData}
          dateRange={dateRange}
          onRangeChange={setDateRange}
          tooltipLabel={chartTooltipLabel}
        />
        <TimelineSnapshots
          snapshots={snapshots}
          selectedId={selectedSnapshot}
          onSelect={setSelectedSnapshot}
          onTakeNew={() => navigate('/scan')}
          formatDate={formatFullDate}
        />
        {selectedData && (
          <SnapshotDetails 
            snapshot={selectedData} 
            formatDate={formatFullDate}
            onDelete={snapshots.length > 1 ? () => handleDeleteSnapshot(selectedData.id) : undefined}
          />
        )}
        {snapshots.length >= 2 && (
          <BeforeAfterCircle
            snapshots={snapshots}
            beforeSnapshot={beforeSnapshot}
            afterSnapshot={afterSnapshot}
            compareSplit={compareSplit}
            onBeforeChange={setComparisonBefore}
            onAfterChange={setComparisonAfter}
            onSplitChange={setCompareSplit}
            formatDate={formatFullDate}
            formatDateTime={formatFullDateTime}
          />
        )}
        
        {/* What-If Simulation */}
        <SimulationPanel />
      </div>
    </div>
  );
};

export default DigitalTwinTimelinePage;
