import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { IconScan, IconHome, IconCheck, IconAlertTriangle, IconArrowLeft, IconCopy, IconShare2, IconBrandX, IconHeart, IconDownload, IconShoppingCart, getSkinConcernIcon } from '../components/Icons';
import { BreadcrumbJsonLd } from '../components/BreadcrumbJsonLd';
import { SkeletonAnalysis } from '../components/Skeleton';
import { getScanHistory, getScanResult } from '../services/scanApi';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { API_BASE_URL } from '../config';
import './AnalysisResults.css';

interface SkinAnalysis {
  id: string;
  userId: string;
  skinType: string;
  concerns: string[];
  severity: Record<string, number>;
  confidence: number;
  imageUrl: string;
  timestamp: string;
  recommendations?: string[];
}

type ScanHistoryItem = {
  scan_id: string;
  status: string;
  created_at?: string | null;
};

const AnalysisResults: React.FC = () => {
  usePageTitle('Skin Analysis Results', 'View your skin analysis score, concerns, and personalized recommendations.');
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [previousScans, setPreviousScans] = useState<ScanHistoryItem[]>([]);
  const [savedToFavorites, setSavedToFavorites] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'image' | null>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const apiBase = API_BASE_URL;
  const apiOrigin = apiBase.replace(/\/api\/v1\/?$/, '');
  const buildScanImageUrl = (scanId?: string) => (scanId ? `${apiOrigin}/api/v1/scan/${scanId}/image` : '');

  const buildAnalysisFromScan = useCallback((scanResult: Record<string, unknown>): SkinAnalysis => {
    type Summary = {
      overall_score?: number;
      scores?: Record<string, number>;
      concerns?: string[];
      image_url?: string;
    };

    const result = (scanResult as { result?: Record<string, unknown> }).result || {};
    const analysis = (result as { analysis?: Record<string, unknown> }).analysis || {};
    const summary = ((result as { summary?: Summary }).summary || (analysis as { summary?: Summary }).summary || {}) as Summary;

    const scores: Record<string, number> = {};
    const concerns: string[] = [];
    let overallScore: number | null = typeof summary.overall_score === 'number' ? summary.overall_score : null;
    const imageUrl: string | null =
      typeof summary.image_url === 'string'
        ? summary.image_url
        : typeof (result as { image_url?: string }).image_url === 'string'
        ? (result as { image_url?: string }).image_url || null
        : null;
    const resolvedImageUrl = imageUrl || buildScanImageUrl(analysisId);

    if (summary.scores && typeof summary.scores === 'object') {
      Object.entries(summary.scores).forEach(([key, value]) => {
        if (typeof value === 'number') scores[key] = value;
      });
    }

    if (Array.isArray(summary.concerns)) {
      summary.concerns.forEach((value: string) => {
        if (typeof value === 'string') concerns.push(value);
      });
    }

    if (!overallScore && Object.keys(scores).length > 0) {
      const values = Object.values(scores);
      overallScore = values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    const recommendations =
      (result as { recommendations?: string[] }).recommendations ||
      (analysis as { recommendations?: string[] }).recommendations ||
      [];

    const rawSkinType =
      (summary as { skin_type?: string }).skin_type ||
      (analysis as { skin_type?: string }).skin_type ||
      (result as { skin_type?: string }).skin_type;
    const skinType = typeof rawSkinType === 'string' && rawSkinType.trim()
      ? rawSkinType.trim()
      : 'Unknown';

    return {
      id: analysisId || 'unknown',
      userId: '',
      skinType,
      concerns,
      severity: Object.fromEntries(
        Object.entries(scores).map(([key, value]) => [key, Math.round(value)])
      ),
      confidence: overallScore ? Math.round(overallScore) : 0,
      imageUrl: resolvedImageUrl || '',
      timestamp: String((scanResult as { created_at?: string }).created_at || new Date().toISOString()),
      recommendations,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- buildScanImageUrl is stable
  }, [analysisId]);

  const fetchAnalysisResults = useCallback(async () => {
    try {
      setLoading(true);
      if (!analysisId) {
        throw new Error('Missing scan id');
      }

      const scanResult = await getScanResult(analysisId);
      const status = typeof (scanResult as { status?: string }).status === 'string'
        ? String((scanResult as { status?: string }).status)
        : null;
      if (status === 'failed') {
        const message = (scanResult as { message?: string; detail?: string }).message
          || (scanResult as { message?: string; detail?: string }).detail
          || 'Scan failed. Please retry with a clear, well-lit selfie.';
        setFailureMessage(message);
      } else {
        setFailureMessage(null);
      }
      const mapped = buildAnalysisFromScan(scanResult as Record<string, unknown>);
      if (!status && mapped.confidence === 0 && mapped.concerns.length === 0 && Object.keys(mapped.severity).length === 0) {
        setFailureMessage('No analysis data returned. Please retry the scan with a clear, front-facing selfie.');
      }
      setAnalysis(mapped);

      const historyData = await getScanHistory();
      const scans = (historyData as { scans?: ScanHistoryItem[] }).scans || [];
      setPreviousScans(scans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [analysisId, buildAnalysisFromScan]);

  useEffect(() => {
    fetchAnalysisResults();
  }, [fetchAnalysisResults]);

  useEffect(() => {
    if (!analysisId) return;
    try {
      const list = JSON.parse(localStorage.getItem('favorite_analyses') || '[]');
      setSavedToFavorites(Array.isArray(list) && list.includes(analysisId));
    } catch {
      setSavedToFavorites(false);
    }
  }, [analysisId]);

  const toggleSaveAnalysis = () => {
    if (!analysisId) return;
    try {
      const list: string[] = JSON.parse(localStorage.getItem('favorite_analyses') || '[]');
      const next = list.includes(analysisId)
        ? list.filter((id) => id !== analysisId)
        : [...list, analysisId];
      localStorage.setItem('favorite_analyses', JSON.stringify(next));
      setSavedToFavorites(next.includes(analysisId));
      toast.success(next.includes(analysisId) ? 'Analysis saved to favorites' : 'Removed from favorites');
    } catch {
      toast.error('Could not save');
    }
  };

  const captureForExport = useCallback(() => {
    const el = exportContainerRef.current;
    if (!el) return null;
    return html2canvas(el, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      ignoreElements: (element) =>
        element.classList.contains('results-header-actions') ||
        element.classList.contains('results-actions') ||
        element.classList.contains('sr-only'),
    });
  }, []);

  const exportAsImage = useCallback(async () => {
    setExporting('image');
    try {
      const canvas = await captureForExport();
      if (!canvas) {
        toast.error('Could not capture results');
        return;
      }
      const link = document.createElement('a');
      link.download = `skin-analysis-${analysisId ?? 'results'}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Image downloaded');
    } catch {
      toast.error('Could not export image');
    } finally {
      setExporting(null);
    }
  }, [analysisId, captureForExport, toast]);

  const exportAsPdf = useCallback(async () => {
    setExporting('pdf');
    try {
      const canvas = await captureForExport();
      if (!canvas) {
        toast.error('Could not capture results');
        return;
      }
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const scale = Math.min(pageW / canvas.width, pageH / canvas.height);
      const w = canvas.width * scale;
      const h = canvas.height * scale;
      pdf.addImage(imgData, 'PNG', 0, 0, w, h);
      pdf.save(`skin-analysis-${analysisId ?? 'results'}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Could not export PDF');
    } finally {
      setExporting(null);
    }
  }, [analysisId, captureForExport, toast]);

  const getSeverityColor = (severity: number): string => {
    if (severity >= 80) return 'severity-severe';
    if (severity >= 60) return 'severity-high';
    if (severity >= 40) return 'severity-medium';
    if (severity >= 20) return 'severity-low';
    return 'severity-clear';
  };

  const getSeverityLabel = (severity: number): string => {
    if (severity >= 80) return 'Severe';
    if (severity >= 60) return 'Moderate';
    if (severity >= 40) return 'Mild';
    if (severity >= 20) return 'Light';
    return 'Clear';
  };

  /** Tooltip text for severity levels (Task 215) */
  const getSeverityTooltip = (severity: number): string => {
    if (severity >= 80) return 'Severe (80–100%): Highly visible; consider professional advice if persistent.';
    if (severity >= 60) return 'Moderate (60–79%): Noticeable; consistent routine may help.';
    if (severity >= 40) return 'Mild (40–59%): Some visibility; good candidate for at-home care.';
    if (severity >= 20) return 'Light (20–39%): Slight; maintenance and prevention recommended.';
    return 'Clear (0–19%): Minimal or none detected; keep up your routine.';
  };

  /** Format metric key for display: dark_circles → Dark Circles */
  const formatMetricName = (key: string): string =>
    key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  /** Confidence interpretation for accessibility */
  const getConfidenceInterpretation = (pct: number): string => {
    if (pct >= 80) return 'Excellent – High image quality and analysis certainty';
    if (pct >= 60) return 'Good – Reliable results; minor lighting variations may affect precision';
    if (pct >= 40) return 'Fair – Consider retaking with better lighting for improved accuracy';
    return 'Low – Retake with clearer, front-facing photo for better analysis';
  };

  if (loading) {
    return (
      <div className="app-page">
        <SkeletonAnalysis />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="analysis-results app-page">
        <header className="app-header-card">
          <h1>Skin Analysis</h1>
          <p className="app-header-subtitle">We couldn&apos;t load this analysis</p>
        </header>
        <div className="app-page-content">
          <div className="analysis-error">
            <div className="analysis-error-icon">
              <IconAlertTriangle size={48} strokeWidth={2} />
            </div>
            <h2>Analysis unavailable</h2>
            <p>{error || 'This analysis may have been removed or the link is invalid.'}</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-results app-page">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Skin Analysis Results', path: `/analysis/${analysisId}` },
        ]}
      />
      <div className="results-container">
        <header className="results-header app-header-card">
          <div>
            <h1>Skin Analysis Results</h1>
            <p className="app-header-subtitle">
              Analysis Date: {new Date(analysis.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="results-header-actions">
            <div className="results-share-wrap">
              <span className="results-share-label">Share your results</span>
              <button
                type="button"
                className="results-copy-link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard');
                  } catch {
                    toast.error('Could not copy link');
                  }
                }}
                title="Copy link to this analysis"
                aria-label="Copy link to share this analysis"
              >
                <IconCopy size={16} strokeWidth={2} />
                Copy link
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out my skin analysis')}&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="results-share-social results-share-x"
                title="Share on X (Twitter)"
                aria-label="Share on X (Twitter)"
              >
                <IconBrandX size={16} />
                Share on X
              </a>
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  type="button"
                  className="results-copy-link results-share-native"
                  onClick={async () => {
                    try {
                      await navigator.share({
                        title: 'Skin Analysis Results',
                        text: 'Check out my skin analysis',
                        url: window.location.href,
                      });
                      toast.success('Shared successfully');
                    } catch (err) {
                      if ((err as Error).name !== 'AbortError') {
                        toast.error('Could not share');
                      }
                    }
                  }}
                  title="Share via device options"
                  aria-label="Share via device options"
                >
                  <IconShare2 size={16} strokeWidth={2} />
                  Share
                </button>
              )}
            </div>
            <div className="results-export-wrap">
              <button
                type="button"
                className="results-copy-link results-export-btn"
                onClick={exportAsPdf}
                disabled={!!exporting}
                title="Export analysis as PDF"
                aria-label="Export analysis as PDF"
              >
                <IconDownload size={16} strokeWidth={2} />
                {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
              </button>
              <button
                type="button"
                className="results-copy-link results-export-btn"
                onClick={exportAsImage}
                disabled={!!exporting}
                title="Export analysis as image"
                aria-label="Export analysis as image"
              >
                <IconDownload size={16} strokeWidth={2} />
                {exporting === 'image' ? 'Exporting…' : 'Image'}
              </button>
            </div>
            <button
              type="button"
              className={`results-save-analysis ${savedToFavorites ? 'saved' : ''}`}
              onClick={toggleSaveAnalysis}
              title={savedToFavorites ? 'Saved to favorites' : 'Save analysis to favorites'}
              aria-label={savedToFavorites ? 'Remove from favorites' : 'Save analysis to favorites'}
            >
              <IconHeart size={16} strokeWidth={2} fill={savedToFavorites ? 'currentColor' : 'none'} />
              {savedToFavorites ? 'Saved' : 'Save analysis'}
            </button>
            <button onClick={() => navigate('/')} className="results-back">
              <IconArrowLeft size={16} strokeWidth={2} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Back to Dashboard
            </button>
          </div>
        </header>
        <div className="app-page-content">
        <p className="analysis-legal-disclaimer" role="note">
          For informational use only. Not a medical device. See a dermatologist for medical advice.
        </p>

        {failureMessage && (
          <div className="analysis-inline-warning">
            <IconAlertTriangle size={24} strokeWidth={2} />
            <div>
              <h3>Scan failed</h3>
              <p>{failureMessage}</p>
              <button onClick={() => navigate('/scan')} className="btn btn-primary">
                Retry Scan
              </button>
            </div>
          </div>
        )}

        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Analysis complete. Confidence score {analysis.confidence} percent. {analysis.concerns.length > 0
            ? `Concerns: ${analysis.concerns.join(', ')}.`
            : 'No concerns detected.'}
        </div>

        <div className="confidence-row" role="group" aria-labelledby="confidence-label">
          <span id="confidence-label">Confidence Score:</span>
          <div className="confidence-bar" aria-hidden>
            <div className="confidence-fill" style={{ width: `${analysis.confidence}%` }}></div>
          </div>
          <span className="confidence-value">{analysis.confidence}%</span>
          <span className="confidence-interpretation" title={getConfidenceInterpretation(analysis.confidence)}>
            {getConfidenceInterpretation(analysis.confidence)}
          </span>
        </div>

        <div className="results-grid">
          <div className="result-card">
            <h2>Analyzed Image</h2>
            <div className="analysis-image">
              {analysis.imageUrl ? (
                <img
                  src={analysis.imageUrl}
                  alt="Skin analysis"
                  loading="lazy"
                  width={400}
                  height={300}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling;
                    if (fallback instanceof HTMLElement) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="analysis-image-fallback"
                style={{ display: analysis.imageUrl ? 'none' : 'flex' }}
              >
                <IconScan size={32} strokeWidth={2} />
                <div>
                  <strong>{failureMessage ? 'No image available' : 'Image processed but not stored'}</strong>
                  <span>{failureMessage ? 'We do not store images when scans fail.' : 'Your analysis is complete, but the image was not saved.'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="result-card">
            <h2>Overview</h2>
            <div className="overview-section">
              <h3>Skin Type</h3>
              <div className="skin-type-badge">{analysis.skinType}</div>
            </div>
            <div className="overview-section">
              <h3>Identified Concerns</h3>
              <div className="concern-tags">
                {analysis.concerns.length > 0 ? (
                  analysis.concerns.map((concern, index) => (
                    <span key={index} className="concern-tag">{concern}</span>
                  ))
                ) : (
                  <span className="concern-tag">No concerns detected</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="result-card">
          <h2>Severity Analysis</h2>
          <div className="severity-grid">
            {Object.keys(analysis.severity).length > 0 ? (
              Object.entries(analysis.severity)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([concern, value]) => {
                const ConcernIcon = getSkinConcernIcon(concern);
                return (
                  <div key={concern} className="severity-card">
                    <div className="severity-header">
                      <div className="severity-title-row">
                        <span className="severity-icon">
                          <ConcernIcon size={20} strokeWidth={2} />
                        </span>
                        <h3 className="severity-title">{formatMetricName(concern)}</h3>
                      </div>
                      <span className={`severity-pill ${getSeverityColor(value)}`} title={getSeverityTooltip(value)}>
                        {getSeverityLabel(value)}
                      </span>
                    </div>
                    <div className="severity-bar">
                      <div className={`severity-fill ${getSeverityColor(value)}`} style={{ width: `${value}%` }}></div>
                    </div>
                    <div className="severity-value">{value}%</div>
                  </div>
                );
              })
            ) : (
              <p className="analysis-empty">No severity metrics available for this scan.</p>
            )}
          </div>
        </div>

        {/* AI Ingredient Recommendations – design system */}
        <div className="result-card analysis-ingredient-rec">
          <h2>🧪 AI Ingredient Recommendations</h2>
          <p className="analysis-ingredient-intro">
            Based on your analysis, these ingredients will help most:
          </p>
          <div className="analysis-ingredient-cards">
            <div className="analysis-ingredient-card">
              <h3 className="analysis-ingredient-name">💧 Hyaluronic Acid</h3>
              <p className="analysis-ingredient-why">
                Why: Deeply hydrates skin, plumps and reduces fine lines caused by dehydration.
              </p>
              <p className="analysis-ingredient-targets">Targets: Dehydration ✓</p>
              <Link to="/ingredients" className="analysis-ingredient-learn">ℹ️ Learn More</Link>
            </div>
            <div className="analysis-ingredient-card">
              <h3 className="analysis-ingredient-name">🍊 Vitamin C (Ascorbic Acid)</h3>
              <p className="analysis-ingredient-why">
                Why: Brightens under-eye area, reduces pigmentation, boosts collagen production.
              </p>
              <p className="analysis-ingredient-targets">Targets: Dark Circles ✓ · Dullness ✓</p>
              <Link to="/ingredients" className="analysis-ingredient-learn">ℹ️ Learn More</Link>
            </div>
            <div className="analysis-ingredient-card">
              <h3 className="analysis-ingredient-name">☕ Caffeine</h3>
              <p className="analysis-ingredient-why">
                Why: Constricts blood vessels, reduces puffiness and dark circles.
              </p>
              <p className="analysis-ingredient-targets">Targets: Dark Circles ✓ · Puffiness ✓</p>
              <Link to="/ingredients" className="analysis-ingredient-learn">ℹ️ Learn More</Link>
            </div>
          </div>
          <button type="button" onClick={() => navigate('/recommendations')} className="btn btn-primary analysis-ingredient-cta">
            <IconShoppingCart size={18} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Find products with these ingredients
          </button>
        </div>

        <div className="result-card metric-explanations">
          <h2>How to Read Your Scores</h2>
          <p className="metric-explanation-intro">
            For most metrics (acne, redness, pores, etc.), <strong>lower is better</strong>. For hydration, <strong>higher is better</strong>.
          </p>
          <div className="metric-grid">
            <div>
              <h3>Acne, Redness, Pores, Texture, Oiliness, Wrinkles, Dark Circles, Pigmentation, Sensitivity</h3>
              <p>Higher % = more visible concern. Lower scores indicate healthier skin in that area.</p>
            </div>
            <div>
              <h3>Dehydration / Hydration</h3>
              <p>Higher % = better moisture balance. Lower scores may suggest need for hydrating products.</p>
            </div>
            <div>
              <h3>Severity Labels</h3>
              <p>Clear (0–19%) &rarr; Light (20–39%) &rarr; Mild (40–59%) &rarr; Moderate (60–79%) &rarr; Severe (80–100%).</p>
            </div>
          </div>
        </div>

        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="result-card">
            <h2>Recommendations</h2>
            <ul className="recommendations-list">
              {analysis.recommendations.map((rec, index) => (
                <li key={index}>
                  <IconCheck size={16} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                  {rec}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/recommendations')} className="btn btn-primary">
              View Product Recommendations
            </button>
          </div>
        )}

        {(previousScans.length > 0 || true) && (
          <div className="result-card">
            <h2>Compare with previous</h2>
            <p className="results-compare-desc">Compare this analysis with another scan to track changes over time.</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/comparison')}
            >
              Compare with previous
            </button>
            {(() => {
              const completedScans = previousScans
                .filter((p) => String(p.status || '').toLowerCase() !== 'failed')
                .filter((p) => p.scan_id !== analysisId);
              return completedScans.length > 0 && (
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedScans.slice(0, 5).map((prev) => (
                      <tr key={prev.scan_id}>
                        <td>{prev.created_at ? new Date(prev.created_at).toLocaleDateString() : '—'}</td>
                        <td>{prev.status}</td>
                        <td className="right">
                          <button onClick={() => navigate(`/analysis/${prev.scan_id}`)} className="link-button">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            })()}
          </div>
        )}

        <div className="results-actions">
          <button onClick={() => navigate('/scan')} className="btn btn-primary">
            <IconScan size={18} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Take New Scan
          </button>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            <IconHome size={18} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Back to Dashboard
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
