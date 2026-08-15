import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import SkinAlertCard, { SkinAlert } from '../components/clinical/SkinAlertCard';
import AlertBanner from '../components/clinical/AlertBanner';
import DermReportPreview, { DermReport } from '../components/clinical/DermReportPreview';
import { api } from '../services/api';
import styles from './ClinicalDashboardPage.module.css';

const LazyLineChart = lazy(() =>
  import('recharts').then(mod => ({ default: mod.LineChart }))
);
const LazyLine = lazy(() =>
  import('recharts').then(mod => ({ default: mod.Line }))
);
const LazyXAxis = lazy(() =>
  import('recharts').then(mod => ({ default: mod.XAxis }))
);
const LazyYAxis = lazy(() =>
  import('recharts').then(mod => ({ default: mod.YAxis }))
);
const LazyTooltip = lazy(() =>
  import('recharts').then(mod => ({ default: mod.Tooltip }))
);
const LazyResponsiveContainer = lazy(() =>
  import('recharts').then(mod => ({ default: mod.ResponsiveContainer }))
);
const LazyCartesianGrid = lazy(() =>
  import('recharts').then(mod => ({ default: mod.CartesianGrid }))
);

interface TrendDataPoint {
  date: string;
  score: number;
}

type TrendRange = '30d' | '60d' | '90d';

const ClinicalDashboardPage: React.FC = () => {
  const [trendRange, setTrendRange] = useState<TrendRange>('30d');
  const [alerts, setAlerts] = useState<SkinAlert[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [report, setReport] = useState<DermReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);

  // Fetch trend data when range changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoadingTrends(true);
        const days = parseInt(trendRange);
        const { data } = await api.get(`/clinical/trends?days=${days}`);
        if (cancelled) return;
        // Normalize response — backend may return { data_points, insights } or { scores }
        const points: TrendDataPoint[] = [];
        if (data.data_points && Array.isArray(data.data_points)) {
          data.data_points.forEach((p: { date?: string; overall_score?: number; score?: number }) => {
            if (p.date) points.push({ date: p.date, score: p.overall_score ?? p.score ?? 0 });
          });
        } else if (data.scores && Array.isArray(data.scores)) {
          data.scores.forEach((p: { date?: string; score?: number }) => {
            if (p.date) points.push({ date: p.date, score: p.score ?? 0 });
          });
        }
        setTrendData(points);
      } catch {
        if (!cancelled) setTrendData([]);
      } finally {
        if (!cancelled) setIsLoadingTrends(false);
      }
    })();
    return () => { cancelled = true; };
  }, [trendRange]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoadingAlerts(true);
        const { data } = await api.get('/clinical/alerts');
        if (!cancelled) setAlerts(data);
      } catch {
        if (!cancelled) setAlerts([]);
      } finally {
        if (!cancelled) setIsLoadingAlerts(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleDismiss = useCallback(async (id: number) => {
    try {
      await api.post(`/clinical/alerts/${id}/dismiss`);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_dismissed: true } : a))
      );
    } catch {
      // Optimistic dismiss even if API fails
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_dismissed: true } : a))
      );
    }
  }, []);

  const handleGenerateReport = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);
      // Use latest scan ID if available; fallback to generating without specific scan
      const { data: scanData } = await api.get('/scan/history?limit=1').catch(() => ({ data: { data: [] } }));
      const scanId = scanData?.data?.[0]?.scan_id;
      if (!scanId) { setError('No scan available to generate report'); return; }
      const { data } = await api.get(`/clinical/report/${scanId}`);
      setReport(data);
      setShowReport(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate report';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleShareReport = useCallback(() => {
    if (report) {
      const url = `${window.location.origin}/clinical/report/${report.id}`;
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }, [report]);

  const handleDownloadReport = useCallback(() => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `derm-report-${report.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [report]);

  const activeAlerts = alerts.filter((a) => !a.is_dismissed);

  return (
    <div className={styles.page}>
      <header className="app-header-card">
        <h1>Clinical Dashboard</h1>
        <p className="app-header-subtitle">Monitor your skin health metrics and clinical insights</p>
      </header>

      <AlertBanner alerts={activeAlerts} onDismiss={handleDismiss} />

      <div className={styles.container}>
        <header className={styles.header}>
          <div></div>
          <button
            className={styles.generateBtn}
            onClick={handleGenerateReport}
            disabled={isGenerating}
            type="button"
          >
            {isGenerating ? (
              <>
                <span className={styles.spinner} />
                Generating...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Generate Derm Report
              </>
            )}
          </button>
        </header>

        {error && (
          <div className={styles.errorBanner}>
            <span>{error}</span>
            <button onClick={() => setError(null)} className={styles.errorClose} type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Report Preview Modal */}
        {showReport && report && (
          <div className={styles.reportOverlay}>
            <div className={styles.reportModal}>
              <button
                className={styles.reportClose}
                onClick={() => setShowReport(false)}
                type="button"
                aria-label="Close report"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <DermReportPreview
                report={report}
                onShare={handleShareReport}
                onDownload={handleDownloadReport}
              />
            </div>
          </div>
        )}

        {/* Skin Health Score Trend */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Skin Health Score Trend</h2>
            <div className={styles.rangeTabs}>
              {(['30d', '60d', '90d'] as TrendRange[]).map((range) => (
                <button
                  key={range}
                  className={`${styles.rangeTab} ${trendRange === range ? styles.rangeTabActive : ''}`}
                  onClick={() => setTrendRange(range)}
                  type="button"
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.chartArea}>
            {isLoadingTrends ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner} />
                <p>Loading trends...</p>
              </div>
            ) : trendData.length < 2 ? (
              <div className={styles.placeholderContent}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <p>Need at least 2 scans to show trends. Complete more scans to see your progress.</p>
              </div>
            ) : (
              <Suspense fallback={<div className={styles.loadingState}><div className={styles.spinner} /><p>Loading chart...</p></div>}>
                <LazyResponsiveContainer width="100%" height={280}>
                  <LazyLineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <LazyCartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e4e9ef)" />
                    <LazyXAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--text-muted, #7a8ca0)" />
                    <LazyYAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--text-muted, #7a8ca0)" />
                    <LazyTooltip />
                    <LazyLine type="monotone" dataKey="score" stroke="var(--primary, #1f5fbf)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Skin Score" />
                  </LazyLineChart>
                </LazyResponsiveContainer>
              </Suspense>
            )}
          </div>
        </section>

        {/* Active Alerts */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Active Alerts
            {activeAlerts.length > 0 && (
              <span className={styles.alertCount}>{activeAlerts.length}</span>
            )}
          </h2>
          {isLoadingAlerts ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Loading alerts...</p>
            </div>
          ) : activeAlerts.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p>No active alerts. Your skin health looks great!</p>
            </div>
          ) : (
            <div className={styles.alertGrid}>
              {activeAlerts.map((alert) => (
                <SkinAlertCard
                  key={alert.id}
                  alert={alert}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          )}
        </section>

        {/* Bottom grid: Environmental + Product Effectiveness */}
        <div className={styles.dualGrid}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Environmental Correlations</h2>
            <div className={styles.chartPlaceholder}>
              <div className={styles.placeholderContent}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                </svg>
                <p>UV, humidity, pollution impact chart</p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Product Effectiveness</h2>
            <div className={styles.chartPlaceholder}>
              <div className={styles.placeholderContent}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <p>Product effectiveness ratings</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ClinicalDashboardPage;
