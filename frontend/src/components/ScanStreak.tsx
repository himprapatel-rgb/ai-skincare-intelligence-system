import React, { useMemo } from 'react';

interface ScanStreakProps {
  scanDates: string[];
  frequency?: 'weekly' | 'biweekly' | 'monthly';
}

const MILESTONES = [7, 14, 30, 60, 90, 180, 365];

/**
 * Scan streak & cadence tracker with milestone badges.
 * Calculates streaks based on configured frequency (default: weekly).
 */
export const ScanStreak: React.FC<ScanStreakProps> = ({
  scanDates,
  frequency = 'weekly',
}) => {
  const { currentStreak, longestStreak, nextMilestone, lastScanDaysAgo, totalScans } = useMemo(() => {
    if (scanDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, nextMilestone: 7, lastScanDaysAgo: null, totalScans: 0 };
    }

    const sorted = [...scanDates]
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    const windowDays = frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 14 : 30;
    const now = new Date();
    const daysSinceFirst = Math.floor((now.getTime() - sorted[sorted.length - 1].getTime()) / 86400000);
    const lastScanDaysAgo = Math.floor((now.getTime() - sorted[0].getTime()) / 86400000);

    // Count streak: how many consecutive windows have at least one scan
    let currentStreak = 0;
    let checkDate = new Date(now);

    // Check if user scanned within the current window
    const withinCurrentWindow = lastScanDaysAgo <= windowDays;
    if (!withinCurrentWindow) {
      return {
        currentStreak: 0,
        longestStreak: Math.min(scanDates.length, Math.ceil(daysSinceFirst / windowDays)),
        nextMilestone: MILESTONES.find(m => m > 0) || 7,
        lastScanDaysAgo,
        totalScans: scanDates.length,
      };
    }

    // Walk backward through windows
    for (let i = 0; i < 400; i++) {
      const windowStart = new Date(checkDate);
      windowStart.setDate(windowStart.getDate() - windowDays);
      const hasScan = sorted.some(d => d >= windowStart && d <= checkDate);
      if (hasScan) {
        currentStreak++;
        checkDate = new Date(windowStart);
      } else {
        break;
      }
    }

    // Calculate longest streak similarly (simplified)
    const longest = currentStreak;

    const nextMilestone = MILESTONES.find(m => m > currentStreak) || currentStreak + 30;

    return { currentStreak, longestStreak: longest, nextMilestone, lastScanDaysAgo, totalScans: scanDates.length };
  }, [scanDates, frequency]);

  const progressToMilestone = nextMilestone > 0 ? Math.min(100, (currentStreak / nextMilestone) * 100) : 0;
  const streakActive = currentStreak > 0;
  const frequencyLabel = frequency === 'weekly' ? 'week' : frequency === 'biweekly' ? '2-week' : 'month';

  return (
    <div className="scan-streak" style={{
      background: 'var(--bg-white)', border: '1px solid var(--border)',
      borderRadius: 'var(--border-radius-lg)', padding: '20px',
      boxShadow: 'var(--shadow)', transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          fontSize: '2rem', lineHeight: 1,
          filter: streakActive ? 'none' : 'grayscale(1) opacity(0.4)',
        }}>
          {currentStreak >= 30 ? '\u{1F525}' : currentStreak >= 7 ? '\u{2B50}' : '\u{1F4F7}'}
        </div>
        <div>
          <div style={{
            fontSize: '1.5rem', fontWeight: 700,
            color: streakActive ? 'var(--primary)' : 'var(--text-gray)',
          }}>
            {currentStreak} {frequencyLabel} streak
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>
            {streakActive
              ? `${totalScans} total scans`
              : 'Scan to start your streak!'}
          </div>
        </div>
      </div>

      {/* Progress ring to next milestone */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '0.8rem', color: 'var(--text-gray)', marginBottom: '4px',
        }}>
          <span>Progress to {nextMilestone}-{frequencyLabel} milestone</span>
          <span>{currentStreak}/{nextMilestone}</span>
        </div>
        <div style={{
          height: '8px', borderRadius: '4px',
          background: 'var(--bg-light)', overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            height: '100%', borderRadius: '4px',
            width: `${progressToMilestone}%`,
            background: 'linear-gradient(90deg, var(--success) 0%, var(--primary) 100%)',
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Milestone badges */}
      <div style={{
        display: 'flex', gap: '8px', flexWrap: 'wrap',
      }}>
        {MILESTONES.filter(m => m <= 90).map(m => {
          const achieved = currentStreak >= m;
          return (
            <div key={m} style={{
              padding: '4px 10px', borderRadius: 'var(--border-radius-xl)',
              fontSize: '0.75rem', fontWeight: 600,
              background: achieved ? 'var(--primary-light, rgba(31,111,235,0.1))' : 'var(--bg-light)',
              color: achieved ? 'var(--primary)' : 'var(--text-gray)',
              border: `1px solid ${achieved ? 'var(--primary)' : 'var(--border)'}`,
              opacity: achieved ? 1 : 0.5,
            }}>
              {m === 7 ? '1w' : m === 14 ? '2w' : m === 30 ? '1mo' : m === 60 ? '2mo' : m === 90 ? '3mo' : `${m}d`}
              {achieved && ' \u2713'}
            </div>
          );
        })}
      </div>

      {lastScanDaysAgo != null && lastScanDaysAgo > 0 && (
        <div style={{
          marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-gray)',
          fontStyle: 'italic',
        }}>
          Last scan: {lastScanDaysAgo === 1 ? 'yesterday' : `${lastScanDaysAgo} days ago`}
        </div>
      )}
    </div>
  );
};
