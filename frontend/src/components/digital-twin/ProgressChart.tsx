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
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dtScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="dtMood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
              </linearGradient>
              <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e2e8f0" 
              strokeOpacity={0.6}
              vertical={false}
            />
            <XAxis 
              dataKey="dateLabel" 
              interval="preserveStartEnd" 
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
              dy={8}
            />
            <YAxis 
              domain={[0, 100]} 
              tickFormatter={(value) => `${value}`} 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
              dx={-4}
            />
            <Tooltip 
              formatter={(value, name) => [`${value}`, name]} 
              labelFormatter={tooltipLabel}
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.96)',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                padding: '12px 16px',
                fontWeight: 500
              }}
              cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              iconSize={8}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#3b82f6" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#dtScore)" 
              name="Overall Score" 
              dot={{ r: 4, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }} 
              activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2, filter: 'url(#chartGlow)' }} 
              animationDuration={1000}
              animationEasing="ease-out"
            />
            <Area 
              type="monotone" 
              dataKey="mood" 
              stroke="#8b5cf6" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#dtMood)" 
              name="Skin Mood" 
              dot={{ r: 4, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }} 
              activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2, filter: 'url(#chartGlow)' }} 
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default ProgressChart;
