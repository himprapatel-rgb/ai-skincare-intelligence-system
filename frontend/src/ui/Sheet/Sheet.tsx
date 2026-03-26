import React, { useEffect, useRef, useCallback } from 'react';
import styles from './Sheet.module.css';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  snapPoints?: number[];
  children: React.ReactNode;
  className?: string;
}

export const Sheet = React.forwardRef<HTMLDivElement, SheetProps>(
  ({ open, onClose, snapPoints, children, className = '' }, ref) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLDivElement>) || sheetRef;

    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      },
      [onClose],
    );

    useEffect(() => {
      if (open) {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
      }
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }, [open, handleKeyDown]);

    useEffect(() => {
      if (open && combinedRef.current) {
        combinedRef.current.focus();
      }
    }, [open, combinedRef]);

    const maxSnap = snapPoints && snapPoints.length > 0
      ? Math.max(...snapPoints)
      : 80;

    return (
      <div
        className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      >
        <div
          ref={combinedRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          className={`${styles.sheet} ${open ? styles.sheetOpen : ''} ${className}`}
          style={{ '--sheet-height': `${maxSnap}vh` } as React.CSSProperties}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.handle} aria-hidden="true">
            <div className={styles.handleBar} />
          </div>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    );
  },
);

Sheet.displayName = 'Sheet';
