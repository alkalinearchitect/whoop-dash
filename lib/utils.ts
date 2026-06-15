// Shared utility functions for WHOOP dashboard

/**
 * Convert a value to percentage.
 * WHOOP returns many scores as 0–1 floats; multiply by 100 for percentages.
 * Values already > 1 are assumed to be raw percentages.
 */
export function pct(val: number | null | undefined): number | null {
  if (val == null) return null;
  return val <= 1 ? Math.round(val * 100) : Math.round(val);
}

/**
 * Format a value to a safe display string.
 */
export function safeNum(val: number | null | undefined, decimals = 0): string {
  if (val == null) return "—";
  return decimals > 0 ? val.toFixed(decimals) : String(Math.round(val));
}

/**
 * Format milliseconds to human-readable duration (e.g. "2h 15m").
 */
export function formatDuration(ms: number): string {
  if (!ms) return "—";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

/**
 * Format milliseconds to hours display (e.g. "7h 22m").
 */
export function formatHours(ms: number): string {
  if (!ms) return "—";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

/**
 * Format an ISO date string to a readable format (e.g. "Mon, Jun 15").
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * Format an ISO date string to a short date (e.g. "Jun 15").
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * Compute a consecutive streak from an array of items.
 * Walks from the start (most recent) and counts how many consecutive items
 * meet the threshold condition without hitting a zero/missing value.
 *
 * The `getter` function is the single source of truth for extracting the
 * numeric value from each item. It handles score objects, raw numbers, etc.
 *
 * @param items - Array of items (ordered most-recent first)
 * @param getter - Function to extract the numeric value from each item
 * @param threshold - The threshold to compare against
 * @param above - If true, counts items >= threshold; if false, counts items <= threshold
 */
export function computeStreak<T>(
  items: T[],
  getter: (item: T) => number | null | undefined,
  threshold: number,
  above = true,
): number {
  let streak = 0;
  for (const item of items) {
    const val = getter(item);
    if (val == null || val === 0) break;
    if (above ? val >= threshold : val <= threshold) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ---------------------------------------------------------------------------
// Zone helpers
// ---------------------------------------------------------------------------

export interface ZoneInfo {
  label: string;
  color: string;
}

/**
 * Get strain zone info based on strain value.
 * 0–9: Recovery (#3b82f6)
 * 10–14: Build (#22c55e)
 * 15–18: Strain (#f59e0b)
 * 19+: Overreach (#ef4444)
 */
export function getStrainZone(strain: number): ZoneInfo {
  if (strain >= 19) return { label: "Overreach", color: "#ef4444" };
  if (strain >= 15) return { label: "Strain", color: "#f59e0b" };
  if (strain >= 10) return { label: "Build", color: "#22c55e" };
  return { label: "Recovery", color: "#3b82f6" };
}

/**
 * Get recovery zone info based on recovery score (percentage).
 * <33: Low (#ef4444)
 * 33–66: Moderate (#eab308)
 * >66: Optimal (#22c55e)
 */
export function getRecoveryZone(score: number): ZoneInfo {
  if (score > 66) return { label: "Optimal", color: "#22c55e" };
  if (score >= 33) return { label: "Moderate", color: "#eab308" };
  return { label: "Low", color: "#ef4444" };
}
