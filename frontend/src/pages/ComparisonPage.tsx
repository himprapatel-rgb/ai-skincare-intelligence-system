import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { IconDownload, IconShare2, IconTrendingUp, IconTrendingDown } from '../components/Icons';
import LazyImage from '../components/LazyImage';
import { getScanHistory } from '../services/scanApi';
import { usePageTitle } from '../hooks/usePageTitle';
import './CommonStyles.css';
import './ComparisonPage.css';

interface Analysis {
  id: string;
  date: string;
  thumbnail: string;
  imageUrl?: string;
  skinType: string;
  overallScore: number;
  concerns: {
    acne: number;
    wrinkles: number;
    darkSpots: number;
    hydration: number;
    redness: number;
  };
}

/**
 * Comparison Page (US-205)
 * Compare two skin analyses side-by-side to track improvement
 */
const ComparisonPage: React.FC = () => {
  usePageTitle('Compare Analyses');
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalyses, setSelectedAnalyses] = useState<[string | null, string | null]>([null, null]);
  // Loading state reserved for future API integration.

  const [allAnalysesForChart, setAllAnalysesForChart] = useState<Analysis[]>([]);
  const [rechartsModule, setRechartsModule] = useState<typeof import('recharts') | null>(null);
  const comparisonCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const historyData = await getScanHistory();
        const scans = (historyData as { scans?: Array<Record<string, unknown>> }).scans || [];

        const mapped = scans.map((scan) => {
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

          return {
            id: String(scan.scan_id || ''),
            date: String(scan.created_at || ''),
            thumbnail: typeof scan.image_url === 'string' ? scan.image_url : '/placeholder.jpg',
            imageUrl: typeof scan.image_url === 'string' ? scan.image_url : undefined,
            skinType: typeof summary.skin_type === 'string' ? summary.skin_type : 'Unknown',
            overallScore: typeof summary.overall_score === 'number' ? Math.round(summary.overall_score) : 0,
            concerns: {
              acne: getScore(['acne', 'hd_acne']),
              wrinkles: getScore(['wrinkle', 'hd_wrinkle']),
              darkSpots: getScore(['age_spot', 'hd_age_spot']),
              hydration: getScore(['moisture', 'hd_moisture']),
              redness: getScore(['redness', 'hd_redness']),
            },
          } as Analysis;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setAnalyses(mapped);
        setAllAnalysesForChart(mapped);
      } catch (error) {
        console.error('Failed to load analyses:', error);
        setAnalyses([]);
        setAllAnalysesForChart([]);
      }
    };

    fetchAnalyses();
  }, []);

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

  const getComparison = (key: keyof Analysis['concerns']) => {
    if (!selectedAnalyses[0] || !selectedAnalyses[1]) return null;
    const analysis1 = analyses.find(a => a.id === selectedAnalyses[0]);
    const analysis2 = analyses.find(a => a.id === selectedAnalyses[1]);
    if (!analysis1 || !analysis2) return null;
    const diff = analysis1.concerns[key] - analysis2.concerns[key];
    return { diff, improved: diff < 0 };
  };

  const renderComparisonIndicator = (key: keyof Analysis['concerns']) => {
    const comparison = getComparison(key);
    if (!comparison) return null;
    const { diff, improved } = comparison;
    return (
      <span className={`comparison-delta ${improved ? 'improved' : 'declined'}`}>
        {improved ? (
          <>
            <IconTrendingDown size={14} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
            {Math.abs(diff)}%
          </>
        ) : (
          <>
            <IconTrendingUp size={14} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
            {Math.abs(diff)}%
          </>
        )}
      </span>
    );
  };

  const analysis1 = analyses.find(a => a.id === selectedAnalyses[0]);
  const analysis2 = analyses.find(a => a.id === selectedAnalyses[1]);

  const chartData = useMemo(
    () => [...allAnalysesForChart]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(a => ({
        date: new Date(a.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        score: a.overallScore,
        acne: a.concerns.acne,
        hydration: a.concerns.hydration
      })),
    [allAnalysesForChart]
  );

  const handleExportComparison = async () => {
    const el = comparisonCardRef.current;
    if (!el) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(el, { useCORS: true, scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `skin-comparison-${analysis1?.date || '1'}-vs-${analysis2?.date || '2'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
  };

  const handleShareComparison = async () => {
    const title = 'Skin Analysis Comparison';
    const text = analysis1 && analysis2
      ? `Comparing analyses from ${analysis2.date} to ${analysis1.date}. Overall: ${analysis1.overallScore} vs ${analysis2.overallScore}`
      : 'My skin analysis comparison';
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
        alert('Link copied to clipboard.');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(url).catch(() => {});
        alert('Link copied to clipboard.');
      }
    }
  };

  const getOverallChange = () => {
    if (!analysis1 || !analysis2) return null;
    const diff = analysis1.overallScore - analysis2.overallScore;
    return { diff, improved: diff > 0 };
  };

  const overallChange = getOverallChange();

  return (
    <div className="comparison-page app-page">
      <header className="app-header-card">
        <h1>Compare analyses</h1>
        <p className="app-header-subtitle">Pick two scans to see how your skin has changed</p>
      </header>
      <div className="app-page-content">
      <div className="app-card comparison-card">
        <h3 className="comparison-card-title">Select two analyses</h3>
        <div className="comparison-selects">
          <div className="comparison-select">
            <label className="comparison-label" htmlFor="comparison-first">First Analysis (Newer)</label>
            <select
              id="comparison-first"
              value={selectedAnalyses[0] || ''}
              onChange={(e) => setSelectedAnalyses([e.target.value, selectedAnalyses[1]])}
              className="comparison-input"
            >
              <option value="">Select analysis...</option>
              {analyses.map(a => (
                <option key={a.id} value={a.id}>{a.date} - Score: {a.overallScore}</option>
              ))}
            </select>
          </div>
          <div className="comparison-select">
            <label className="comparison-label" htmlFor="comparison-second">Second Analysis (Older)</label>
            <select
              id="comparison-second"
              value={selectedAnalyses[1] || ''}
              onChange={(e) => setSelectedAnalyses([selectedAnalyses[0], e.target.value])}
              className="comparison-input"
            >
              <option value="">Select analysis...</option>
              {analyses.map(a => (
                <option key={a.id} value={a.id}>{a.date} - Score: {a.overallScore}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {analysis1 && analysis2 && (
        <>
          <div className="comparison-duo">
            <div className="app-card comparison-card" ref={comparisonCardRef}>
              <div className="comparison-card-header-row">
                <h3>Visual comparison</h3>
                <div className="comparison-actions-header">
                  <button onClick={handleShareComparison} className="btn-icon-small" title="Share">
                    <IconShare2 size={18} strokeWidth={2} />
                  </button>
                  <button onClick={handleExportComparison} className="btn-icon-small" title="Export">
                    <IconDownload size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>
              <div className="comparison-images">
                <div className="comparison-image-container">
                  <LazyImage
                    src={analysis1.imageUrl || analysis1.thumbnail}
                    alt={`Analysis from ${analysis1.date}`}
                    className="comparison-image"
                    objectFit="cover"
                  />
                  <div className="comparison-image-label">
                    {analysis1.date} - Score: {analysis1.overallScore}
                  </div>
                </div>
                <div className="comparison-vs-divider">VS</div>
                <div className="comparison-image-container">
                  <LazyImage
                    src={analysis2.imageUrl || analysis2.thumbnail}
                    alt={`Analysis from ${analysis2.date}`}
                    className="comparison-image"
                    objectFit="cover"
                  />
                  <div className="comparison-image-label">
                    {analysis2.date} - Score: {analysis2.overallScore}
                  </div>
                </div>
              </div>
            </div>

            <div className="app-card comparison-card">
              <h3 className="comparison-card-title">Overall score</h3>
              <div>
                <div className="comparison-summary">
                  <div className="comparison-score-card">
                    <div className="comparison-score-date">{analysis1.date}</div>
                    <div className="comparison-score-value primary">
                      {analysis1.overallScore}
                    </div>
                    <div className="comparison-score-label">Current Score</div>
                  </div>
                  {overallChange && (
                    <div className="comparison-score-card change-indicator">
                      <div className="comparison-score-date">Change</div>
                      <div className={`comparison-score-value ${overallChange.improved ? 'improved' : 'declined'}`}>
                        {overallChange.improved ? (
                          <IconTrendingUp size={32} strokeWidth={2} />
                        ) : (
                          <IconTrendingDown size={32} strokeWidth={2} />
                        )}
                        <span style={{ marginLeft: '8px' }}>
                          {overallChange.improved ? '+' : ''}{overallChange.diff}
                        </span>
                      </div>
                      <div className="comparison-score-label">
                        {overallChange.improved ? 'Improved' : 'Declined'}
                      </div>
                    </div>
                  )}
                  <div className="comparison-score-card">
                    <div className="comparison-score-date">{analysis2.date}</div>
                    <div className="comparison-score-value muted">
                      {analysis2.overallScore}
                    </div>
                    <div className="comparison-score-label">Previous Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="app-card comparison-card">
              <h3 className="comparison-card-title">Progress timeline</h3>
              <div>
                {rechartsModule ? (
                  <rechartsModule.ResponsiveContainer width="100%" height={300}>
                    <rechartsModule.LineChart data={chartData}>
                      <rechartsModule.CartesianGrid strokeDasharray="3 3" />
                      <rechartsModule.XAxis dataKey="date" />
                      <rechartsModule.YAxis domain={[0, 100]} />
                      <rechartsModule.Tooltip />
                      <rechartsModule.Legend />
                      <rechartsModule.Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="var(--primary)" 
                        strokeWidth={3}
                        name="Overall Score"
                        dot={{ r: 6 }}
                      />
                      <rechartsModule.Line 
                        type="monotone" 
                        dataKey="hydration" 
                        stroke="var(--secondary)" 
                        strokeWidth={2}
                        name="Hydration"
                        strokeDasharray="5 5"
                      />
                    </rechartsModule.LineChart>
                  </rechartsModule.ResponsiveContainer>
                ) : (
                  <div className="comparison-chart-placeholder">
                    Loading chart…
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Concern Changes Table */}
          <div className="card comparison-card">
            <div className="card-header"><h3>Concern Changes</h3></div>
            <div className="card-content">
              <div className="comparison-table-wrapper">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th scope="col" className="comparison-th left">Concern</th>
                    <th scope="col" className="comparison-th center">{analysis1.date}</th>
                    <th scope="col" className="comparison-th center">{analysis2.date}</th>
                    <th scope="col" className="comparison-th center">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {(['acne', 'wrinkles', 'darkSpots', 'hydration', 'redness'] as const).map(concern => (
                    <tr key={concern}>
                      <td className="comparison-td capitalize">
                        {concern.replace(/([A-Z])/g, ' $1')}
                      </td>
                      <td className="comparison-td center">{analysis1.concerns[concern]}%</td>
                      <td className="comparison-td center">{analysis2.concerns[concern]}%</td>
                      <td className="comparison-td center">{renderComparisonIndicator(concern)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="comparison-actions">
        <Link to="/history" className="btn btn-secondary">View all history</Link>
      </div>
      </div>
    </div>
  );
};

export default ComparisonPage;
