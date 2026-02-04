/**
 * Task 100: Haptic feedback for important actions (scan capture, add to shelf, etc.)
 * Uses Vibration API when supported; no-op otherwise.
 */
const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

/** Light tap (e.g. button press) */
export function hapticLight(): void {
  if (canVibrate) {
    try {
      navigator.vibrate(10);
    } catch {
      /* ignore */
    }
  }
}

/** Medium feedback (e.g. success, add to shelf) */
export function hapticMedium(): void {
  if (canVibrate) {
    try {
      navigator.vibrate(20);
    } catch {
      /* ignore */
    }
  }
}

/** Double tap (e.g. scan capture) */
export function hapticCapture(): void {
  if (canVibrate) {
    try {
      navigator.vibrate([10, 50, 10]);
    } catch {
      /* ignore */
    }
  }
}
