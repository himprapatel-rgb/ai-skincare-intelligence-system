/**
 * Format a date string as relative time (e.g. "2 min ago", "Yesterday").
 */
export function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const now = Date.now();
  const diff = now - d.getTime();
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return 'Just now';
  if (diff < hour) {
    const m = Math.floor(diff / min);
    return `${m} min ago`;
  }
  if (diff < day) {
    const h = Math.floor(diff / hour);
    return `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  if (diff < 2 * day) return 'Yesterday';
  if (diff < 7 * day) {
    const days = Math.floor(diff / day);
    return `${days} days ago`;
  }
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}
