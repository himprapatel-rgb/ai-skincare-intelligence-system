/**
 * Skeleton Loading Components
 * Provides shimmer loading placeholders for content
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

// Base skeleton element
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div className={`skeleton ${className}`} style={style} />
);

// Text line skeleton
export const SkeletonText: React.FC<SkeletonProps & { lines?: number }> = ({ 
  className = '', 
  lines = 1,
  style 
}) => (
  <>
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i} 
        className={`skeleton skeleton-text ${className}`} 
        style={{ 
          ...style,
          width: i === lines - 1 && lines > 1 ? '70%' : '100%' 
        }} 
      />
    ))}
  </>
);

// Heading skeleton
export const SkeletonHeading: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div className={`skeleton skeleton-heading ${className}`} style={style} />
);

// Avatar skeleton
export const SkeletonAvatar: React.FC<SkeletonProps & { size?: 'sm' | 'md' | 'lg' }> = ({ 
  className = '', 
  size = 'md',
  style 
}) => (
  <div 
    className={`skeleton skeleton-avatar ${size === 'lg' ? 'skeleton-avatar--lg' : ''} ${className}`} 
    style={style} 
  />
);

// Card skeleton
export const SkeletonCard: React.FC<SkeletonProps & { hasImage?: boolean }> = ({ 
  className = '', 
  hasImage = true,
  style 
}) => (
  <div className={`skeleton-card ${className}`} style={style}>
    {hasImage && <div className="skeleton skeleton-card__image" />}
    <div className="skeleton-card__content">
      <div className="skeleton skeleton-heading" style={{ width: '80%' }} />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" style={{ width: '60%' }} />
    </div>
  </div>
);

// Stat card skeleton
export const SkeletonStat: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div className={`skeleton-stat ${className}`} style={style}>
    <div className="skeleton skeleton-stat__icon" />
    <div className="skeleton skeleton-stat__value" />
    <div className="skeleton skeleton-stat__label" />
  </div>
);

// Button skeleton
export const SkeletonButton: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div className={`skeleton skeleton-button ${className}`} style={style} />
);

// Input skeleton
export const SkeletonInput: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div className={`skeleton skeleton-input ${className}`} style={style} />
);

// Chart skeleton
export const SkeletonChart: React.FC<SkeletonProps & { height?: number }> = ({ 
  className = '', 
  height = 300,
  style 
}) => (
  <div 
    className={`skeleton skeleton-chart ${className}`} 
    style={{ ...style, height }} 
  />
);

// Grid of skeleton cards
export const SkeletonCardGrid: React.FC<{ count?: number; hasImage?: boolean }> = ({ 
  count = 4,
  hasImage = true 
}) => (
  <div className="skeleton-grid">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} hasImage={hasImage} />
    ))}
  </div>
);

// Product details skeleton (Task 10001 H1)
export const SkeletonProductDetails: React.FC = () => (
  <div className="product-details-page" style={{ padding: '16px' }}>
    <div className="skeleton skeleton-button" style={{ width: 80, height: 40, marginBottom: 16 }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div className="skeleton skeleton-image" style={{ aspectRatio: '1', maxWidth: 360, borderRadius: 12 }} />
      <div>
        <div className="skeleton skeleton-heading" style={{ height: 28, width: '80%', marginBottom: 12 }} />
        <div className="skeleton skeleton-text" style={{ marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 24 }} />
        <div className="skeleton skeleton-button" style={{ width: 160, height: 48 }} />
      </div>
    </div>
  </div>
);

// Analysis results skeleton (Task 10001 H1)
export const SkeletonAnalysis: React.FC = () => (
  <div className="analysis-results" style={{ padding: '24px 16px' }}>
    <div className="results-container" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div className="skeleton" style={{ height: 120, borderRadius: 12, marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 200, borderRadius: 12, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  </div>
);

// History list skeleton (Task 10001 H1) – list rows only, parent provides header/filters
export const SkeletonHistoryList: React.FC = () => (
  <div className="skeleton-history-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} style={{ display: 'flex', gap: 16, padding: 16, background: 'var(--bg-white)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div className="skeleton" style={{ width: 80, height: 80, borderRadius: 8, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-text" style={{ marginBottom: 8 }} />
          <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 4 }} />
          <div className="skeleton skeleton-text" style={{ width: 40 }} />
        </div>
      </div>
    ))}
  </div>
);

// Page skeleton (common loading layout)
export const SkeletonPage: React.FC<{ title?: boolean; stats?: number; cards?: number }> = ({ 
  title = true,
  stats = 0,
  cards = 0 
}) => (
  <div className="page-content" style={{ padding: '40px 24px' }}>
    {title && (
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <SkeletonHeading style={{ margin: '0 auto 16px', width: '300px' }} />
        <SkeletonText style={{ margin: '0 auto', width: '400px' }} />
      </div>
    )}
    
    {stats > 0 && (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${Math.min(stats, 4)}, 1fr)`, 
        gap: '20px', 
        marginBottom: '40px',
        maxWidth: '1200px',
        margin: '0 auto 40px'
      }}>
        {Array.from({ length: stats }).map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>
    )}
    
    {cards > 0 && <SkeletonCardGrid count={cards} />}
  </div>
);

export default Skeleton;
