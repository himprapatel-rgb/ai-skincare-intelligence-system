import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  checkCatalogHealth,
  getCatalogStats,
  type CatalogStats,
} from '../services/catalogService';
import './AdminCatalogPage.css';

import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';
const API_BASE = API_BASE_URL;

type Health = {
  status: string;
  latency_ms?: number;
  counts?: { products: number; ingredients: number; brands: number };
  error?: string;
};

type DataQuality = {
  total_products: number;
  verified_count: number;
  with_ingredients_count: number;
  with_image_count: number;
  with_safety_count: number;
  low_quality_count: number;
  by_quality_bucket?: { high: number; medium: number; low: number };
  suggestions: string[];
};

type DuplicateGroup = {
  type: string;
  key: string;
  count: number;
  product_ids: string[];
  names: string[];
};

const AdminCatalogPage: React.FC = () => {
  const [health, setHealth] = useState<Health | null>(null);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQuality | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  useEffect(() => {
    if (!token) {
      setError('Please log in to view catalog admin.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [h, dq, dup] = await Promise.all([
          checkCatalogHealth(),
          fetch(`${API_BASE}/catalog/data-quality`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => (r.ok ? r.json() : null)),
          fetch(`${API_BASE}/catalog/duplicates?limit=20`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => (r.ok ? r.json() : { duplicates: [] })),
        ]);
        if (cancelled) return;
        setHealth(h);
        setDataQuality(dq);
        setDuplicates(dup?.duplicates ?? []);
        try {
          const s = await getCatalogStats(token);
          if (!cancelled) setStats(s);
        } catch {
          setStats(null);
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load catalog data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleExport = async (format: 'json' | 'csv') => {
    if (!token) return;
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/catalog/export?format=${format}&limit=10000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalog_export_${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  if (!token) {
    return (
      <div className="admin-catalog-page app-page page-container">
        <h1>Catalog Admin</h1>
        <p className="admin-catalog-msg">Please log in to view catalog admin.</p>
        <Link to="/auth" className="btn-primary">Log in</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-catalog-page app-page page-container">
        <h1>Catalog Admin</h1>
        <p>Loading catalog data...</p>
      </div>
    );
  }

  return (
    <div className="admin-catalog-page app-page page-container">
      <div className="admin-catalog-header">
        <h1>Catalog Admin</h1>
        <Link to="/admin" className="btn-secondary">← Dashboard</Link>
      </div>
      {error && <p className="admin-catalog-error">{error}</p>}

      <section className="admin-catalog-section">
        <h2>Health</h2>
        {health && (
          <div className="admin-catalog-cards">
            <div className={`admin-catalog-card status-${health.status}`}>
              <span className="card-label">Status</span>
              <span className="card-value">{health.status}</span>
            </div>
            {health.latency_ms != null && (
              <div className="admin-catalog-card">
                <span className="card-label">Latency</span>
                <span className="card-value">{health.latency_ms} ms</span>
              </div>
            )}
            {health.counts && (
              <>
                <div className="admin-catalog-card">
                  <span className="card-label">Products</span>
                  <span className="card-value">{health.counts.products}</span>
                </div>
                <div className="admin-catalog-card">
                  <span className="card-label">Ingredients</span>
                  <span className="card-value">{health.counts.ingredients}</span>
                </div>
                <div className="admin-catalog-card">
                  <span className="card-label">Brands</span>
                  <span className="card-value">{health.counts.brands}</span>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {stats && (
        <section className="admin-catalog-section">
          <h2>Stats</h2>
          <div className="admin-catalog-cards">
            <div className="admin-catalog-card">
              <span className="card-label">Total products</span>
              <span className="card-value">{stats.total_products}</span>
            </div>
            <div className="admin-catalog-card">
              <span className="card-label">Verified</span>
              <span className="card-value">{stats.verified_products}</span>
            </div>
            <div className="admin-catalog-card">
              <span className="card-label">Total ingredients</span>
              <span className="card-value">{stats.total_ingredients}</span>
            </div>
          </div>
        </section>
      )}

      {dataQuality && (
        <section className="admin-catalog-section">
          <h2>Data quality</h2>
          <div className="admin-catalog-cards">
            <div className="admin-catalog-card">
              <span className="card-label">With ingredients</span>
              <span className="card-value">{dataQuality.with_ingredients_count}</span>
            </div>
            <div className="admin-catalog-card">
              <span className="card-label">With image</span>
              <span className="card-value">{dataQuality.with_image_count}</span>
            </div>
            <div className="admin-catalog-card">
              <span className="card-label">With safety score</span>
              <span className="card-value">{dataQuality.with_safety_count}</span>
            </div>
            <div className="admin-catalog-card warning">
              <span className="card-label">Low quality (&lt;50)</span>
              <span className="card-value">{dataQuality.low_quality_count}</span>
            </div>
          </div>
          {dataQuality.suggestions.length > 0 && (
            <ul className="admin-catalog-suggestions">
              {dataQuality.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="admin-catalog-section">
        <h2>Duplicates</h2>
        <p className="admin-catalog-muted">
          {duplicates.length} duplicate group(s) found (same barcode or name+brand).
        </p>
        {duplicates.length > 0 && (
          <ul className="admin-catalog-duplicates">
            {duplicates.slice(0, 10).map((d, i) => (
              <li key={i}>
                <strong>{d.type}</strong>: {d.key} — {d.count} product(s): {d.names?.slice(0, 2).join(', ')}
                {d.count > 2 ? '…' : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-catalog-section">
        <h2>Export</h2>
        <p className="admin-catalog-muted">Download catalog as JSON or CSV (requires auth).</p>
        <div className="admin-catalog-actions">
          <button
            className="btn-primary"
            onClick={() => handleExport('json')}
            disabled={exporting}
          >
            {exporting ? 'Exporting…' : 'Export JSON'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => handleExport('csv')}
            disabled={exporting}
          >
            Export CSV
          </button>
        </div>
      </section>
    </div>
  );
};

export default AdminCatalogPage;
