import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HistoryPage.css';
import './CommonStyles.css';

interface ScanHistory {
  id: string;
  date: string;
  imageUrl?: string;
  concerns: string[];
  score: number;
  recommendations: number;
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
      // Mock data
      const mockHistory: ScanHistory[] = [
        { id: '1', date: '2025-01-11', concerns: ['Acne', 'Redness'], score: 78, recommendations: 5 },
        { id: '2', date: '2025-01-05', concerns: ['Dryness', 'Fine Lines'], score: 72, recommendations: 6 },
        { id: '3', date: '2024-12-28', concerns: ['Acne'], score: 85, recommendations: 3 },
        { id: '4', date: '2024-12-15', concerns: ['Redness', 'Sensitivity'], score: 68, recommendations: 7 }
      ];
      setHistory(mockHistory);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    const now = new Date();
    return history.filter(item => {
      const itemDate = new Date(item.date);
      const daysDiff = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (filter === 'all') return true;
      if (filter === '7days') return daysDiff <= 7;
      if (filter === '30days') return daysDiff <= 30;
      if (filter === '90days') return daysDiff <= 90;
      return true;
    });
  };

  const filteredHistory = filterHistory();

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>Scan History</h1>
        <p className="subtitle">Track your skin progress over time</p>
      </div>

      <div className="filter-tabs">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All Time</button>
        <button className={filter === '7days' ? 'active' : ''} onClick={() => setFilter('7days')}>Last 7 Days</button>
        <button className={filter === '30days' ? 'active' : ''} onClick={() => setFilter('30days')}>Last 30 Days</button>
        <button className={filter === '90days' ? 'active' : ''} onClick={() => setFilter('90days')}>Last 90 Days</button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading history...</div>
      ) : filteredHistory.length === 0 ? (
        <div className="empty-state">
          <h3>No scans yet</h3>
          <p>Start your skincare journey by scanning your skin</p>
          <button className="btn-primary" onClick={() => navigate('/scan')}>Take Your First Scan</button>
        </div>
      ) : (
        <>
          <div className="history-stats">
              <div className="stat-card" style={{background: '#0d9488', color: 'white', padding: '28px 20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 6px rgba(13, 148, 136, 0.2)'}}>              <p>Total Scans</p>
            </div>
              <div className="stat-card" style={{background: '#14b8a6', color: 'white', padding: '28px 20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 6px rgba(20, 184, 166, 0.2)'}}>              <p>Avg Score</p>
            </div>
              <div className="stat-card" style={{background: '#0f766e', color: 'white', padding: '28px 20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 6px rgba(15, 118, 110, 0.2)'}}>              <p>Recommendations</p>
            </div>
          </div>

          <div className="history-timeline">
            {filteredHistory.map(item => (
              <div key={item.id} className="history-item" onClick={() => navigate(`/analysis/${item.id}`)}>
                <div className="item-date">
                  <span className="day">{new Date(item.date).getDate()}</span>
                  <span className="month">{new Date(item.date).toLocaleDateString('en', { month: 'short' })}</span>
                </div>
                
                <div className="item-content">
                  {item.imageUrl && <img src={item.imageUrl} alt="Scan" className="item-image" />}
                  
                  <div className="item-details">
                    <h4>Skin Analysis</h4>
                    <div className="item-score">Score: <strong>{item.score}%</strong></div>
                    <div className="item-concerns">
                      {item.concerns.map((concern, idx) => (
                        <span key={idx} className="concern-tag">{concern}</span>
                      ))}
                    </div>
                    <p className="item-meta">{item.recommendations} recommendations</p>
                  </div>
                </div>
                
                <div className="item-arrow">›</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HistoryPage;
