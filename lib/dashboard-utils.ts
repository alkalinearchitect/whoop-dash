// Shared dashboard utility functions for WHOOP dashboard
// Metric extraction helpers and signal generation

import type { Cycle, Recovery, SleepRecord } from "@/lib/whoop";
import { pct, safeNum, formatDuration, formatDate, computeStreak } from "@/lib/utils";

// Re-export for convenience so consumers can import everything from one place
export { pct, safeNum, formatDuration, formatDate, computeStreak };

// ─── Cycle Helpers ───────────────────────────────────────────────────────────

/**
 * Extract strain from a cycle record.
 */
export function cycleStrain(c: Cycle): number {
  return c?.score?.strain ?? 0;
}

// ─── Recovery Helpers ────────────────────────────────────────────────────────

/**
 * Extract recovery score (as percentage) from a recovery record.
 */
export function recoveryScore(r: Recovery): number {
  return pct(r?.score?.recovery_score) ?? 0;
}

/**
 * Extract HRV (RMSSD) from a recovery record.
 */
export function recoveryHRV(r: Recovery): number {
  return Math.round(r?.score?.hrv_rmssd ?? 0);
}

/**
 * Extract resting heart rate from a recovery record.
 */
export function recoveryRHR(r: Recovery): number {
  return Math.round(r?.score?.resting_heart_rate ?? 0);
}

/**
 * Extract SpO2 from a recovery record.
 */
export function recoverySpO2(r: Recovery): number {
  return r?.score?.spo2 ?? 0;
}

/**
 * Extract skin temperature (°C) from a recovery record.
 */
export function recoverySkinTemp(r: Recovery): number {
  return r?.score?.skin_temp_celsius ?? 0;
}

// ─── Sleep Helpers ───────────────────────────────────────────────────────────

/**
 * Extract sleep efficiency (as percentage) from a sleep record.
 */
export function sleepEfficiency(s: SleepRecord): number {
  return pct(s?.score?.sleep_efficiency_percentage) ?? 0;
}

/**
 * Extract sleep consistency (as percentage) from a sleep record.
 */
export function sleepConsistency(s: SleepRecord): number {
  return pct(s?.score?.sleep_consistency_percentage) ?? 0;
}

/**
 * Extract sleep performance (as percentage) from a sleep record.
 */
export function sleepPerformance(s: SleepRecord): number {
  return pct(s?.score?.sleep_performance_percentage) ?? 0;
}

/**
 * Extract respiratory rate from a sleep record.
 */
export function sleepRespiratoryRate(s: SleepRecord): number {
  return s?.score?.respiratory_rate ?? 0;
}

/**
 * Extract total time in bed (ms) from a sleep record.
 */
export function sleepInBed(s: SleepRecord): number {
  return s?.score?.stage_summary?.total_in_bed_time_milli ?? 0;
}

/**
 * Extract baseline sleep needed (ms) from a sleep record.
 */
export function sleepNeeded(s: SleepRecord): number {
  return s?.score?.sleep_needed?.baseline_milli ?? 0;
}

/**
 * Extract disturbance count from a sleep record.
 */
export function sleepDisturbances(s: SleepRecord): number {
  return s?.score?.stage_summary?.disturbance_count ?? 0;
}

// ─── Signal Generation ───────────────────────────────────────────────────────

interface DashboardData {
  cycles: Cycle[];
  recovery: Recovery[];
  sleep: SleepRecord[];
}

interface HealthSignal {
  id: string;
  type: "warning" | "info" | "success";
  message: string;
  icon: string;
  timestamp: string;
}

/**
 * Generate health signals from dashboard data.
 * Analyzes latest recovery, sleep, and cycle records to produce
 * actionable insights for the user.
 */
export function generateSignals(data: DashboardData): HealthSignal[] {
  const signals: HealthSignal[] = [];
  if (!data) return signals;

  const latestRecovery = data.recovery?.[0];
  const latestSleep = data.sleep?.[0];
  const latestCycle = data.cycles?.[0];

  if (latestRecovery) {
    const score = recoveryScore(latestRecovery);
    if (score > 0) {
      if (score < 33) signals.push({ id: "rec-low", type: "warning", message: `Recovery critically low at ${score}%. Prioritize rest today.`, icon: "alert", timestamp: new Date().toISOString() });
      else if (score < 50) signals.push({ id: "rec-mid", type: "info", message: `Recovery at ${score}%. Consider lighter training.`, icon: "info", timestamp: new Date().toISOString() });
      else signals.push({ id: "rec-high", type: "success", message: `Recovery strong at ${score}%. Ready to perform.`, icon: "check", timestamp: new Date().toISOString() });
    }
  }
  if (latestSleep) {
    const eff = sleepEfficiency(latestSleep);
    if (eff > 0 && eff < 85) signals.push({ id: "sleep-eff", type: "warning", message: `Sleep efficiency at ${eff}%. Review sleep hygiene.`, icon: "alert", timestamp: new Date().toISOString() });
  }
  if (latestCycle) {
    const strain = cycleStrain(latestCycle);
    if (strain > 18) signals.push({ id: "strain-high", type: "warning", message: `High strain (${strain.toFixed(1)}). Risk of overtraining.`, icon: "alert", timestamp: new Date().toISOString() });
  }
  return signals;
}
