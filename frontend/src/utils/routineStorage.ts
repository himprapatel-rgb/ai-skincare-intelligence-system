/**
 * Client-side routine tracker: which steps are done today (AM routine).
 * Stored in localStorage. Used by TODAY tab inline routine.
 */
const ROUTINE_KEY_PREFIX = 'today_routine_done_';
const DEFAULT_STEPS = ['Cleanser', 'Serum', 'Moisturizer', 'Sunscreen'];

function getTodayKey(): string {
  return ROUTINE_KEY_PREFIX + new Date().toISOString().slice(0, 10);
}

export function getRoutineSteps(): string[] {
  return [...DEFAULT_STEPS];
}

export function getCompletedStepsForToday(): Set<number> {
  try {
    const raw = localStorage.getItem(getTodayKey());
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    const arr = Array.isArray(parsed) ? parsed : [];
    return new Set(arr.filter((n) => typeof n === 'number' && n >= 0 && n < DEFAULT_STEPS.length));
  } catch {
    return new Set();
  }
}

export function setCompletedStepsForToday(completed: Set<number>): void {
  try {
    localStorage.setItem(getTodayKey(), JSON.stringify([...completed]));
  } catch {
    /* ignore */
  }
}

export function toggleStepForToday(stepIndex: number): Set<number> {
  const completed = getCompletedStepsForToday();
  if (completed.has(stepIndex)) {
    completed.delete(stepIndex);
  } else {
    completed.add(stepIndex);
  }
  setCompletedStepsForToday(completed);
  return new Set(completed);
}
