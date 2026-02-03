import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconCamera, IconStar, IconZap, IconBarChart, IconScan, IconSearch } from '../components/Icons';
import { getScanHistory } from '../services/scanApi';
import { usePageTitle } from '../hooks/usePageTitle';
import { SkeletonHistoryList } from '../components/Skeleton';
import './HistoryPage.css';

interface ScanHistory {
  id: string;
  date: string;
  imageUrl?: string;
  concerns: string[];
  score: number;
  recommendations: number;
  status?: string;
}

const HistoryPage: React.FC = () => {
  usePageTitle('Scan History');
  const navigate = useNavigate();
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');
  const [showFailed, setShowFailed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'dateDesc' | 'dateAsc' | 'scoreDesc' | 'scoreAsc'>('dateDesc');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const historyData = await getScanHistory();
      const scans = (historyData as { scans?: Array<Record<string, unknown>> }).scans || [];
      const mapped = scans.map((scan) => {
        const summary = (scan.summary || {}) as Record<string, unknown>;
        const concerns = Array.isArray(summary.concerns)
          ? summary.concerns.filter((value) => typeof value === 'string') as string[]
          : [];
        const overallScore = typeof summary.overall_score === 'number'
          ? Math.round(summary.overall_score)
          : 0;
        return {
          id: String(scan.scan_id || ''),
          date: String(scan.created_at || ''),
          imageUrl: typeof scan.image_url === 'string' ? scan.image_url : undefined,
          concerns,
          score: overallScore,
          recommendations: 0,
          status: typeof scan.status === 'string' ? scan.status : undefined,
        } as ScanHistory;
      });
      setHistory(mapped);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    const now = new Date();
    return history.filter(item => {
      const itemDate = new Date(item.date);
      const isValidDate = !Number.isNaN(itemDate.getTime());
      const daysDiff = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
      if (filter === 'all') return true;
      if (!isValidDate) return false;
      if (filter === '7days') return daysDiff <= 7;
      if (filter === '30days') return daysDiff <= 30;
      if (filter === '90days') return daysDiff <= 90;
      return true;
    });
  };

  const filteredHistory = filterHistory();
  const visibleHistory = showFailed
    ? filteredHistory
    : filteredHistory.filter((item) => item.status !== 'failed' && item.score > 0);
  const failedCount = filteredHistory.length - visibleHistory.length;
  const totalScans = filteredHistory.length;
  const completedHistory = filteredHistory.filter((item) => item.status !== 'failed');
  const avgScore = completedHistory.length > 0
    ? Math.round(completedHistory.reduce((acc, item) => acc + item.score, 0) / completedHistory.length)
    : 0;
  const totalRecs = filteredHistory.reduce((acc, item) => acc + item.recommendations, 0);

  const searchFiltered = useMemo(() => {
    if (!searchTerm.trim()) return visibleHistory;
    const q = searchTerm.toLowerCase().trim();
    return visibleHistory.filter((item) => {
      const dateStr = new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
      const concernMatch = item.concerns.some((c) => c.toLowerCase().includes(q));
      return dateStr.includes(q) || concernMatch;
    });
  }, [visibleHistory, searchTerm]);

  const sortedHistory = useMemo(() => {
    const list = [...searchFiltered];
    switch (sortBy) {
      case 'dateAsc':
        return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'dateDesc':
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'scoreAsc':
        return list.sort((a, b) => a.score - b.score);
      case 'scoreDesc':
        return list.sort((a, b) => b.score - a.score);
      default:
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }, [searchFiltered, sortBy]);

  return (
    <div className="history-page app-page">
      <div className="history-container app-page-content">
        <div className="history-header">
          <h1>Scan History</h1>
          <p>Track your skin progress over time</p>
        </div>

        <div className="history-filters">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Time</button>
          <button className={`filter-btn ${filter === '7days' ? 'active' : ''}`} onClick={() => setFilter('7days')}>Last 7 Days</button>
          <button className={`filter-btn ${filter === '30days' ? 'active' : ''}`} onClick={() => setFilter('30days')}>Last 30 Days</button>
          <button className={`filter-btn ${filter === '90days' ? 'active' : ''}`} onClick={() => setFilter('90days')}>Last 90 Days</button>
          <button className={`filter-btn ${showFailed ? 'active' : ''}`} onClick={() => setShowFailed((prev) => !prev)}>
            {showFailed ? 'Hide Failed' : 'Show Failed'}
          </button>
        </div>
        {!loading && filteredHistory.length > 0 && (
          <div className="history-toolbar">
            <div className="history-search" role="search">
              <IconSearch size={18} strokeWidth={2} className="history-search-icon" aria-hidden />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by date or concerns..."
                aria-label="Search scans by date or concerns"
                className="history-search-input"
              />
            </div>
            <div className="history-sort">
              <label htmlFor="history-sort">Sort by:</label>
              <select id="history-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="history-sort-select">
                <option value="dateDesc">Newest first</option>
                <option value="dateAsc">Oldest first</option>
                <option value="scoreDesc">Score high to low</option>
                <option value="scoreAsc">Score low to high</option>
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <SkeletonHistoryList />
        ) : filteredHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <IconBarChart size={64} strokeWidth={2} />
            </div>
            <h3>No scans yet</h3>
            <p>Start your skincare journey by scanning your skin and tracking improvements.</p>
            <div className="empty-state-guidance">
              <p><strong>Recommended frequency:</strong> 1 scan per week for consistent trends.</p>
              <p>Regular scans help you see how routines, stress, and seasons affect results.</p>
            </div>
            <button className="view-btn" onClick={() => navigate('/scan')}>Take Your First Scan</button>
          </div>
        ) : (
          <>
            <div className="history-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <IconCamera size={32} strokeWidth={2} />
                </div>
                <div className="stat-value">{totalScans}</div>
                <div className="stat-label">Total Scans</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <IconStar size={32} strokeWidth={2} />
                </div>
                <div className="stat-value">{avgScore}%</div>
                <div className="stat-label">Avg Score (completed)</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <IconZap size={32} strokeWidth={2} />
                </div>
                <div className="stat-value">{totalRecs}</div>
                <div className="stat-label">Recommendations</div>
              </div>
            </div>

            <div className="history-list">
              {sortedHistory.length === 0 ? (
                <div className="empty-state">
                  <h3>{searchFiltered.length === 0 && searchTerm ? 'No scans match your search' : 'No completed scans in this range'}</h3>
                  <p>{searchTerm ? 'Try a different search term.' : `${failedCount} failed scan${failedCount === 1 ? '' : 's'} hidden. Toggle to view failed scans.`}</p>
                  {searchTerm ? (
                    <button className="view-btn" onClick={() => setSearchTerm('')}>Clear search</button>
                  ) : (
                    <button className="view-btn" onClick={() => setShowFailed(true)}>Show Failed Scans</button>
                  )}
                </div>
              ) : sortedHistory.map(item => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  className="history-item"
                  aria-label={`Open analysis from ${new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  onClick={() => navigate(`/analysis/${item.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/analysis/${item.id}`);
                    }
                  }}
                >
                  <div className="history-thumbnail">
                    {item.imageUrl ? <img src={item.imageUrl} alt={`Scan from ${new Date(item.date).toLocaleDateString('en')}`} loading="lazy" width={80} height={80} /> : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'var(--bg-light)' }}>
                        <IconScan size={32} strokeWidth={2} color="var(--text-gray)" />
                      </div>
                    )}
                  </div>
                  <div className="history-content">
                    <div className="history-date">
                      <span className="history-date-label">Scanned</span> {new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="history-title">Skin Analysis</div>
                    <div className="history-score">Score: {item.score}%</div>
                  {item.status && (
                    <div className="history-score">Status: {item.status}</div>
                  )}
                    <div className="history-concerns">
                      {item.concerns.map((concern, idx) => (
                        <span key={idx} className="concern-tag">{concern}</span>
                      ))}
                    </div>
                    {item.status === 'failed' && (
                      <div className="history-status-note">
                        Scan failed. Open details for troubleshooting tips.
                      </div>
                    )}
                  </div>
                  <div className="history-actions">
                    <button className="view-btn">View Details</button>
                    <span className="recommendations-count">{item.recommendations} recommendations</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
