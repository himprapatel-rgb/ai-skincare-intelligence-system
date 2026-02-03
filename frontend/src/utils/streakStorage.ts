/**
 * Client-side streak: consecutive days user checked in (opened TODAY or completed routine).
 * Stored in localStorage. Used by TODAY tab.
 */
const STREAK_KEY = 'today_streak_checkins';

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getStoredDates(): string[] {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((d) => typeof d === 'string') : [];
  } catch {
    return [];
  }
}

function setStoredDates(dates: string[]) {
  try {
    const unique = [...new Set(dates)].sort();
    localStorage.setItem(STREAK_KEY, JSON.stringify(unique));
  } catch {
    /* ignore */
  }
}

/** Add today as a check-in if not already. Returns updated streak. */
export function checkInToday(): number {
  const today = getToday();
  const dates = getStoredDates();
  if (dates.includes(today)) return computeStreak(dates);
  setStoredDates([...dates, today]);
  return computeStreak([...dates, today]);
}

/** Get current streak (consecutive days ending at today or yesterday). */
export function getStreak(): number {
  return computeStreak(getStoredDates());
}

/** Compute streak: consecutive days ending at the most recent check-in. */
function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  const mostRecent = sorted[sorted.length - 1];
  const end = new Date(mostRecent + 'T12:00:00Z');
  let count = 0;
  const check = new Date(end);
  for (;;) {
    const key = check.toISOString().slice(0, 10);
    if (!sorted.includes(key)) break;
    count++;
    check.setUTCDate(check.getUTCDate() - 1);
  }
  return count;
}

export function hasCheckedInToday(): boolean {
  return getStoredDates().includes(getToday());
}
