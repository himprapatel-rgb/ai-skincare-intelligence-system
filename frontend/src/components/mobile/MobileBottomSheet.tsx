/**
 * Mobile Bottom Sheet Component
 * iOS/Android-style modal that slides up from bottom
 */

import React, { useEffect, useRef, useState } from 'react';
import { triggerHaptic } from '../../utils/mobileOptimizations';
import './MobileBottomSheet.css';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  height?: 'auto' | 'half' | 'full';
  snapPoints?: number[];
  enableDrag?: boolean;
  showHandle?: boolean;
  className?: string;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  height = 'auto',
  enableDrag = true,
  showHandle = true,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startY, setStartY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      triggerHaptic('light');
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableDrag) return;
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !enableDrag) return;
    const currentY = e.touches[0].clientY;
    const offset = Math.max(0, currentY - startY);
    setDragOffset(offset);
  };

  const handleTouchEnd = () => {
    if (!enableDrag) return;
    setIsDragging(false);

    // Close if dragged down more than 100px
    if (dragOffset > 100) {
      triggerHaptic('medium');
      onClose();
    }

    setDragOffset(0);
    setStartY(0);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      triggerHaptic('light');
      onClose();
    }
  };

  if (!isOpen) return null;

  const sheetClasses = [
    'mobile-bottom-sheet',
    `mobile-bottom-sheet--${height}`,
    isDragging && 'mobile-bottom-sheet--dragging',
    className,
  ].filter(Boolean).join(' ');

  return (
    <>
      <div 
        className="mobile-bottom-sheet-backdrop"
        onClick={handleBackdropClick}
      />
      
      <div 
        ref={sheetRef}
        className={sheetClasses}
        style={{
          transform: `translateY(${dragOffset}px)`,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        {showHandle && (
          <div
            className="mobile-bottom-sheet-handle"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="mobile-bottom-sheet-handle-bar" />
          </div>
        )}

        {title && (
          <div className="mobile-bottom-sheet-header">
            <h2 id="bottom-sheet-title" className="mobile-bottom-sheet-title">
              {title}
            </h2>
          </div>
        )}

        <div className="mobile-bottom-sheet-content">
          {children}
        </div>
      </div>
    </>
  );
};
