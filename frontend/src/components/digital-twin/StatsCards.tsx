import React from 'react';

type StatsCardsProps = {
  stats: {
    trend: string;
    topConcerns: string;
    bestImprovement: string;
    topConcern: string;
  };
};

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const items = [
    { label: 'Trend', value: stats.trend },
    { label: 'Top Concerns', value: stats.topConcerns },
    { label: 'Best Improvement', value: stats.bestImprovement },
    { label: 'Focus Area', value: stats.topConcern },
  ];

  return (
    <section className="dt-stats-grid">
      {items.map((item) => (
        <div key={item.label} className="dt-stat-card">
          <div className="dt-stat-label">{item.label}</div>
          <div className="dt-stat-value">{item.value || '—'}</div>
        </div>
      ))}
    </section>
  );
};

export default StatsCards;
