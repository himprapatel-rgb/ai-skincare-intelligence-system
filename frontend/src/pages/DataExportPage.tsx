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
          <div className="card-content" style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <h2>Export Complete!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Your data has been prepared for download.
            </p>
            <button className="btn btn-primary" onClick={() => alert('Download started!')}>
              ⬇ Download {exportFormat.toUpperCase()} File
            </button>
            <div style={{ marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setExportComplete(false)}>
                Request Another Export
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header"><h3>Select Data to Export</h3></div>
            <div className="card-content">
              {dataCategories.map(cat => (
                <div key={cat.key} style={{ display: 'flex', alignItems: 'center', padding: '16px', marginBottom: '8px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <input type="checkbox" checked={cat.checked} onChange={(e) => cat.onChange(e.target.checked)} style={{ width: '20px', height: '20px', marginRight: '16px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{cat.label}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{cat.description}</div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{cat.size}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '24px' }}>
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

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Link to="/profile" className="btn btn-secondary">← Back to Profile</Link>
            <button onClick={handleExport} className="btn btn-primary" disabled={isExporting || (!includeAnalysis && !includeProfile && !includeProducts)}>
              {isExporting ? 'Preparing Export...' : 'Export Data'}
            </button>
          </div>
        </>
      )}

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-content" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          <strong>GDPR Notice:</strong> Under GDPR Article 20, you have the right to receive your personal data in a structured, commonly used format. This export includes all data we hold about you.
        </div>
      </div>
    </div>
  );
};

export default DataExportPage;
