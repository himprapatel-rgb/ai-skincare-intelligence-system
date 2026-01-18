import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './CommonStyles.css';
import './DataExportPage.css';

/**
 * Data Export Page (US-404)
 * GDPR compliant data export functionality
 */
const DataExportPage: React.FC = () => {
  const [exportFormat, setExportFormat] = useState<'json' | 'pdf'>('json');
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    // Simulate export process
    await new Promise(r => setTimeout(r, 2000));
    setIsExporting(false);
    setExportComplete(true);
  };

  const dataCategories = [
    { key: 'profile', label: 'Profile Information', description: 'Name, email, skin type, goals', size: '~2 KB', checked: includeProfile, onChange: setIncludeProfile },
    { key: 'analysis', label: 'Analysis History', description: 'All skin analysis results and images', size: '~15 MB', checked: includeAnalysis, onChange: setIncludeAnalysis },
    { key: 'products', label: 'Product Data', description: 'Favorites, routines, recommendations', size: '~5 KB', checked: includeProducts, onChange: setIncludeProducts },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📥 Export Your Data</h1>
        <p>Download a copy of your personal data (GDPR compliant)</p>
      </div>

      {exportComplete ? (
        <div className="card">
          <div className="card-content export-complete">
            <div className="export-complete-icon">✅</div>
            <h2>Export Complete!</h2>
            <p className="export-complete-text">
              Your data has been prepared for download.
            </p>
            <button className="btn btn-primary" onClick={() => alert('Download started!')}>
              ⬇ Download {exportFormat.toUpperCase()} File
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
                <div className="export-format-icon">📝</div>
                <div className="export-format-title">JSON</div>
                <div className="export-format-subtitle">Machine-readable format</div>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`export-format-card${exportFormat === 'pdf' ? ' active' : ''}`}
                aria-pressed={exportFormat === 'pdf'}
              >
                <div className="export-format-icon">📄</div>
                <div className="export-format-title">PDF</div>
                <div className="export-format-subtitle">Human-readable report</div>
              </button>
            </div>
          </div>

          <div className="export-actions">
            <Link to="/profile" className="btn btn-secondary">← Back to Profile</Link>
            <button onClick={handleExport} className="btn btn-primary" disabled={isExporting || (!includeAnalysis && !includeProfile && !includeProducts)}>
              {isExporting ? 'Preparing Export...' : 'Export Data'}
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
