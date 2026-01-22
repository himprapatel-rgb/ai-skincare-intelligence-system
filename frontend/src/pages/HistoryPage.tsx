import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconCamera, IconStar, IconZap, IconBarChart, IconScan } from '../components/Icons';
import { getScanHistory } from '../services/scanApi';
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
  const navigate = useNavigate();
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');

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
  const totalScans = filteredHistory.length;
  const avgScore = totalScans > 0 ? Math.round(filteredHistory.reduce((acc, item) => acc + item.score, 0) / totalScans) : 0;
  const totalRecs = filteredHistory.reduce((acc, item) => acc + item.recommendations, 0);

  return (
    <div className="history-page">
      <div className="history-container">
        <div className="history-header">
          <h1>Scan History</h1>
          <p>Track your skin progress over time</p>
        </div>

        <div className="history-filters">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Time</button>
          <button className={`filter-btn ${filter === '7days' ? 'active' : ''}`} onClick={() => setFilter('7days')}>Last 7 Days</button>
          <button className={`filter-btn ${filter === '30days' ? 'active' : ''}`} onClick={() => setFilter('30days')}>Last 30 Days</button>
          <button className={`filter-btn ${filter === '90days' ? 'active' : ''}`} onClick={() => setFilter('90days')}>Last 90 Days</button>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading history...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <IconBarChart size={64} strokeWidth={2} />
            </div>
            <h3>No scans yet</h3>
            <p>Start your skincare journey by scanning your skin</p>
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
                <div className="stat-label">Avg Score</div>
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
              {filteredHistory.map(item => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  className="history-item"
                  onClick={() => navigate(`/analysis/${item.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/analysis/${item.id}`);
                    }
                  }}
                >
                  <div className="history-thumbnail">
                    {item.imageUrl ? <img src={item.imageUrl} alt="Scan" /> : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'var(--bg-light)' }}>
                        <IconScan size={32} strokeWidth={2} color="var(--text-gray)" />
                      </div>
                    )}
                  </div>
                  <div className="history-content">
                    <div className="history-date">
                      {new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
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
