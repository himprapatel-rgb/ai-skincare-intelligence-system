import React, { useState } from 'react';
import styles from './Avatar.module.css';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string;
  fallback: string;
  size?: AvatarSize;
  alt?: string;
  className?: string;
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, fallback, size = 'md', alt, className = '' }, ref) => {
    const [imgError, setImgError] = useState(false);
    const px = sizeMap[size];
    const showImage = src && !imgError;
    const initials = getInitials(fallback);
    const bgColor = stringToColor(fallback);

    return (
      <div
        ref={ref}
        className={`${styles.avatar} ${styles[size]} ${className}`}
        style={{
          width: px,
          height: px,
          fontSize: px * 0.38,
          backgroundColor: showImage ? undefined : bgColor,
        }}
        role="img"
        aria-label={alt || fallback}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || fallback}
            className={styles.image}
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={styles.initials} aria-hidden="true">
            {initials}
          </span>
        )}
      </div>
    );
  },
);

Avatar.displayName = 'Avatar';
