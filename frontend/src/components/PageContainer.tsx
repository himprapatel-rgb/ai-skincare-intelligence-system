import React from 'react';
import './PageContainer.css';

interface PageContainerProps {
  children: React.ReactNode;
  variant?: 'narrow' | 'medium' | 'wide' | 'full';
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Consistent responsive page content wrapper.
 * Handles max-width, centering, padding, and safe-area insets.
 *
 * Variants:
 *   narrow  — 520px (forms, single-column content)
 *   medium  — 768px (default, most pages)
 *   wide    — 1200px (dashboards, grids)
 *   full    — 100% (scan, immersive views)
 */
export default function PageContainer({
  children,
  variant = 'medium',
  className = '',
  as: Tag = 'div',
}: PageContainerProps) {
  return (
    <Tag className={`page-container page-container--${variant} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
