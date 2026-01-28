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
