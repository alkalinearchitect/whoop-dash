"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { WhoopSleep } from "../lib/whoop";

interface SleepScoreChartProps {
  sleep: WhoopSleep | null;
  explanation: string;
  loading?: boolean;
}

const STAGE_COLORS: Record<string, string> = {
  rem: "#a78bfa",
  light: "#06b6d4",
  slowWave: "#6366f1",
  awake: "#ef4444",
};

function fmt(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function SleepScoreChart({ sleep, explanation, loading = false }: SleepScoreChartProps) {
  const { stages, perf, efficiency, totalMs } = useMemo(() => {
    const s = sleep?.score?.stage_summary;
    if (!s) return { stages: [], perf: 0, efficiency: 0, totalMs: 0 };

    const items = [
      { name: "REM",        ms: s.total_rem_sleep_time_milli,            color: STAGE_COLORS.rem },
      { name: "Light",      ms: s.total_light_sleep_time_milli,          color: STAGE_COLORS.light },
      { name: "Deep (SWS)", ms: s.total_slow_wave_sleep_time_milli,      color: STAGE_COLORS.slowWave },
      { name: "Awake",      ms: s.total_awake_time_milli,                color: STAGE_COLORS.awake },
    ].filter(i => i.ms > 0);

    const total = s.total_in_bed_time_milli || 1;
    const perfVal = sleep?.score?.sleep_performance_percentage;
    const effVal = sleep?.score?.sleep_efficiency_percentage;

    return {
      stages: items.map(i => ({ ...i, pct: Math.round((i.ms / total) * 100) })),
      perf: perfVal != null ? (perfVal <= 1 ? Math.round(perfVal * 100) : Math.round(perfVal)) : 0,
      efficiency: effVal != null ? (effVal <= 1 ? Math.round(effVal * 100) : Math.round(effVal)) : 0,
      totalMs: s.total_in_bed_time_milli,
    };
  }, [sleep]);

  if (loading) {
    return (
      <div className="glass p-5">
        <div className="skeleton skeleton--title mb-3" />
        <div className="skeleton skeleton--circle mx-auto" style={{ width: 140, height: 140 }} />
      </div>
    );
  }

  if (!stages.length) {
    return (
      <div className="glass p-6 text-center">
        <p className="text-sm text-white/50">No sleep data available yet.</p>
        <p className="explanation">{explanation}</p>
      </div>
    );
  }

  return (
    <div className="glass p-5">
      <p className="section-title">Sleep Performance</p>
      <p className="explanation">{explanation}</p>

      <div className="flex flex-col items-center gap-4 mt-3">
        <div className="relative w-36 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stages} cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={2} dataKey="ms" stroke="none">
                {stages.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white/90">{perf}%</span>
            <span className="text-[8px] text-white/30 uppercase tracking-wider">Performance</span>
          </div>
        </div>

        <div className="w-full space-y-2">
          {stages.map(s => (
            <div key={s.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
              <div className="flex-1 flex justify-between text-[10px]">
                <span className="text-white/60">{s.name}</span>
                <span className="text-white/70 font-semibold">{fmt(s.ms)} ({s.pct}%)</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card-grid--2col w-full mt-1">
          <div className="text-center p-2 rounded-lg border border-white/[0.04] bg-white/[0.015]">
            <p className="text-[8px] uppercase tracking-wider text-white/25">Efficiency</p>
            <p className="text-sm font-bold text-white/80">{efficiency}%</p>
          </div>
          <div className="text-center p-2 rounded-lg border border-white/[0.04] bg-white/[0.015]">
            <p className="text-[8px] uppercase tracking-wider text-white/25">Time in Bed</p>
            <p className="text-sm font-bold text-white/80">{fmt(totalMs)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
