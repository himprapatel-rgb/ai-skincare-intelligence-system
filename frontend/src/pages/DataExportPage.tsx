import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconDownload, IconCheckCircle, IconFileText, IconArrowLeft } from '../components/Icons';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';
import './CommonStyles.css';
import './DataExportPage.css';

/**
 * Data Export Page (US-404)
 * GDPR compliant data export functionality
 */
const DataExportPage: React.FC = () => {
  const toast = useToast();
  const [exportFormat, setExportFormat] = useState<'json' | 'pdf'>('json');
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setExportComplete(false);
    
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/profile/export`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const data = await response.json();
      const favoriteIds = (() => {
        try {
          return JSON.parse(localStorage.getItem('favorites') || '[]');
        } catch {
          return [];
        }
      })();

      const exportData = {
        user: data.user,
        profile: includeProfile ? data.profile : null,
        analysis: includeAnalysis ? (data.scans || []) : null,
        products: includeProducts ? { favorites: favoriteIds } : null,
        export_timestamp: data.export_timestamp,
      };

      if (exportFormat === 'json') {
        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `skincare-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const margin = 40;
        const lineHeight = 14;
        let y = margin;

        const addTitle = (title: string) => {
          if (y > margin + lineHeight) y += lineHeight;
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(title, margin, y);
          y += lineHeight * 1.5;
        };
        const addText = (text: string, wrap = true) => {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const maxW = pageW - margin * 2;
          const lines = wrap ? pdf.splitTextToSize(text, maxW) : [text];
          for (const line of lines) {
            if (y > 750) { pdf.addPage(); y = margin; }
            pdf.text(line, margin, y);
            y += lineHeight;
          }
        };

        addTitle('SkinCareAI – Data Export');
        addText(`Exported: ${exportData.export_timestamp ?? new Date().toISOString()}`);
        y += lineHeight;

        if (exportData.user) {
          addTitle('User');
          addText(JSON.stringify(exportData.user, null, 2));
        }
        if (includeProfile && exportData.profile) {
          addTitle('Profile');
          addText(JSON.stringify(exportData.profile, null, 2));
        }
        if (includeProducts && exportData.products) {
          addTitle('Products (Favorites)');
          addText(JSON.stringify(exportData.products, null, 2));
        }
        if (includeAnalysis && exportData.analysis) {
          addTitle('Analysis History');
          const arr = exportData.analysis as unknown[];
          addText(Array.isArray(arr) ? `${arr.length} analysis record(s)` : '—');
          if (Array.isArray(arr) && arr.length > 0) {
            arr.slice(0, 10).forEach((item, i) => {
              const s = JSON.stringify(item);
              addText(`  [${i + 1}] ${s.slice(0, 200)}${s.length > 200 ? '...' : ''}`);
            });
            if (arr.length > 10) addText(`  ... and ${arr.length - 10} more (full data in JSON export)`);
          }
        }

        pdf.save(`skincare-data-export-${new Date().toISOString().split('T')[0]}.pdf`);
        toast?.success('PDF downloaded');
      }
      
      setExportComplete(true);
    } catch (error) {
      console.error('Export failed:', error);
      toast?.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const dataCategories = [
    { key: 'profile', label: 'Profile Information', description: 'Name, email, skin type, goals', size: '~2 KB', checked: includeProfile, onChange: setIncludeProfile },
    { key: 'analysis', label: 'Analysis History', description: 'All skin analysis results and images', size: '~15 MB', checked: includeAnalysis, onChange: setIncludeAnalysis },
    { key: 'products', label: 'Product Data', description: 'Favorites and routine-related data', size: '~5 KB', checked: includeProducts, onChange: setIncludeProducts },
  ];

  return (
    <div className="data-export-page app-page">
      <header className="app-header-card data-export-header">
        <Link to="/profile" className="data-export-back" aria-label="Back to profile">
          <IconArrowLeft size={24} strokeWidth={2} />
        </Link>
        <div className="data-export-header-text">
          <h1>
            <IconDownload size={24} strokeWidth={2} className="export-header-icon" aria-hidden />
            Export Your Data
          </h1>
          <p className="app-header-subtitle">Download your data · JSON or PDF · GDPR compliant</p>
        </div>
      </header>
      <div className="app-page-content">
      {exportComplete ? (
        <div className="app-card export-complete">
          <div className="export-complete-icon">
            <IconCheckCircle size={56} strokeWidth={2} />
          </div>
          <h2>Export complete</h2>
          <p className="export-complete-text">Your file is ready. Download it below or request another export.</p>
          <button className="btn btn-primary" onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Preparing…' : <><IconDownload size={18} strokeWidth={2} className="icon-inline" />Download {exportFormat.toUpperCase()}</>}
          </button>
          <div className="export-complete-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setExportComplete(false)}>Export again</button>
          </div>
        </div>
      ) : (
        <>
          <div className="app-card export-card">
            <h3 className="export-card-title">Select Data to Export</h3>
            <div className="export-card-body">
              {dataCategories.map(cat => (
                <div key={cat.key} className="export-category">
                  <input
                    type="checkbox"
                    checked={cat.checked}
                    onChange={(e) => cat.onChange(e.target.checked)}
                    className="export-category-check"
                  />
                  <div className="export-category-info">
                    <div className="export-category-label">{cat.label}</div>
                    <div className="export-category-desc">{cat.description}</div>
                  </div>
                  <div className="export-category-size">{cat.size}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="app-card export-card">
            <h3 className="export-card-title">Export Format</h3>
            <div className="export-format-grid">
              <button
                type="button"
                onClick={() => setExportFormat('json')}
                className={`export-format-card${exportFormat === 'json' ? ' active' : ''}`}
                aria-pressed={exportFormat === 'json'}
              >
                <div className="export-format-icon">
                  <IconFileText size={32} strokeWidth={2} />
                </div>
                <div className="export-format-title">JSON</div>
                <div className="export-format-subtitle">Machine-readable format</div>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`export-format-card${exportFormat === 'pdf' ? ' active' : ''}`}
                aria-pressed={exportFormat === 'pdf'}
              >
                <div className="export-format-icon">
                  <IconFileText size={32} strokeWidth={2} />
                </div>
                <div className="export-format-title">PDF</div>
                <div className="export-format-subtitle">Human-readable format</div>
              </button>
            </div>
            <p className="export-format-explanation" id="export-format-desc">
              <strong>JSON</strong> — Full data backup (profile, analyses, favorites). <strong>PDF</strong> — Human‑readable report for sharing or printing.
            </p>
            <p className="export-eta" aria-live="polite">Usually ready in under a minute.</p>
          </div>

          <div className="export-actions">
            <Link to="/profile" className="btn btn-secondary">
              <IconArrowLeft size={16} strokeWidth={2} className="icon-inline" />
              Back to Profile
            </Link>
            <button 
              onClick={handleExport} 
              className="btn btn-primary"
              disabled={isExporting || (!includeAnalysis && !includeProfile && !includeProducts)}
            >
              {isExporting ? (
                'Exporting...'
              ) : (
                <>
                  <IconDownload size={18} strokeWidth={2} className="icon-inline" />
                  Export Data
                </>
              )}
            </button>
          </div>
        </>
      )}

      <div className="app-card export-note">
        <p className="export-note-content">
          <strong>Your rights:</strong> You can request a copy of your data at any time. This export includes the data we hold for your account.
        </p>
      </div>
      </div>
    </div>
  );
};

export default DataExportPage;
