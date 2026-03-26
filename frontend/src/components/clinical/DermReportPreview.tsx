import React, { useState } from 'react';
import styles from './DermReportPreview.module.css';

export type DermReport = {
  id: number;
  report_data: {
    generated_at?: string;
    scan?: Record<string, unknown>;
    profile_summary?: Record<string, unknown> | null;
    analysis?: Record<string, unknown>;
    current_products?: Array<{ name: string; brand?: string; category?: string }>;
    clinical_notes?: string[];
    scan_history_count?: number;
    [key: string]: unknown;
  };
  share_token?: string | null;
  created_at: string;
};

type ReportSection = { title: string; content: string };

type DermReportPreviewProps = {
  report: DermReport;
  onShare: () => void;
  onDownload: () => void;
};

const SECTION_ICONS: Record<string, JSX.Element> = {
  profile_summary: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  ai_analysis: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22" />
      <path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93" />
    </svg>
  ),
  concern_timeline: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  zone_summary: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  ingredient_warnings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  recommendations: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
};

function buildSections(report: DermReport): ReportSection[] {
  const rd = report.report_data || {};
  const sections: ReportSection[] = [];

  if (rd.profile_summary) {
    const ps = rd.profile_summary as Record<string, string | null>;
    sections.push({ title: 'Patient Skin Profile', content: Object.entries(ps).filter(([, v]) => v).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join('\n') });
  }
  if (rd.analysis) {
    const a = rd.analysis as Record<string, unknown>;
    sections.push({ title: 'AI Analysis', content: JSON.stringify(a, null, 2) });
  }
  if (rd.clinical_notes && rd.clinical_notes.length > 0) {
    sections.push({ title: 'Clinical Notes', content: rd.clinical_notes.join('\n• ') });
  }
  if (rd.current_products && rd.current_products.length > 0) {
    sections.push({ title: 'Current Products', content: rd.current_products.map(p => `${p.brand || ''} ${p.name}`).join(', ') });
  }
  if (rd.scan) {
    sections.push({ title: 'Scan Details', content: `Scan ID: ${rd.scan.id || 'N/A'}, Date: ${rd.scan.date || 'N/A'}` });
  }
  if (sections.length === 0) {
    sections.push({ title: 'Report', content: 'No detailed data available for this scan.' });
  }
  return sections;
}

const SECTION_ORDER = ['profile_summary', 'ai_analysis', 'concern_timeline', 'zone_summary', 'ingredient_warnings', 'recommendations'];

const DermReportPreview: React.FC<DermReportPreviewProps> = ({ report, onShare, onDownload }) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = () => {
    onShare();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className={styles.preview}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Dermatology Report</h2>
          <p className={styles.date}>
            Generated {new Date(report.report_data?.generated_at || report.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className={styles.actions}>
          <button className={styles.shareBtn} onClick={handleShare} type="button">
            {copiedLink ? (
              <span>Link Copied</span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>Share</span>
              </>
            )}
          </button>
          <button className={styles.downloadBtn} onClick={onDownload} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      <div className={styles.sections}>
        {buildSections(report).map((section, idx) => {
          const iconKey = SECTION_ORDER[idx] || 'recommendations';
          return (
            <div key={section.title} className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>
                  {SECTION_ICONS[iconKey] || SECTION_ICONS.recommendations}
                </span>
                <h3 className={styles.sectionTitle}>{section.title}</h3>
              </div>
              <div className={styles.sectionContent}>
                {section.content.split('\n').map((line, i) => <p key={i}>{line}</p>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DermReportPreview;
