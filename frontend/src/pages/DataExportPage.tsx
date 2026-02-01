import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconDownload, IconCheckCircle, IconFileText, IconArrowLeft } from '../components/Icons';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config';
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
      const token = localStorage.getItem('auth_token');
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
        // PDF generation would require a library like jsPDF
        // For now, show alert
        alert('PDF export will be available soon. Please use JSON format for now.');
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
    <div className="page-container">
      <div className="page-header">
        <h1>
          <IconDownload size={32} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '12px' }} />
          Export Your Data
        </h1>
        <p>Download a copy of your personal data (GDPR compliant)</p>
      </div>

      {exportComplete ? (
        <div className="card">
          <div className="card-content export-complete">
            <div className="export-complete-icon">
              <IconCheckCircle size={64} strokeWidth={2} />
            </div>
            <h2>Export Complete!</h2>
            <p className="export-complete-text">
              Your data has been prepared for download.
            </p>
            <button className="btn btn-primary" onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                'Preparing...'
              ) : (
                <>
                  <IconDownload size={18} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Download {exportFormat.toUpperCase()} File
                </>
              )}
            </button>
            <div className="export-complete-actions">
              <button className="btn btn-secondary" onClick={() => setExportComplete(false)}>
                Request Another Export
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="card export-card">
            <div className="card-header"><h3>Select Data to Export</h3></div>
            <div className="card-content">
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

          <div className="card export-card">
            <div className="card-header"><h3>Export Format</h3></div>
            <div className="card-content export-format-grid">
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
              <strong>JSON</strong> — A single file containing your selected data in a structured format (profile, analysis history, favorites). Use it to back up data or port it to another service. <strong>PDF</strong> — A human-readable report (coming soon) for sharing or printing.
            </p>
            <p className="export-eta" aria-live="polite">Estimated time: under 1 minute for typical data size.</p>
          </div>

          <div className="export-actions">
            <Link to="/profile" className="btn btn-secondary">
              <IconArrowLeft size={16} strokeWidth={2} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
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
                  <IconDownload size={18} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Export Data
                </>
              )}
            </button>
          </div>
        </>
      )}

      <div className="card export-note">
        <div className="card-content export-note-content">
          <strong>GDPR Notice:</strong> Under GDPR Article 20, you have the right to receive your personal data in a structured, commonly used format. This export includes all data we hold about you.
        </div>
      </div>
    </div>
  );
};

export default DataExportPage;
