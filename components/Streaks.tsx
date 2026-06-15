"use client";

import { useMemo } from "react";
import { Flame, Moon, Target, Zap } from "lucide-react";
import type { Cycle, Recovery, SleepRecord } from "../lib/whoop";

interface StreaksProps {
  cycles?: Cycle[];
  recovery?: Recovery[];
  sleep?: SleepRecord[];
  loading?: boolean;
}

interface StreakData {
  type: "recovery" | "sleep" | "strain" | "strainOptimal";
  label: string;
  icon: React.ReactNode;
  count: number;
  color: string;
  bgColor: string;
  threshold: string;
}

function pct(val: number | null | undefined): number | null {
  if (val == null) return null;
  return val <= 1 ? Math.round(val * 100) : Math.round(val);
}

function computeStreak(items: any[], getter: (item: any) => number, threshold: number, above = true): number {
  let streak = 0;
  for (const item of items) {
    const val = getter(item);
    if (val === 0) break;
    if (above ? val >= threshold : val <= threshold) streak++;
    else break;
  }
  return streak;
}

export function Streaks({ cycles, recovery, sleep, loading }: StreaksProps) {
  const streaks: StreakData[] = useMemo(() => {
    const recoveryStreak = recovery
      ? computeStreak(recovery, (r: any) => {
          if (r?.score?.recovery_score != null) return pct(r.score.recovery_score) ?? 0;
          if (r?.recovery_score != null) return pct(r.recovery_score) ?? 0;
          return 0;
        }, 66)
      : 0;

    const sleepStreak = sleep
      ? computeStreak(sleep, (s: any) => {
          if (s?.score?.sleep_efficiency_percentage != null) return pct(s.score.sleep_efficiency_percentage) ?? 0;
          if (s?.sleep_efficiency_percentage != null) return pct(s.sleep_efficiency_percentage) ?? 0;
          return 0;
        }, 85)
      : 0;

    const strainStreak = cycles
      ? computeStreak(cycles, (c: any) => c?.score?.strain ?? c?.strain ?? 0, 10, false)
      : 0;

    const strainOptimalStreak = cycles
      ? computeStreak(cycles, (c: any) => c?.score?.strain ?? c?.strain ?? 0, 14)
      : 0;

    return [
      {
        type: "recovery",
        label: "Recovery >66%",
        icon: <Flame className="w-4 h-4" />,
        count: recoveryStreak,
        color: "#22c55e",
        bgColor: "bg-green-500/10",
        threshold: ">66%",
      },
      {
        type: "sleep",
        label: "Sleep >85% eff",
        icon: <Moon className="w-4 h-4" />,
        count: sleepStreak,
        color: "#6366f1",
        bgColor: "bg-indigo-500/10",
        threshold: ">85%",
      },
      {
        type: "strain",
        label: "Low strain <10",
        icon: <Target className="w-4 h-4" />,
        count: strainStreak,
        color: "#3b82f6",
        bgColor: "bg-blue-500/10",
        threshold: "<10",
      },
      {
        type: "strainOptimal",
        label: "Optimal strain 10-14",
        icon: <Zap className="w-4 h-4" />,
        count: strainOptimalStreak,
        color: "#f59e0b",
        bgColor: "bg-amber-500/10",
        threshold: "10-14",
      },
    ];
  }, [cycles, recovery, sleep]);

  const activeStreaks = streaks.filter(s => s.count > 0);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
        <div className="h-8 w-32 rounded-lg bg-white/[0.06] mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      </div>
    );
  }

  if (activeStreaks.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white/90">Streak Tracking</h3>
          <p className="mt-0.5 text-xs text-white/40">Build consistency to unlock streaks</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-sm font-medium text-white/60">No active streaks yet</p>
            <p className="text-[10px] text-white/30">Keep your recovery above 66% to start building</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white/90">🔥 Streak Tracking</h3>
          <p className="mt-0.5 text-xs text-white/40">{activeStreaks.length} active streak{activeStreaks.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {streaks.map((streak) => (
          <div
            key={streak.type}
            className={`relative overflow-hidden rounded-xl border border-white/[0.04] p-4 transition-all duration-300 ${
              streak.count > 0 ? "bg-white/[0.03] hover:bg-white/[0.05]" : "bg-white/[0.01] opacity-40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span style={{ color: streak.color }}>{streak.icon}</span>
                <span className="text-[10px] font-medium text-white/50">{streak.label}</span>
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold" style={{ color: streak.color }}>
                {streak.count}
              </span>
              <span className="text-xs text-white/30">day{streak.count !== 1 ? "s" : ""}</span>
            </div>
            {streak.count > 0 && (
              <div
                className="absolute bottom-0 left-0 h-0.5"
                style={{
                  width: `${Math.min(streak.count * 10, 100)}%`,
                  backgroundColor: streak.color,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Best streak highlight */}
      {activeStreaks.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.04] p-3 flex items-center gap-3">
          <span className="text-lg">🏆</span>
          <div>
            <p className="text-xs font-medium text-amber-400/80">
              Best streak: {Math.max(...activeStreaks.map(s => s.count))} days
            </p>
            <p className="text-[10px] text-white/30">
              {activeStreaks.length >= 3
                ? "Elite consistency. You're building serious momentum."
                : activeStreaks.length >= 2
                ? "Great progress. Keep building those habits."
                : "Good start. Aim for 7+ days to build the habit."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
