import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  beforeScore?: number;
  afterScore?: number;
}

/**
 * Before/After image comparison with draggable slider divider.
 * Uses CSS clip-path for GPU-accelerated clipping.
 */
export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  beforeScore,
  afterScore,
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Keyboard support
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setSliderPos(p => Math.max(5, p - 2));
    else if (e.key === 'ArrowRight') setSliderPos(p => Math.min(95, p + 2));
  }, []);

  const scoreDiff = beforeScore != null && afterScore != null ? afterScore - beforeScore : null;

  return (
    <div
      className="comparison-slider"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--border-radius-lg)', cursor: 'ew-resize', userSelect: 'none', touchAction: 'none' }}
    >
      {/* After image (full background) */}
      <img
        src={afterImage}
        alt={afterLabel}
        style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '1', objectFit: 'cover' }}
        draggable={false}
      />

      {/* Before image (clipped) */}
      <img
        src={beforeImage}
        alt={beforeLabel}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          objectFit: 'cover',
          clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
        }}
        draggable={false}
      />

      {/* Slider handle */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Comparison slider"
        aria-valuenow={Math.round(sliderPos)}
        aria-valuemin={5}
        aria-valuemax={95}
        onKeyDown={handleKeyDown}
        style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${sliderPos}%`,
          transform: 'translateX(-50%)',
          width: '3px',
          background: 'var(--white, #fff)',
          boxShadow: '0 0 8px rgba(0,0,0,0.4)',
          zIndex: 2,
        }}
      >
        {/* Handle grip */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '40px', height: '40px',
          borderRadius: '50%',
          background: 'var(--white, #fff)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700, color: 'var(--text-gray, #64748b)',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M8 6l-4 6 4 6" /><path d="M16 6l4 6-4 6" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div style={{
        position: 'absolute', top: '12px', left: '12px',
        background: 'rgba(0,0,0,0.6)', color: '#fff',
        padding: '4px 10px', borderRadius: 'var(--border-radius-md)',
        fontSize: '0.8rem', fontWeight: 600, zIndex: 3,
      }}>
        {beforeLabel}
      </div>
      <div style={{
        position: 'absolute', top: '12px', right: '12px',
        background: 'rgba(0,0,0,0.6)', color: '#fff',
        padding: '4px 10px', borderRadius: 'var(--border-radius-md)',
        fontSize: '0.8rem', fontWeight: 600, zIndex: 3,
      }}>
        {afterLabel}
      </div>

      {/* Score delta badge */}
      {scoreDiff != null && (
        <div style={{
          position: 'absolute', bottom: '12px', left: '50%',
          transform: 'translateX(-50%)',
          background: scoreDiff > 0 ? 'var(--success, #22c55e)' : scoreDiff < 0 ? 'var(--danger, #ef4444)' : 'var(--info, #3b82f6)',
          color: '#fff',
          padding: '6px 14px', borderRadius: 'var(--border-radius-xl)',
          fontSize: '0.85rem', fontWeight: 700, zIndex: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          {scoreDiff > 0 ? '+' : ''}{scoreDiff} pts
        </div>
      )}
    </div>
  );
};
