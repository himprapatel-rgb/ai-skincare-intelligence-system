// TrendSparkline — Lightweight mini chart showing score trend (last 5 scans)
import React, { useRef, useEffect } from 'react';
import { IconTrendingUp, IconTrendingDown, IconArrowRight } from './Icons';

interface TrendSparklineProps {
  /** Array of scores (most recent last) */
  scores: number[];
  /** Width in px */
  width?: number;
  /** Height in px */
  height?: number;
  /** Navigate to full history */
  onViewHistory?: () => void;
}

export function TrendSparkline({
  scores,
  width = 120,
  height = 40,
  onViewHistory,
}: TrendSparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const trend = scores.length >= 2
    ? scores[scores.length - 1] - scores[0]
    : 0;
  const trendDir = trend > 2 ? 'up' : trend < -2 ? 'down' : 'stable';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || scores.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const padX = 4;
    const padY = 6;
    const drawW = width - padX * 2;
    const drawH = height - padY * 2;

    const min = Math.min(...scores) - 5;
    const max = Math.max(...scores) + 5;
    const range = max - min || 1;

    const points: Array<[number, number]> = scores.map((s, i) => [
      padX + (i / (scores.length - 1)) * drawW,
      padY + drawH - ((s - min) / range) * drawH,
    ]);

    // Gradient fill
    const grad = ctx.createLinearGradient(0, padY, 0, height);
    if (trendDir === 'up') {
      grad.addColorStop(0, 'rgba(34, 197, 94, 0.2)');
      grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
    } else if (trendDir === 'down') {
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.15)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    } else {
      grad.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0)');
    }

    // Fill area
    ctx.beginPath();
    ctx.moveTo(points[0][0], height);
    points.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(points[points.length - 1][0], height);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    points.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = trendDir === 'up' ? '#22c55e' : trendDir === 'down' ? '#ef4444' : '#6366f1';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Last point dot
    const [lx, ly] = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lx, ly, 5, 0, Math.PI * 2);
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [scores, width, height, trendDir]);

  if (scores.length < 2) return null;

  return (
    <div className="trend-sparkline">
      <canvas
        ref={canvasRef}
        className="trend-sparkline-canvas"
        style={{ width, height }}
        aria-label={`Score trend: ${trendDir === 'up' ? 'improving' : trendDir === 'down' ? 'declining' : 'stable'}`}
        role="img"
      />
      <div className="trend-sparkline-meta">
        <span className={`trend-sparkline-badge trend-sparkline-badge--${trendDir}`}>
          {trendDir === 'up' && <IconTrendingUp size={14} strokeWidth={2} />}
          {trendDir === 'down' && <IconTrendingDown size={14} strokeWidth={2} />}
          {trendDir === 'stable' && <IconArrowRight size={14} strokeWidth={2} />}
          {trendDir === 'up' ? 'Improving' : trendDir === 'down' ? 'Declining' : 'Stable'}
        </span>
        {onViewHistory && (
          <button type="button" className="trend-sparkline-link" onClick={onViewHistory}>
            View history
          </button>
        )}
      </div>
    </div>
  );
}
