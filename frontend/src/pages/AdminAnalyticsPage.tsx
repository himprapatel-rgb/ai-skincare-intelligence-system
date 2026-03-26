import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import styles from './AdminAnalyticsPage.module.css';

type DateRange = '7d' | '30d' | '90d';

type KPIData = {
  dau: number;
  mau: number;
  total_scans: number;
  ai_cost_30d: number;
};

type ConcernRow = {
  concern: string;
  count: number;
  percentage: number;
};

type SkinTypeRow = {
  skin_type: string;
  count: number;
  percentage: number;
};

const AdminAnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [topConcerns, setTopConcerns] = useState<ConcernRow[]>([]);
  const [skinTypes, setSkinTypes] = useState<SkinTypeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get('/api/v1/admin/analytics/overview');
      setKpis({
        dau: data.dau ?? 0,
        mau: data.mau ?? 0,
        total_scans: data.total_scans ?? 0,
        ai_cost_30d: data.ai_cost_30d ?? 0,
      });
      setTopConcerns(data.top_concerns || []);
      setSkinTypes(data.skin_types || []);
    } catch {
      setError('Failed to load analytics data.');
      setKpis(null);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatCost = (val: number) =>
    `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatNumber = (val: number) =>
    val.toLocaleString('en-US');

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Analytics</h1>
            <p className={styles.subtitle}>Platform performance and usage metrics.</p>
          </div>
          <div className={styles.rangeTabs}>
            {(['7d', '30d', '90d'] as DateRange[]).map((range) => (
              <button
                key={range}
                className={`${styles.rangeTab} ${dateRange === range ? styles.rangeTabActive : ''}`}
                onClick={() => setDateRange(range)}
                type="button"
              >
                {range}
              </button>
            ))}
          </div>
        </header>

        {error && (
          <div className={styles.errorBanner}>
            <span>{error}</span>
            <button onClick={() => setError(null)} className={styles.errorClose} type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className={styles.kpiValue}>
              {isLoading ? '--' : formatNumber(kpis?.dau ?? 0)}
            </div>
            <div className={styles.kpiLabel}>Daily Active Users</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className={styles.kpiValue}>
              {isLoading ? '--' : formatNumber(kpis?.mau ?? 0)}
            </div>
            <div className={styles.kpiLabel}>Monthly Active Users</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              </svg>
            </div>
            <div className={styles.kpiValue}>
              {isLoading ? '--' : formatNumber(kpis?.total_scans ?? 0)}
            </div>
            <div className={styles.kpiLabel}>Total Scans</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className={styles.kpiValue}>
              {isLoading ? '--' : formatCost(kpis?.ai_cost_30d ?? 0)}
            </div>
            <div className={styles.kpiLabel}>AI Cost (30d)</div>
          </div>
        </div>

        {/* Chart placeholders */}
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>User Growth</h3>
            <div className={styles.chartPlaceholder}>
              <div className={styles.placeholderContent}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                <p>User growth trend</p>
              </div>
            </div>
          </div>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Scan Volume</h3>
            <div className={styles.chartPlaceholder}>
              <div className={styles.placeholderContent}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <p>Scan volume chart</p>
              </div>
            </div>
          </div>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>AI Cost Breakdown</h3>
            <div className={styles.chartPlaceholder}>
              <div className={styles.placeholderContent}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                  <path d="M22 12A10 10 0 0 0 12 2v10z" />
                </svg>
                <p>AI cost breakdown</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className={styles.tablesGrid}>
          <div className={styles.tableCard}>
            <h3 className={styles.tableTitle}>Top Concerns</h3>
            {isLoading ? (
              <div className={styles.tableLoading}>Loading...</div>
            ) : topConcerns.length === 0 ? (
              <div className={styles.tableEmpty}>No data available</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Concern</th>
                    <th>Count</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {topConcerns.map((row) => (
                    <tr key={row.concern}>
                      <td>{row.concern}</td>
                      <td>{formatNumber(row.count)}</td>
                      <td>
                        <div className={styles.barWrap}>
                          <div
                            className={styles.bar}
                            style={{ width: `${Math.min(row.percentage, 100)}%` }}
                          />
                          <span>{row.percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className={styles.tableCard}>
            <h3 className={styles.tableTitle}>Common Skin Types</h3>
            {isLoading ? (
              <div className={styles.tableLoading}>Loading...</div>
            ) : skinTypes.length === 0 ? (
              <div className={styles.tableEmpty}>No data available</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Skin Type</th>
                    <th>Count</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {skinTypes.map((row) => (
                    <tr key={row.skin_type}>
                      <td>{row.skin_type}</td>
                      <td>{formatNumber(row.count)}</td>
                      <td>
                        <div className={styles.barWrap}>
                          <div
                            className={styles.bar}
                            style={{ width: `${Math.min(row.percentage, 100)}%` }}
                          />
                          <span>{row.percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
