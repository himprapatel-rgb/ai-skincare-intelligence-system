/**
 * Client-side routine tracker: which steps are done today (AM and PM).
 * Stored in localStorage. Used by TODAY tab inline routine.
 */
const ROUTINE_KEY_PREFIX = 'today_routine_done_';
const MORNING_STEPS = ['Cleanser', 'Serum', 'Moisturizer', 'Sunscreen'];
const EVENING_STEPS = ['Cleanser', 'Treatment', 'Moisturizer'];

export type RoutineType = 'morning' | 'evening';

function getTodayKey(routine: RoutineType): string {
  const suffix = routine === 'evening' ? '_pm' : '';
  return ROUTINE_KEY_PREFIX + new Date().toISOString().slice(0, 10) + suffix;
}

export function getRoutineSteps(routine: RoutineType = 'morning'): string[] {
  return routine === 'evening' ? [...EVENING_STEPS] : [...MORNING_STEPS];
}

function getMaxSteps(routine: RoutineType): number {
  return routine === 'evening' ? EVENING_STEPS.length : MORNING_STEPS.length;
}

export function getCompletedStepsForToday(routine: RoutineType = 'morning'): Set<number> {
  try {
    const raw = localStorage.getItem(getTodayKey(routine));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    const arr = Array.isArray(parsed) ? parsed : [];
    const max = getMaxSteps(routine);
    return new Set(arr.filter((n) => typeof n === 'number' && n >= 0 && n < max));
  } catch {
    return new Set();
  }
}

export function setCompletedStepsForToday(completed: Set<number>, routine: RoutineType = 'morning'): void {
  try {
    localStorage.setItem(getTodayKey(routine), JSON.stringify([...completed]));
  } catch {
    /* ignore */
  }
}

export function toggleStepForToday(stepIndex: number, routine: RoutineType = 'morning'): Set<number> {
  const completed = getCompletedStepsForToday(routine);
  const max = getMaxSteps(routine);
  if (completed.has(stepIndex)) {
    completed.delete(stepIndex);
  } else {
    completed.add(stepIndex);
  }
  const filtered = new Set([...completed].filter((n) => n >= 0 && n < max));
  setCompletedStepsForToday(filtered, routine);
  return filtered;
}
