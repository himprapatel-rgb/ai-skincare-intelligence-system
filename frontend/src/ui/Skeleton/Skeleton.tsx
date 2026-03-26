import React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  variant?: 'text' | 'circle' | 'card' | 'rect';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
}) => {
  const cls = [styles.skeleton, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;

  if (count <= 1) {
    return <div className={cls} style={style} aria-hidden="true" />;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${cls} ${styles.item}`}
          style={{
            ...style,
            // Last text line is shorter for visual variety
            ...(variant === 'text' && i === count - 1 && count > 1
              ? { width: '70%' }
              : {}),
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
};
