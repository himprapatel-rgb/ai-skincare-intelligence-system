import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { IconScan, IconHome, IconCheck, IconAlertTriangle, IconArrowLeft, IconCopy, IconShare2, IconBrandX, IconHeart, IconDownload, IconShoppingCart, getSkinConcernIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { BreadcrumbJsonLd } from '../components/BreadcrumbJsonLd';
import { SkeletonAnalysis } from '../components/Skeleton';
import LazyImage from '../components/LazyImage';
import { FaceHeatmap } from '../components/FaceHeatmap';
import { TrendSparkline } from '../components/TrendSparkline';
import { getScanHistory, getScanResult } from '../services/scanApi';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { generateDermatologistReport } from '../utils/dermatologistReport';
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
  skinAge?: { estimated_age: number; confidence: number; factors_aging: string[]; factors_youthful: string[] };
  hydrationLevel?: string;
  barrierHealth?: string;
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
  const [imageError, setImageError] = useState(false);
  const [savedToFavorites, setSavedToFavorites] = useState(false);
  const [recProducts, setRecProducts] = useState<Array<{ id: string; name: string; brand: string; category: string; rating?: number; image_url?: string }>>([]);
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

    // Extract skin age, hydration, barrier from analysis
    const skinAge = (analysis as { skin_age?: SkinAnalysis['skinAge'] }).skin_age ||
      (result as { skin_age?: SkinAnalysis['skinAge'] }).skin_age;
    const hydrationLevel = String(
      (analysis as { hydration_level?: string }).hydration_level ||
      (result as { hydration_level?: string }).hydration_level || ''
    );
    const barrierHealth = String(
      (analysis as { barrier_health?: string }).barrier_health ||
      (result as { barrier_health?: string }).barrier_health || ''
    );

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
      skinAge: skinAge || undefined,
      hydrationLevel: hydrationLevel || undefined,
      barrierHealth: barrierHealth || undefined,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- buildScanImageUrl is stable
  }, [analysisId]);

  const fetchAnalysisResults = useCallback(async () => {
    try {
      setLoading(true);
      if (!analysisId) {
        throw new Error('Missing scan id');
      }

      const [scanResult, historyData] = await Promise.all([
        getScanResult(analysisId),
        getScanHistory(),
      ]);
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
      const scans = ((historyData as Record<string, unknown>).data || (historyData as Record<string, unknown>).scans || []) as ScanHistoryItem[];
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
    setImageError(false);
    try {
      const list = JSON.parse(localStorage.getItem('favorite_analyses') || '[]');
      setSavedToFavorites(Array.isArray(list) && list.includes(analysisId));
    } catch {
      setSavedToFavorites(false);
    }
  }, [analysisId]);

  // Fetch product recommendations based on detected concerns
  useEffect(() => {
    if (!analysis || analysis.concerns.length === 0) return;
    let cancelled = false;
    const token = localStorage.getItem('auth_token');
    (async () => {
      try {
        const url = new URL(`${API_BASE_URL}/recommendations`);
        url.searchParams.set('concerns', analysis.concerns.join(','));
        url.searchParams.set('limit', '3');
        const res = await fetch(url.toString(), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const items = (data.recommendations || []).slice(0, 3).map((p: Record<string, unknown>) => ({
          id: String(p.id || ''),
          name: String(p.name || ''),
          brand: String(p.brand || ''),
          category: String(p.category || ''),
          rating: typeof p.rating === 'number' ? p.rating : (typeof p.average_rating === 'number' ? p.average_rating : undefined),
          image_url: typeof p.image_url === 'string' ? p.image_url : undefined,
        }));
        if (!cancelled) setRecProducts(items);
      } catch {
        // Non-critical
      }
    })();
    return () => { cancelled = true; };
  }, [analysis]);

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

  const captureForExport = useCallback(async () => {
    const el = exportContainerRef.current;
    if (!el) return null;
    const { default: html2canvas } = await import('html2canvas');
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
      const { jsPDF } = await import('jspdf');
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

  /** Dynamic ingredient recommendations based on detected concerns */
  const getPersonalizedIngredients = (
    concerns: string[],
    severity: Record<string, number>,
  ): Array<{ name: string; why: string; targets: string[] }> => {
    const INGREDIENT_DB: Record<string, { name: string; why: string; targets: string[] }> = {
      acne: { name: 'Salicylic Acid (BHA)', why: 'Penetrates pores to dissolve excess oil and dead skin, reducing breakouts.', targets: ['Acne', 'Pores'] },
      redness: { name: 'Centella Asiatica (Cica)', why: 'Calms inflammation and strengthens the skin barrier to reduce redness.', targets: ['Redness', 'Sensitivity'] },
      pigmentation: { name: 'Vitamin C (Ascorbic Acid)', why: 'Inhibits melanin production, fades dark spots and evens skin tone.', targets: ['Pigmentation', 'Dark Spots'] },
      dehydration: { name: 'Hyaluronic Acid', why: 'Attracts and holds up to 1000x its weight in water, deeply hydrating skin.', targets: ['Dehydration', 'Fine Lines'] },
      sensitivity: { name: 'Ceramides', why: 'Restores the skin barrier, locking in moisture and shielding from irritants.', targets: ['Sensitivity', 'Barrier Repair'] },
      wrinkles: { name: 'Retinol (Vitamin A)', why: 'Accelerates cell turnover, boosts collagen, and smooths fine lines.', targets: ['Wrinkles', 'Texture'] },
      pores: { name: 'Niacinamide (Vitamin B3)', why: 'Minimizes pore appearance, regulates oil production, and brightens skin.', targets: ['Pores', 'Oiliness'] },
      dark_circles: { name: 'Caffeine', why: 'Constricts blood vessels under eyes, reducing puffiness and dark circles.', targets: ['Dark Circles', 'Puffiness'] },
      texture: { name: 'Glycolic Acid (AHA)', why: 'Exfoliates surface skin cells, revealing smoother, more radiant texture.', targets: ['Texture', 'Dullness'] },
      oiliness: { name: 'Zinc PCA', why: 'Regulates sebum production without over-drying, keeping skin balanced.', targets: ['Oiliness', 'Shine Control'] },
    };

    // Sort concerns by severity (highest first) and map to ingredients
    const sorted = Object.entries(severity)
      .sort(([, a], [, b]) => b - a)
      .filter(([, v]) => v > 15); // Only recommend for non-trivial concerns

    const results: Array<{ name: string; why: string; targets: string[] }> = [];
    const usedNames = new Set<string>();

    for (const [concern] of sorted) {
      const ing = INGREDIENT_DB[concern.toLowerCase()];
      if (ing && !usedNames.has(ing.name)) {
        results.push(ing);
        usedNames.add(ing.name);
      }
      if (results.length >= 4) break;
    }

    // Ensure at least 2 recommendations
    if (results.length < 2) {
      const fallbacks = [
        INGREDIENT_DB.dehydration,
        INGREDIENT_DB.pores,
        INGREDIENT_DB.pigmentation,
      ];
      for (const fb of fallbacks) {
        if (!usedNames.has(fb.name)) {
          results.push(fb);
          usedNames.add(fb.name);
        }
        if (results.length >= 3) break;
      }
    }

    return results;
  };

  /** Map concern types to likely face zones for heatmap display */
  const inferAffectedAreas = (concern: string): string[] => {
    const mapping: Record<string, string[]> = {
      acne: ['forehead', 'cheeks', 'chin', 't_zone'],
      redness: ['cheeks', 'nose'],
      pigmentation: ['cheeks', 'forehead'],
      dehydration: ['cheeks', 'forehead'],
      sensitivity: ['cheeks'],
      wrinkles: ['forehead', 'under_eyes'],
      pores: ['nose', 't_zone', 'cheeks'],
      dark_circles: ['under_eyes', 'under_eye_left', 'under_eye_right'],
      texture: ['forehead', 'cheeks'],
      oiliness: ['forehead', 'nose', 't_zone'],
    };
    return mapping[concern.toLowerCase()] || ['cheeks'];
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
      <div className="analysis-results app-page clinical-page">
        <header className="app-header-card">
          <h1>Skin Analysis</h1>
          <p className="app-header-subtitle">We couldn&apos;t load this analysis</p>
        </header>
        <div className="app-page-content results-body">
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
    <div className="analysis-results app-page clinical-page">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Skin Analysis Results', path: `/analysis/${analysisId}` },
        ]}
      />
      <div className="results-actions-row">
        <BackButton />
      </div>
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
              <button
                type="button"
                className="results-copy-link results-export-btn"
                onClick={async () => {
                  if (!analysis) return;
                  try {
                    setExporting('pdf');
                    await generateDermatologistReport({
                      scanId: analysis.id,
                      date: analysis.timestamp,
                      skinType: analysis.skinType,
                      confidence: analysis.confidence,
                      concerns: analysis.concerns,
                      severity: analysis.severity,
                      recommendations: analysis.recommendations || [],
                      ingredients: getPersonalizedIngredients(analysis.concerns, analysis.severity),
                    });
                    toast.success('Dermatologist report downloaded');
                  } catch {
                    toast.error('Could not generate report');
                  } finally {
                    setExporting(null);
                  }
                }}
                disabled={!!exporting}
                title="Export clinical report for your dermatologist"
                aria-label="Export dermatologist report"
              >
                <IconDownload size={16} strokeWidth={2} />
                Derm Report
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
              <IconArrowLeft size={16} strokeWidth={2} className="icon-inline" />
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

        {/* Interactive Face Zone Heatmap */}
        <FaceHeatmap
          concerns={analysis.concerns.length > 0
            ? Object.entries(analysis.severity).map(([key, val]) => ({
                concern_type: key,
                severity: val >= 80 ? 'severe' : val >= 60 ? 'moderate' : val >= 40 ? 'mild' : val >= 20 ? 'light' : 'clear',
                confidence: val / 100,
                affected_areas: inferAffectedAreas(key),
              }))
            : undefined
          }
          overallScore={analysis.confidence}
        />

        {/* Score Trend Sparkline */}
        {previousScans.length >= 2 && (() => {
          const scores = previousScans
            .filter(s => String(s.status || '').toLowerCase() !== 'failed')
            .slice(0, 10)
            .map(s => {
              const meta = (s as Record<string, unknown>).scan_metadata as Record<string, unknown> | undefined;
              const result = meta?.result as Record<string, unknown> | undefined;
              const analysisData = result?.analysis as Record<string, unknown> | undefined;
              const summary = analysisData?.summary as Record<string, unknown> | undefined;
              return (summary?.overall_score as number) ?? null;
            })
            .filter((v): v is number => v !== null)
            .reverse();
          return scores.length >= 2 ? (
            <div className="result-card" style={{ textAlign: 'center' }}>
              <h2>Your Score Trend</h2>
              <TrendSparkline scores={scores} width={200} height={50} onViewHistory={() => navigate('/history')} />
            </div>
          ) : null;
        })()}

        <div className="results-grid">
          <div className="result-card">
            <h2>Analyzed Image</h2>
            <div className="analysis-image">
              {analysis.imageUrl && !imageError ? (
                <LazyImage
                  src={analysis.imageUrl}
                  alt="Skin analysis"
                  width={400}
                  height={300}
                  objectFit="cover"
                  onError={() => setImageError(true)}
                />
              ) : null}
              <div
                className="analysis-image-fallback"
                style={{ display: analysis.imageUrl && !imageError ? 'none' : 'flex' }}
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
            {analysis.skinAge && (
              <div className="overview-section">
                <h3>Skin Age</h3>
                <div className="skin-age-display">
                  <span className="skin-age-number">{analysis.skinAge.estimated_age}</span>
                  <span className="skin-age-label">years</span>
                </div>
                {analysis.skinAge.factors_youthful.length > 0 && (
                  <div className="skin-age-factors">
                    <span className="factor-positive">Youthful: {analysis.skinAge.factors_youthful.slice(0, 2).join(', ')}</span>
                  </div>
                )}
              </div>
            )}
            {(analysis.hydrationLevel || analysis.barrierHealth) && (
              <div className="overview-section overview-badges">
                {analysis.hydrationLevel && (
                  <span className={`health-badge hydration-${analysis.hydrationLevel.replace(/_/g, '-')}`}>
                    💧 {analysis.hydrationLevel.replace(/_/g, ' ')}
                  </span>
                )}
                {analysis.barrierHealth && (
                  <span className={`health-badge barrier-${analysis.barrierHealth}`}>
                    🛡️ Barrier: {analysis.barrierHealth}
                  </span>
                )}
              </div>
            )}
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

        {/* AI Ingredient Recommendations — Dynamic based on concerns */}
        <div className="result-card analysis-ingredient-rec">
          <h2>AI Ingredient Recommendations</h2>
          <p className="analysis-ingredient-intro">
            Based on your analysis, these ingredients will help most:
          </p>
          <div className="analysis-ingredient-cards">
            {getPersonalizedIngredients(analysis.concerns, analysis.severity).map((rec, i) => (
              <div key={i} className="analysis-ingredient-card">
                <h3 className="analysis-ingredient-name">{rec.name}</h3>
                <p className="analysis-ingredient-why">
                  {rec.why}
                </p>
                <p className="analysis-ingredient-targets">
                  Targets: {rec.targets.join(' · ')}
                </p>
                <Link to="/ingredients" className="analysis-ingredient-learn">Learn More</Link>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => navigate('/recommendations')} className="btn btn-primary analysis-ingredient-cta">
            <IconShoppingCart size={18} strokeWidth={2} className="icon-inline" />
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
                  <IconCheck size={16} strokeWidth={2} className="icon-inline" />
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

        {/* Product Recommendations for Detected Concerns */}
        {recProducts.length > 0 && (
          <div className="results-section results-recs-section">
            <h2 className="results-section-title">
              <IconShoppingCart size={20} strokeWidth={2} className="icon-inline" />
              Recommended for Your Concerns
            </h2>
            <div className="results-recs-grid">
              {recProducts.map(p => (
                <Link key={p.id} to={`/product/${encodeURIComponent(p.id)}`} className="results-rec-card">
                  <span className="results-rec-category">{p.category}</span>
                  <span className="results-rec-name">{p.name}</span>
                  <span className="results-rec-brand">{p.brand}</span>
                  {p.rating && <span className="results-rec-rating">Rating: {p.rating}/5</span>}
                </Link>
              ))}
            </div>
            <Link to="/recommendations" className="results-recs-link">
              View all recommendations &rarr;
            </Link>
          </div>
        )}

        <div className="results-actions">
          <button onClick={() => navigate('/scan')} className="btn btn-primary">
            <IconScan size={18} strokeWidth={2} className="icon-inline" />
            Take New Scan
          </button>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            <IconHome size={18} strokeWidth={2} className="icon-inline" />
            Back to Dashboard
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
