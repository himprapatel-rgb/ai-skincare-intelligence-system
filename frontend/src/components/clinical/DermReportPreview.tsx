import React, { useState } from 'react';
import styles from './DermReportPreview.module.css';

export type DermReportSection = {
  title: string;
  content: string;
};

export type DermReport = {
  id: string;
  generated_at: string;
  profile_summary: DermReportSection;
  ai_analysis: DermReportSection;
  concern_timeline: DermReportSection;
  zone_summary: DermReportSection;
  ingredient_warnings: DermReportSection;
  recommendations: DermReportSection;
};

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

const SECTION_KEYS: (keyof Omit<DermReport, 'id' | 'generated_at'>)[] = [
  'profile_summary',
  'ai_analysis',
  'concern_timeline',
  'zone_summary',
  'ingredient_warnings',
  'recommendations',
];

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
            Generated {new Date(report.generated_at).toLocaleDateString('en-US', {
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
        {SECTION_KEYS.map((key) => {
          const section = report[key] as DermReportSection;
          if (!section) return null;
          return (
            <div key={key} className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>
                  {SECTION_ICONS[key]}
                </span>
                <h3 className={styles.sectionTitle}>{section.title}</h3>
              </div>
              <div className={styles.sectionContent}>
                {section.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DermReportPreview;
