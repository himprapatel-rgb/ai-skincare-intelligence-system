import React from 'react';
import './ResponsiveGrid.css';

interface ResponsiveGridProps {
  children: React.ReactNode;
  /** Number of columns on desktop. Mobile is always 1-col, tablet is 2-col. */
  columns?: 2 | 3 | 4;
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Responsive CSS Grid component.
 *   Mobile:  1 column
 *   Tablet:  2 columns
 *   Desktop: 2/3/4 columns (configurable)
 */
export default function ResponsiveGrid({
  children,
  columns = 3,
  gap = 'md',
  className = '',
}: ResponsiveGridProps) {
  return (
    <div
      className={`responsive-grid responsive-grid--${columns}col responsive-grid--gap-${gap} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
