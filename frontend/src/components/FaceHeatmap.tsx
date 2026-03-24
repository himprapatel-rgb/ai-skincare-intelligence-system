// FaceHeatmap — Interactive SVG face zone map with severity coloring
import React, { useState } from 'react';
import './FaceHeatmap.css';

interface ZoneData {
  zone: string;
  concerns: Array<{ type: string; severity: string; confidence: number }>;
  texture_score?: number;
  notes?: string;
}

interface FaceHeatmapProps {
  zones?: ZoneData[];
  concerns?: Array<{ concern_type: string; severity: string; confidence: number; affected_areas?: string[] }>;
  overallScore?: number;
}

const ZONE_PATHS: Record<string, string> = {
  forehead: 'M60,18 C85,18 105,30 108,48 L108,58 C108,58 90,52 60,52 C30,52 12,58 12,58 L12,48 C15,30 35,18 60,18 Z',
  left_cheek: 'M12,62 C12,62 22,58 32,68 C38,74 36,90 32,98 C28,106 18,108 14,100 C10,92 8,72 12,62 Z',
  right_cheek: 'M108,62 C108,62 98,58 88,68 C82,74 84,90 88,98 C92,106 102,108 106,100 C110,92 112,72 108,62 Z',
  nose: 'M52,54 L68,54 L72,82 L65,88 L55,88 L48,82 Z',
  chin: 'M38,102 C38,102 44,98 60,98 C76,98 82,102 82,102 C82,114 74,128 60,128 C46,128 38,114 38,102 Z',
  under_eye_left: 'M22,58 C22,58 28,54 40,56 C42,56 44,60 42,64 C40,68 30,68 24,66 C20,64 20,60 22,58 Z',
  under_eye_right: 'M98,58 C98,58 92,54 80,56 C78,56 76,60 78,64 C80,68 90,68 96,66 C100,64 100,60 98,58 Z',
};

const ZONE_LABELS: Record<string, string> = {
  forehead: 'Forehead',
  left_cheek: 'Left Cheek',
  right_cheek: 'Right Cheek',
  nose: 'Nose',
  chin: 'Chin',
  under_eye_left: 'Left Under-Eye',
  under_eye_right: 'Right Under-Eye',
};

function getSeverityColor(severity?: string): string {
  switch (severity) {
    case 'severe': return 'rgba(239, 68, 68, 0.55)';
    case 'moderate': return 'rgba(249, 115, 22, 0.45)';
    case 'mild': return 'rgba(251, 191, 36, 0.4)';
    case 'light': return 'rgba(163, 230, 53, 0.35)';
    default: return 'rgba(34, 197, 94, 0.25)';
  }
}

function getZoneSeverity(
  zoneName: string,
  zones?: ZoneData[],
  concerns?: FaceHeatmapProps['concerns'],
): { severity: string; topConcern: string; confidence: number } | null {
  // Try zone_analysis data first
  if (zones) {
    const z = zones.find((zd) => zd.zone === zoneName);
    if (z && z.concerns.length > 0) {
      const top = z.concerns.sort((a, b) => b.confidence - a.confidence)[0];
      return { severity: top.severity, topConcern: top.type, confidence: top.confidence };
    }
  }

  // Fallback: map concerns to zones via affected_areas
  if (concerns) {
    const areaMap: Record<string, string[]> = {
      forehead: ['forehead', 't_zone'],
      left_cheek: ['cheeks', 'left_cheek'],
      right_cheek: ['cheeks', 'right_cheek'],
      nose: ['nose', 't_zone'],
      chin: ['chin'],
      under_eye_left: ['under_eyes', 'under_eye_left'],
      under_eye_right: ['under_eyes', 'under_eye_right'],
    };
    const areas = areaMap[zoneName] || [];
    const matching = concerns.filter(
      (c) => c.affected_areas?.some((a) => areas.includes(a))
    );
    if (matching.length > 0) {
      const top = matching.sort((a, b) => b.confidence - a.confidence)[0];
      return { severity: top.severity, topConcern: top.concern_type, confidence: top.confidence };
    }
  }

  return null;
}

