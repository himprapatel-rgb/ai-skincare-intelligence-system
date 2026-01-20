import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IconDownload, IconShare2, IconTrendingUp, IconTrendingDown } from '../components/Icons';
import { getScanHistory } from '../services/scanApi';
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
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalyses, setSelectedAnalyses] = useState<[string | null, string | null]>([null, null]);
  // Loading state reserved for future API integration.

  const [allAnalysesForChart, setAllAnalysesForChart] = useState<Analysis[]>([]);

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

  const chartData = allAnalysesForChart
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(a => ({
      date: new Date(a.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      score: a.overallScore,
      acne: a.concerns.acne,
      hydration: a.concerns.hydration
    }));

  const handleExportComparison = () => {
    // TODO: Implement export functionality
    alert('Export comparison feature coming soon!');
  };

  const handleShareComparison = () => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: 'Skin Analysis Comparison',
        text: `Comparing analyses from ${analysis2?.date} to ${analysis1?.date}`,
      });
    } else {
      alert('Share feature coming soon!');
    }
  };

  const getOverallChange = () => {
    if (!analysis1 || !analysis2) return null;
    const diff = analysis1.overallScore - analysis2.overallScore;
    return { diff, improved: diff > 0 };
  };

  const overallChange = getOverallChange();

  return (
    <div className="page-container comparison-page">
      <div className="page-header comparison-header">
        <h1>Compare Analyses</h1>
        <p>Select two analyses to compare your skin progress</p>
      </div>

      <div className="card comparison-card">
        <div className="card-header"><h3>Select Analyses to Compare</h3></div>
        <div className="card-content comparison-selects">
          <div className="comparison-select">
            <label className="comparison-label">First Analysis (Newer)</label>
            <select
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
            <label className="comparison-label">Second Analysis (Older)</label>
            <select
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
          {/* Side-by-Side Image Comparison */}
          <div className="card comparison-card">
            <div className="card-header">
              <h3>Visual Comparison</h3>
              <div className="comparison-actions-header">
                <button onClick={handleShareComparison} className="btn-icon-small" title="Share">
                  <IconShare2 size={18} strokeWidth={2} />
                </button>
                <button onClick={handleExportComparison} className="btn-icon-small" title="Export">
                  <IconDownload size={18} strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className="card-content">
              <div className="comparison-images">
                <div className="comparison-image-container">
                  <img 
                    src={analysis1.imageUrl || analysis1.thumbnail} 
                    alt={`Analysis from ${analysis1.date}`}
                    className="comparison-image"
                  />
                  <div className="comparison-image-label">
                    {analysis1.date} - Score: {analysis1.overallScore}
                  </div>
                </div>
                <div className="comparison-vs-divider">VS</div>
                <div className="comparison-image-container">
                  <img 
                    src={analysis2.imageUrl || analysis2.thumbnail} 
                    alt={`Analysis from ${analysis2.date}`}
                    className="comparison-image"
                  />
                  <div className="comparison-image-label">
                    {analysis2.date} - Score: {analysis2.overallScore}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Score Summary */}
          <div className="card comparison-card">
            <div className="card-header"><h3>Overall Score Comparison</h3></div>
            <div className="card-content">
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

          {/* Timeline Chart */}
          {chartData.length > 0 && (
            <div className="card comparison-card">
              <div className="card-header"><h3>Progress Timeline</h3></div>
              <div className="card-content">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="var(--primary)" 
                      strokeWidth={3}
                      name="Overall Score"
                      dot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="hydration" 
                      stroke="var(--secondary)" 
                      strokeWidth={2}
                      name="Hydration"
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Concern Changes Table */}
          <div className="card comparison-card">
            <div className="card-header"><h3>Concern Changes</h3></div>
            <div className="card-content">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th className="comparison-th left">Concern</th>
                    <th className="comparison-th center">{analysis1.date}</th>
                    <th className="comparison-th center">{analysis2.date}</th>
                    <th className="comparison-th center">Change</th>
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
        </>
      )}

      <div className="comparison-actions">
        <Link to="/history" className="btn btn-secondary">View All History</Link>
      </div>
    </div>
  );
};

export default ComparisonPage;
