// Dashboard utility functions for WHOOP dashboard
// Metric extraction helpers and signal generation

import type { WhoopCycle as Cycle, WhoopRecovery as Recovery, WhoopSleep as SleepRecord } from "@/lib/whoop";

// ─── Safe number helpers ────────────────────────────────────────────────────

export function safeNum(v: number | null | undefined): number {
  return v != null ? v : 0;
}

export function pct(v: number | null | undefined, decimals = 0): number {
  if (v == null) return 0;
  const val = v <= 1 ? v * 100 : v;
  return Number(val.toFixed(decimals));
}

export function formatDuration(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h === 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatHours(ms: number): string {
  const h = Math.round(ms / 3600000 * 10) / 10;
  return `${h}h`;
}

// ─── Cycle Helpers ───────────────────────────────────────────────────────────

export function cycleStrain(c: Cycle): number {
  return c?.score?.strain ?? 0;
}

// ─── Recovery Helpers ────────────────────────────────────────────────────────

export function recoveryScore(r: Recovery): number {
  const v = r?.score?.recovery_score;
  if (v == null) return 0;
  return v <= 1 ? Math.round(v * 100) : Math.round(v);
}

export function recoveryHRV(r: Recovery): number {
  return r?.score?.hrv_rmssd ?? 0;
}

export function recoveryRHR(r: Recovery): number {
  return r?.score?.resting_heart_rate ?? 0;
}

// ─── Sleep Helpers ───────────────────────────────────────────────────────────

export function sleepEfficiency(s: SleepRecord): number {
  const v = s?.score?.sleep_efficiency_percentage;
  return v != null ? pct(v) : 0;
}

export function sleepConsistency(s: SleepRecord): number {
  const v = s?.score?.sleep_consistency_percentage;
  return v != null ? pct(v) : 0;
}

export function sleepPerformance(s: SleepRecord): number {
  const v = s?.score?.sleep_performance_percentage;
  return v != null ? pct(v) : 0;
}

export function sleepRespiratoryRate(s: SleepRecord): number {
  return s?.score?.respiratory_rate ?? 0;
}

export function sleepInBed(s: SleepRecord): number {
  return s?.score?.stage_summary?.total_in_bed_time_milli ?? 0;
}

export function sleepDisturbances(s: SleepRecord): number {
  return s?.score?.stage_summary?.disturbance_count ?? 0;
}

export function sleepActual(s: SleepRecord): number {
  const ss = s?.score?.stage_summary;
  if (!ss) return 0;
  return ss.total_rem_sleep_time_milli + ss.total_light_sleep_time_milli + ss.total_slow_wave_sleep_time_milli;
}

export function sleepNeeded(s: SleepRecord): number {
  const sn = s?.score?.sleep_needed;
  if (!sn) return 0;
  return sn.baseline_milli + sn.need_from_sleep_debt_milli + sn.need_from_recent_strain_milli + sn.need_from_recent_nap_milli;
}

export function sleepNeededBaseline(s: SleepRecord): number {
  return s?.score?.sleep_needed?.baseline_milli ?? 0;
}

export function sleepNeededDebt(s: SleepRecord): number {
  return s?.score?.sleep_needed?.need_from_sleep_debt_milli ?? 0;
}

export function sleepNeededStrain(s: SleepRecord): number {
  return s?.score?.sleep_needed?.need_from_recent_strain_milli ?? 0;
}

export function sleepNeededNap(s: SleepRecord): number {
  return s?.score?.sleep_needed?.need_from_recent_nap_milli ?? 0;
}

// ─── Strain zone helper ──────────────────────────────────────────────────────

export function getStrainZone(strain: number): { label: string; color: string } {
  if (strain < 8) return { label: "Light", color: "#00d4ff" };
  if (strain < 14) return { label: "Moderate", color: "#22c55e" };
  if (strain < 18) return { label: "Hard", color: "#f97316" };
  return { label: "Maximum", color: "#ef4444" };
}

export function getRecoveryZone(score: number): { label: string; color: string } {
  if (score >= 66) return { label: "Optimal", color: "#34d399" };
  if (score >= 33) return { label: "Moderate", color: "#fbbf24" };
  return { label: "Low", color: "#ef4444" };
}

// ─── Strain recommendation ───────────────────────────────────────────────────

export function getStrainRecommendation(recoveryScore: number): string {
  if (recoveryScore >= 66) return "Target 14-18 strain. Push into zones 3-4. Your body can handle it.";
  if (recoveryScore >= 33) return "Target 10-14 strain. Stay in zones 2-3. Save the intervals for tomorrow.";
  return "Target 0-8 strain. Light movement only. Walk, stretch, or rest.";
}

// ─── Streak calculator ───────────────────────────────────────────────────────
// Supports two signatures:
//   computeStreak(items) — counts consecutive items with recovery_score >= 66%
//   computeStreak(items, getValue, threshold, above=true) — custom

export function computeStreak(
  items: Array<any>,
  getValue?: (item: any) => number,
  threshold?: number,
  above?: boolean,
): number {
  if (!items?.length) return 0;

  // Simple mode: just count consecutive recovery >= 66%
  if (!getValue) {
    let streak = 0;
    for (const item of items) {
      const s = item?.score?.recovery_score;
      const pct = s != null ? (s <= 1 ? s * 100 : s) : 0;
      if (pct >= 66) streak++;
      else break;
    }
    return streak;
  }

  // Custom mode
  const thresh = threshold ?? 0;
  const isAbove = above !== false;
  let streak = 0;
  for (const item of items) {
    const val = getValue(item);
    if (isAbove ? val >= thresh : val <= thresh) streak++;
    else break;
  }
  return streak;
}

// ─── Signal generation ───────────────────────────────────────────────────────

export interface Signal {
  label: string;
  value: string;
  status: "good" | "warn" | "bad";
}

export function generateSignals(cycle: Cycle | null, sleep: SleepRecord | null): Signal[] {
  const signals: Signal[] = [];

  if (cycle?.score) {
    const rhr = cycle.score.resting_heart_rate;
    if (rhr != null) {
      signals.push({
        label: "Resting HR",
        value: `${rhr} bpm`,
        status: rhr < 55 ? "good" : rhr < 70 ? "warn" : "bad",
      });
    }

    const hrv = cycle.score.hrv_rmssd;
    if (hrv != null) {
      signals.push({
        label: "HRV",
        value: `${hrv} ms`,
        status: hrv > 50 ? "good" : hrv > 35 ? "warn" : "bad",
      });
    }
  }

  if (sleep?.score) {
    const perf = sleep.score.sleep_performance_percentage;
    if (perf != null) {
      const pct = perf <= 1 ? perf * 100 : perf;
      signals.push({
        label: "Sleep Performance",
        value: `${Math.round(pct)}%`,
        status: pct >= 85 ? "good" : pct >= 70 ? "warn" : "bad",
      });
    }
  }

  return signals;
}
