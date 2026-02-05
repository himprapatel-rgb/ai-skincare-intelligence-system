/**
 * Mobile Skeleton Loader
 * Professional loading states for better perceived performance
 */

import React from 'react';
import './MobileSkeleton.css';

interface MobileSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

export const MobileSkeleton: React.FC<MobileSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'wave',
  className = '',
}) => {
  const style: React.CSSProperties = {};
  
  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  
  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  const skeletonClasses = [
    'mobile-skeleton',
    `mobile-skeleton--${variant}`,
    `mobile-skeleton--${animation}`,
    className,
  ].filter(Boolean).join(' ');

  return <div className={skeletonClasses} style={style} aria-busy="true" aria-live="polite" />;
};

// Pre-built skeleton patterns
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`skeleton-card ${className || ''}`}>
    <MobileSkeleton variant="rounded" height={200} />
    <div className="skeleton-card__content">
      <MobileSkeleton variant="text" width="80%" />
      <MobileSkeleton variant="text" width="60%" />
      <MobileSkeleton variant="text" width="40%" />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({ 
  count = 5,
  className 
}) => (
  <div className={`skeleton-list ${className || ''}`}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="skeleton-list__item">
        <MobileSkeleton variant="circular" width={48} height={48} />
        <div className="skeleton-list__content">
          <MobileSkeleton variant="text" width="70%" />
          <MobileSkeleton variant="text" width="50%" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonProductGrid: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="skeleton-product-grid">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="skeleton-product-card">
        <MobileSkeleton variant="rounded" height={180} />
        <MobileSkeleton variant="text" width="90%" />
        <MobileSkeleton variant="text" width="60%" />
      </div>
    ))}
  </div>
);
