"use client";

import { useMemo } from "react";
import { Heart, Activity, Moon } from "lucide-react";

interface RecoveryBreakdownProps {
  recovery: {
    score?: { recovery_score?: number | null; hrv_rmssd?: number | null; resting_heart_rate?: number | null } | null;
    recovery_score?: number | null;
    hrv_rmssd?: number | null;
    resting_heart_rate?: number | null;
  } | null;
  sleepPerformance?: number | null;
  loading?: boolean;
}

function pct(val: number | null | undefined): number {
  if (val == null) return 0;
  return val <= 1 ? Math.round(val * 100) : Math.round(val);
}

interface BreakdownBar {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  glowColor: string;
  icon: React.ReactNode;
  status: "optimal" | "moderate" | "low";
  statusLabel: string;
}

function getHRVStatus(val: number): { status: "optimal" | "moderate" | "low"; label: string } {
  if (val >= 50) return { status: "optimal", label: "Optimal" };
  if (val >= 30) return { status: "moderate", label: "Moderate" };
  return { status: "low", label: "Low" };
}

function getRHRStatus(val: number): { status: "optimal" | "moderate" | "low"; label: string } {
  if (val <= 50) return { status: "optimal", label: "Optimal" };
  if (val <= 60) return { status: "moderate", label: "Moderate" };
  return { status: "low", label: "Elevated" };
}

function getSleepStatus(val: number): { status: "optimal" | "moderate" | "low"; label: string } {
  if (val >= 85) return { status: "optimal", label: "Optimal" };
  if (val >= 60) return { status: "moderate", label: "Moderate" };
  return { status: "low", label: "Low" };
}

const STATUS_COLORS = {
  optimal: { bar: "#22c55e", text: "text-green-400", bg: "bg-green-400/10" },
  moderate: { bar: "#eab308", text: "text-yellow-400", bg: "bg-yellow-400/10" },
  low: { bar: "#ef4444", text: "text-red-400", bg: "bg-red-400/10" },
};

export function RecoveryBreakdown({ recovery, sleepPerformance, loading }: RecoveryBreakdownProps) {
  const bars: BreakdownBar[] = useMemo(() => {
    if (!recovery) return [];

    const hrv = recovery.score?.hrv_rmssd ?? recovery.hrv_rmssd ?? 0;
    const rhr = recovery.score?.resting_heart_rate ?? recovery.resting_heart_rate ?? 0;
    const hrvStatus = getHRVStatus(hrv);
    const rhrStatus = getRHRStatus(rhr);
    const sleepPerf = sleepPerformance ?? (recovery.score?.recovery_score != null ? pct(recovery.score.recovery_score) : recovery.recovery_score != null ? pct(recovery.recovery_score) : 0);
    const sleepStatus = getSleepStatus(sleepPerf <= 1 ? sleepPerf * 100 : sleepPerf);

    return [
      {
        label: "HRV",
        value: Math.round(hrv),
        max: 100,
        unit: "ms",
        color: "#06b6d4",
        glowColor: "rgba(6,182,212,0.3)",
        icon: <Heart className="w-3.5 h-3.5" />,
        status: hrvStatus.status,
        statusLabel: hrvStatus.label,
      },
      {
        label: "Resting HR",
        value: Math.round(rhr),
        max: 80,
        unit: "bpm",
        color: "#ef4444",
        glowColor: "rgba(239,68,68,0.3)",
        icon: <Activity className="w-3.5 h-3.5" />,
        status: rhrStatus.status,
        statusLabel: rhrStatus.label,
      },
      {
        label: "Sleep Performance",
        value: Math.round(sleepPerf <= 1 ? sleepPerf * 100 : sleepPerf),
        max: 100,
        unit: "%",
        color: "#8b5cf6",
        glowColor: "rgba(139,92,246,0.3)",
        icon: <Moon className="w-3.5 h-3.5" />,
        status: sleepStatus.status,
        statusLabel: sleepStatus.label,
      },
    ];
  }, [recovery, sleepPerformance]);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
        <div className="h-8 w-48 rounded-lg bg-white/[0.06] mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-white/90">Recovery Breakdown</h3>
        <p className="mt-0.5 text-xs text-white/40">Key metrics driving your recovery score</p>
      </div>

      <div className="space-y-4">
        {bars.map((bar) => {
          const pct = Math.min((bar.value / bar.max) * 100, 100);
          const statusColor = STATUS_COLORS[bar.status];

          return (
            <div key={bar.label} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${bar.color}15` }}>
                    <span style={{ color: bar.color }}>{bar.icon}</span>
                  </div>
                  <span className="text-xs font-medium text-white/70">{bar.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white/80">
                    {bar.value}<span className="text-xs text-white/40 ml-0.5">{bar.unit}</span>
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${statusColor.bg} ${statusColor.text}`}>
                    {bar.statusLabel}
                  </span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: bar.color,
                    boxShadow: `0 0 12px ${bar.glowColor}`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary insight */}
      <div className="mt-5 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
        <p className="text-[10px] text-white/35 leading-relaxed">
          {bars.length >= 3 && bars[0].status === "optimal" && bars[1].status === "optimal" && bars[2].status === "optimal" ? (
            <>All metrics are in the optimal range. Your body is fully recovered and ready for high performance.</>
          ) : bars.some(b => b.status === "low") ? (
            <>One or more metrics need attention. Focus on sleep quality and active recovery to improve today.</>
          ) : (
            <>Metrics are moderate. A good day for steady-state training rather than max effort.</>
          )}
        </p>
      </div>
    </div>
  );
}
