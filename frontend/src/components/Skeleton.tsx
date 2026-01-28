import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  variant?: 'text' | 'title' | 'avatar' | 'card' | 'button' | 'image';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
}) => {
  const variantClass = `skeleton-${variant}`;
  const style: React.CSSProperties = {};
  
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={`skeleton ${variantClass} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

interface SkeletonCardProps {
  rows?: number;
  hasImage?: boolean;
  hasAvatar?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  rows = 3,
  hasImage = false,
  hasAvatar = false,
}) => {
  return (
    <div className="card card-padding">
      {hasImage && <Skeleton variant="image" className="mb-4" />}
      <div className="skeleton-row">
        {hasAvatar && <Skeleton variant="avatar" />}
        <div className="skeleton-col">
          <Skeleton variant="title" />
          <Skeleton variant="text" width="80%" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="text" width={`${90 - i * 10}%`} />
      ))}
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="skeleton-container">
      <div className="skeleton-stats">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton skeleton-stat-card" />
        ))}
      </div>
      <Skeleton variant="title" width="200px" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <SkeletonCard rows={4} />
        <SkeletonCard rows={4} />
      </div>
    </div>
  );
};

export default Skeleton;
