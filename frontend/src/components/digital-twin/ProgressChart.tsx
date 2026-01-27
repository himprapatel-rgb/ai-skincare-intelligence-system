import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

type ProgressChartProps = {
  chartData: Array<Record<string, number | string>>;
  dateRange: '7d' | '30d' | '90d' | 'all';
  onRangeChange: (range: '7d' | '30d' | '90d' | 'all') => void;
  tooltipLabel: (label: string | number, payload: ReadonlyArray<{ payload?: { fullLabel?: string } }>) => React.ReactNode;
};

const ProgressChart: React.FC<ProgressChartProps> = ({ chartData, dateRange, onRangeChange, tooltipLabel }) => {
  const hasMultiplePoints = chartData.length > 1;
  
  return (
    <section className="dt-card">
      <div className="dt-card-header">
        <h2>Progress Over Time</h2>
        <label className="dt-select">
          <span>Range</span>
          <select value={dateRange} onChange={(event) => onRangeChange(event.target.value as typeof dateRange)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </label>
      </div>
      <div className="dt-card-body">
        {!hasMultiplePoints && (
          <div className="dt-chart-hint">
            <span>Add more scans to see trends over time</span>
          </div>
        )}
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="dtScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="dtMood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateLabel" interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}`} />
            <Tooltip formatter={(value, name) => [`${value}`, name]} labelFormatter={tooltipLabel} />
            <Legend />
            <Area type="monotone" dataKey="score" stroke="var(--primary)" fillOpacity={1} fill="url(#dtScore)" name="Overall Score" dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="mood" stroke="var(--secondary)" fillOpacity={1} fill="url(#dtMood)" name="Skin Mood" dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default ProgressChart;