export function FaceHeatmap({ zones, concerns, overallScore }: FaceHeatmapProps) {
  const [activeZone, setActiveZone] = useState<string | null>(null);

  const activeData = activeZone ? getZoneSeverity(activeZone, zones, concerns) : null;

  return (
    <div className="face-heatmap">
      <div className="face-heatmap-header">
        <h3 className="face-heatmap-title">Skin Zone Analysis</h3>
        {overallScore !== undefined && (
          <div className="face-heatmap-score">
            <span className="face-heatmap-score-value">{overallScore}</span>
            <span className="face-heatmap-score-label">/100</span>
          </div>
        )}
      </div>

      <div className="face-heatmap-body">
        <svg
          viewBox="0 0 120 145"
          className="face-heatmap-svg"
          aria-label="Face zone analysis map"
          role="img"
        >
          {/* Face outline */}
          <ellipse
            cx="60" cy="72" rx="52" ry="62"
            fill="none"
            stroke="var(--gray-200)"
            strokeWidth="1.5"
            opacity="0.5"
          />

          {/* Zone paths */}
          {Object.entries(ZONE_PATHS).map(([zone, path]) => {
            const data = getZoneSeverity(zone, zones, concerns);
            const isActive = activeZone === zone;
            return (
              <path
                key={zone}
                d={path}
                fill={data ? getSeverityColor(data.severity) : 'rgba(200, 200, 200, 0.15)'}
                stroke={isActive ? 'var(--primary)' : 'rgba(0,0,0,0.08)'}
                strokeWidth={isActive ? 2 : 0.8}
                className={`face-heatmap-zone ${isActive ? 'active' : ''}`}
                onClick={() => setActiveZone(activeZone === zone ? null : zone)}
                role="button"
                tabIndex={0}
                aria-label={`${ZONE_LABELS[zone]}: ${data ? `${data.topConcern} (${data.severity})` : 'Clear'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveZone(activeZone === zone ? null : zone);
                  }
                }}
              />
            );
          })}

          {/* Eye markers */}
          <circle cx="36" cy="60" r="3.5" fill="none" stroke="var(--gray-300)" strokeWidth="1" />
          <circle cx="84" cy="60" r="3.5" fill="none" stroke="var(--gray-300)" strokeWidth="1" />
          <circle cx="36" cy="60" r="1.5" fill="var(--gray-400)" />
          <circle cx="84" cy="60" r="1.5" fill="var(--gray-400)" />

          {/* Mouth */}
          <path d="M48,96 Q60,104 72,96" stroke="var(--gray-300)" strokeWidth="1" fill="none" />
        </svg>

        {/* Detail panel */}
        <div className="face-heatmap-detail">
          {activeZone && activeData ? (
            <div className="face-heatmap-info">
              <h4 className="face-heatmap-zone-name">{ZONE_LABELS[activeZone]}</h4>
              <div className="face-heatmap-concern-row">
                <span className={`face-heatmap-severity face-heatmap-severity--${activeData.severity}`}>
                  {activeData.severity}
                </span>
                <span className="face-heatmap-concern-type">
                  {activeData.topConcern.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="face-heatmap-confidence">
                <span className="face-heatmap-confidence-label">Confidence</span>
                <div className="face-heatmap-confidence-bar">
                  <div
                    className="face-heatmap-confidence-fill"
                    style={{ width: `${Math.round(activeData.confidence * 100)}%` }}
                  />
                </div>
                <span className="face-heatmap-confidence-value">
                  {Math.round(activeData.confidence * 100)}%
                </span>
              </div>
              {/* Zone-specific notes from AI */}
              {zones && (() => {
                const zd = zones.find((z) => z.zone === activeZone);
                return zd?.notes ? (
                  <p className="face-heatmap-notes">{zd.notes}</p>
                ) : null;
              })()}
            </div>
          ) : (
            <div className="face-heatmap-placeholder">
              <p>Tap a zone to see details</p>
            </div>
          )}

          {/* Legend */}
          <div className="face-heatmap-legend">
            <span className="legend-item">
              <span className="legend-dot" style={{ background: 'rgba(34, 197, 94, 0.6)' }} />
              Clear
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: 'rgba(251, 191, 36, 0.7)' }} />
              Mild
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: 'rgba(249, 115, 22, 0.7)' }} />
              Moderate
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: 'rgba(239, 68, 68, 0.7)' }} />
              Severe
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
