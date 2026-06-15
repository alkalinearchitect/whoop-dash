// Shared utility functions for WHOOP dashboard

/**
 * Convert a value to percentage.
 * WHOOP returns many scores as 0–1 floats; multiply by 100 for percentages.
 */
export function pct(val: number | null | undefined): number | null {
  if (val == null) return null;
  return val <= 1 ? Math.round(val * 100) : Math.round(val);
}

/**
 * Format a value to a safe display string.
 */
export function safeNum(val: number | null | undefined, decimals = 0): string {
  if (val == null) return '—';
  return decimals > 0 ? val.toFixed(decimals) : String(Math.round(val));
}

/**
 * Format milliseconds to human-readable duration.
 */
export function formatDuration(ms: number): string {
  if (!ms) return '—';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

/**
 * Format an ISO date string to a readable format.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Format an ISO date string to a short date (no weekday).
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Compute a consecutive streak from an array of items.
 * Walks from the start (most recent) and counts how many consecutive items
 * meet the threshold condition without hitting a zero/missing value.
 */
export function computeStreak<T>(
  items: T[],
  getter: (item: T) => number,
  threshold: number,
  above = true,
): number {
  let streak = 0;
  for (const item of items) {
    const val = getter(item);
    if (val === 0) break;
    if (above ? val >= threshold : val <= threshold) streak++;
    else break;
  }
  return streak;
}
