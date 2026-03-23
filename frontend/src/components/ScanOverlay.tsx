// ScanOverlay — AR-style concern zone overlay on live camera feed
// Uses MediaPipe 468 landmarks to draw translucent colored zones

export interface FaceZone {
  name: string;
  label: string;
  color: string;
  landmarks: number[];
}

// MediaPipe face landmark index groups for each face zone
const FACE_ZONES: FaceZone[] = [
  {
    name: 'forehead',
    label: 'Forehead',
    color: 'rgba(59, 130, 246, 0.18)',
    landmarks: [10, 67, 109, 108, 69, 104, 68, 71, 21, 54, 103, 67, 109, 10, 338, 297, 332, 284, 251, 301, 298, 333, 299, 337],
  },
  {
    name: 'left_cheek',
    label: 'Left Cheek',
    color: 'rgba(244, 114, 182, 0.18)',
    landmarks: [116, 117, 118, 119, 120, 121, 126, 142, 36, 205, 187, 123, 116],
  },
  {
    name: 'right_cheek',
    label: 'Right Cheek',
    color: 'rgba(244, 114, 182, 0.18)',
    landmarks: [345, 346, 347, 348, 349, 350, 355, 371, 266, 425, 411, 352, 345],
  },
  {
    name: 'nose',
    label: 'Nose',
    color: 'rgba(251, 191, 36, 0.18)',
    landmarks: [168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 164, 0, 11, 12, 13, 14, 15, 16, 17, 18, 200, 199, 175],
  },
  {
    name: 'chin',
    label: 'Chin',
    color: 'rgba(139, 92, 246, 0.18)',
    landmarks: [152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10],
  },
  {
    name: 'under_eye_left',
    label: 'Under Eye',
    color: 'rgba(99, 102, 241, 0.22)',
    landmarks: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  },
  {
    name: 'under_eye_right',
    label: 'Under Eye',
    color: 'rgba(99, 102, 241, 0.22)',
    landmarks: [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466],
  },
];

interface ScanOverlayProps {
  landmarks: Array<{ x: number; y: number; z: number }> | null;
  canvasWidth: number;
  canvasHeight: number;
  ctx: CanvasRenderingContext2D;
  activeZones?: string[];
}

/**
 * Draw AR-style face zone overlays on the existing HUD canvas.
 * Call this from the face tracking render loop.
 */
export function drawScanOverlay({
  landmarks,
  canvasWidth,
  canvasHeight,
  ctx,
  activeZones,
}: ScanOverlayProps): void {
  if (!landmarks || landmarks.length < 468) return;

  const zonesToDraw = activeZones
    ? FACE_ZONES.filter((z) => activeZones.includes(z.name))
    : FACE_ZONES;

  for (const zone of zonesToDraw) {
    drawZone(ctx, landmarks, zone, canvasWidth, canvasHeight);
  }
}

function drawZone(
  ctx: CanvasRenderingContext2D,
  landmarks: Array<{ x: number; y: number }>,
  zone: FaceZone,
  w: number,
  h: number,
): void {
  if (zone.landmarks.length < 3) return;

  ctx.save();
  ctx.beginPath();

  const firstIdx = zone.landmarks[0];
  const first = landmarks[firstIdx];
  if (!first) { ctx.restore(); return; }

  ctx.moveTo(first.x * w, first.y * h);

  for (let i = 1; i < zone.landmarks.length; i++) {
    const idx = zone.landmarks[i];
    const pt = landmarks[idx];
    if (!pt) continue;
    ctx.lineTo(pt.x * w, pt.y * h);
  }

  ctx.closePath();
  ctx.fillStyle = zone.color;
  ctx.fill();

  // Zone border
  ctx.strokeStyle = zone.color.replace(/[\d.]+\)$/, '0.4)');
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a floating label near a face zone centroid.
 */
export function drawZoneLabel(
  ctx: CanvasRenderingContext2D,
  landmarks: Array<{ x: number; y: number }>,
  zone: FaceZone,
  label: string,
  w: number,
  h: number,
): void {
  // Compute centroid
  let cx = 0, cy = 0, count = 0;
  for (const idx of zone.landmarks) {
    const pt = landmarks[idx];
    if (!pt) continue;
    cx += pt.x;
    cy += pt.y;
    count++;
  }
  if (count === 0) return;
  cx = (cx / count) * w;
  cy = (cy / count) * h;

  ctx.save();
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(label);
  const padX = 8;
  const padY = 4;
  const bw = metrics.width + padX * 2;
  const bh = 20;

  // Background pill
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, bh / 2);
  ctx.fill();

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, cx, cy);
  ctx.restore();
}

export { FACE_ZONES };
