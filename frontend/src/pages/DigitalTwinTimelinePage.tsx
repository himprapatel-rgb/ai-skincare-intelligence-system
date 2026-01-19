import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { IconCamera, IconTrendingUp, IconCalendar, IconSparkles, IconTarget } from '../components/Icons';
import './DigitalTwinTimelinePage.css';

interface DigitalTwinSnapshot {
  id: string;
  date: string;
  imageUrl: string;
  overallScore: number;
  skinMood: number; // 0-100
  concerns: {
    acne: number;
    wrinkles: number;
    darkSpots: number;
    hydration: number;
    redness: number;
  };
  improvements: string[];
}

/**
 * Digital Twin Timeline Page (FR1-FR9 from SRS)
 * Showcase user's skin improvement over time with timeline visualization
 */
const DigitalTwinTimelinePage: React.FC = () => {
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState<DigitalTwinSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with API call to /api/v1/digital_twin/timeline
    const mockSnapshots: DigitalTwinSnapshot[] = [
      {
        id: '1',
        date: '2026-01-14',
        imageUrl: '/placeholder.jpg',
        overallScore: 75,
        skinMood: 78,
        concerns: { acne: 30, wrinkles: 20, darkSpots: 25, hydration: 70, redness: 30 },
        improvements: ['Acne reduced by 15%', 'Hydration improved by 10%']
      },
      {
        id: '2',
        date: '2026-01-07',
        imageUrl: '/placeholder.jpg',
        overallScore: 72,
        skinMood: 72,
        concerns: { acne: 35, wrinkles: 22, darkSpots: 28, hydration: 65, redness: 32 },
        improvements: ['Acne reduced by 10%']
      },
      {
        id: '3',
        date: '2025-12-31',
        imageUrl: '/placeholder.jpg',
        overallScore: 68,
        skinMood: 68,
        concerns: { acne: 40, wrinkles: 20, darkSpots: 30, hydration: 60, redness: 35 },
        improvements: []
      },
      {
        id: '4',
        date: '2025-12-24',
        imageUrl: '/placeholder.jpg',
        overallScore: 65,
        skinMood: 65,
        concerns: { acne: 45, wrinkles: 18, darkSpots: 32, hydration: 55, redness: 38 },
        improvements: []
      },
    ];
    setSnapshots(mockSnapshots);
    setIsLoading(false);
  }, []);

  const chartData = snapshots
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(s => ({
      date: new Date(s.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      score: s.overallScore,
      mood: s.skinMood,
      acne: s.concerns.acne,
      hydration: s.concerns.hydration
    }));

  const selectedData = snapshots.find(s => s.id === selectedSnapshot) || snapshots[0];

  if (isLoading) {
    return (
      <div className="digital-twin-page">
        <div className="loading-spinner">Loading timeline...</div>
      </div>
    );
  }

  return (
    <div className="digital-twin-page">
      <div className="digital-twin-container">
        <div className="page-header">
          <h1>
            <IconTarget size={32} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '12px' }} />
            Digital Twin Timeline
          </h1>
          <p>Track your skin's journey and see how it evolves over time</p>
        </div>

        {/* Overall Progress Summary */}
        <div className="progress-summary">
          <div className="summary-card">
            <div className="summary-icon">
              <IconTrendingUp size={32} strokeWidth={2} />
            </div>
            <div className="summary-content">
              <div className="summary-value">{snapshots[0]?.overallScore || 0}</div>
              <div className="summary-label">Current Score</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">
              <IconSparkles size={32} strokeWidth={2} />
            </div>
            <div className="summary-content">
              <div className="summary-value">{snapshots[0]?.skinMood || 0}</div>
              <div className="summary-label">Skin Mood</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">
              <IconCalendar size={32} strokeWidth={2} />
            </div>
            <div className="summary-content">
              <div className="summary-value">{snapshots.length}</div>
              <div className="summary-label">Total Snapshots</div>
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
        <div className="card timeline-chart-card">
          <div className="card-header">
            <h2>Progress Over Time</h2>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="var(--primary)" 
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  name="Overall Score"
                />
                <Area 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="var(--secondary)" 
                  fillOpacity={1}
                  fill="url(#colorMood)"
                  name="Skin Mood"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline Snapshots */}
        <div className="card timeline-snapshots-card">
          <div className="card-header">
            <h2>Timeline Snapshots</h2>
            <button onClick={() => navigate('/scan')} className="btn-primary">
              <IconCamera size={18} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Take New Snapshot
            </button>
          </div>
          <div className="card-content">
            <div className="timeline-snapshots">
              {snapshots.map((snapshot, index) => (
                <div
                  key={snapshot.id}
                  className={`snapshot-item ${selectedSnapshot === snapshot.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSnapshot(snapshot.id)}
                >
                  <div className="snapshot-image">
                    <img src={snapshot.imageUrl} alt={`Snapshot ${index + 1}`} />
                    <div className="snapshot-date">
                      {new Date(snapshot.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="snapshot-info">
                    <div className="snapshot-score">Score: {snapshot.overallScore}</div>
                    <div className="snapshot-mood">Mood: {snapshot.skinMood}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Snapshot Details */}
        {selectedData && (
          <div className="card snapshot-details-card">
            <div className="card-header">
              <h2>Snapshot Details - {new Date(selectedData.date).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</h2>
            </div>
            <div className="card-content">
              <div className="snapshot-details-grid">
                <div className="detail-image">
                  <img src={selectedData.imageUrl} alt="Selected snapshot" />
                </div>
                <div className="detail-metrics">
                  <h3>Metrics</h3>
                  <div className="metrics-grid">
                    <div className="metric-item">
                      <span className="metric-label">Overall Score</span>
                      <span className="metric-value">{selectedData.overallScore}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Skin Mood</span>
                      <span className="metric-value">{selectedData.skinMood}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Acne</span>
                      <span className="metric-value">{selectedData.concerns.acne}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Wrinkles</span>
                      <span className="metric-value">{selectedData.concerns.wrinkles}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Dark Spots</span>
                      <span className="metric-value">{selectedData.concerns.darkSpots}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Hydration</span>
                      <span className="metric-value">{selectedData.concerns.hydration}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Redness</span>
                      <span className="metric-value">{selectedData.concerns.redness}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedData.improvements.length > 0 && (
                <div className="improvements-section">
                  <h3>Key Improvements</h3>
                  <ul className="improvements-list">
                    {selectedData.improvements.map((improvement, idx) => (
                      <li key={idx}>
                        <IconTrendingUp size={16} strokeWidth={2} style={{ marginRight: '8px', color: 'var(--primary)' }} />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Before/After Comparison */}
        {snapshots.length >= 2 && (
          <div className="card comparison-card">
            <div className="card-header">
              <h2>Before & After</h2>
            </div>
            <div className="card-content">
              <div className="before-after-grid">
                <div className="before-after-item">
                  <div className="ba-label">Before</div>
                  <img src={snapshots[snapshots.length - 1].imageUrl} alt="Before" />
                  <div className="ba-date">{new Date(snapshots[snapshots.length - 1].date).toLocaleDateString()}</div>
                  <div className="ba-score">Score: {snapshots[snapshots.length - 1].overallScore}</div>
                </div>
                <div className="before-after-item">
                  <div className="ba-label">After</div>
                  <img src={snapshots[0].imageUrl} alt="After" />
                  <div className="ba-date">{new Date(snapshots[0].date).toLocaleDateString()}</div>
                  <div className="ba-score">Score: {snapshots[0].overallScore}</div>
                </div>
              </div>
              <div className="improvement-summary">
                <div className="improvement-value">
                  +{snapshots[0].overallScore - snapshots[snapshots.length - 1].overallScore} points
                </div>
                <div className="improvement-label">Overall Improvement</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalTwinTimelinePage;
