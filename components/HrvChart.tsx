"use client";

import { useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceDot, CartesianGrid,
} from "recharts";
import { Dumbbell, Moon, Zap, TrendingUp, TrendingDown } from "lucide-react";
import type { Recovery, Workout, SleepRecord } from "../lib/whoop";

interface HrvChartProps {
  recovery: Recovery[];
  workouts: Workout[];
  sleep: SleepRecord[];
  loading?: boolean;
}

interface ChartPoint {
  date: string;
  displayDate: string;
  hrv: number;
  hasWorkout: boolean;
  strain: number;
  poorSleep: boolean;
  sleepPerf: number;
  isNap: boolean;
}

function pct(val: number | null | undefined): number | null {
  if (val == null) return null;
  return val <= 1 ? Math.round(val * 100) : Math.round(val);
}

export function HrvChart({ recovery, workouts, sleep, loading }: HrvChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  const { chartData, stats, correlations } = useMemo(() => {
    const workoutDates = new Map<string, number>();
    workouts.forEach((w) => {
      const d = new Date(w.start).toISOString().split("T")[0];
      workoutDates.set(d, w.score?.strain ?? 0);
    });

    const sleepMap = new Map<string, { perf: number; nap: boolean }>();
    sleep.forEach((s) => {
      const d = new Date(s.start).toISOString().split("T")[0];
      const perf = pct(s.score?.sleep_performance_percentage) ?? 0;
      sleepMap.set(d, { perf, nap: s.nap });
    });

    const data: ChartPoint[] = recovery
      .filter((r) => r.score?.hrv_rmssd != null)
      .map((r) => {
        const date = new Date(r.created_at).toISOString().split("T")[0];
        const hrv = Math.round(r.score!.hrv_rmssd!);
        const hasWorkout = workoutDates.has(date);
        const strain = workoutDates.get(date) ?? 0;
        const sleepData = sleepMap.get(date);
        const sleepPerf = sleepData?.perf ?? 0;
        const poorSleep = sleepPerf > 0 && sleepPerf < 60;
        const isNap = sleepData?.nap ?? false;

        return {
          date,
          displayDate: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          hrv,
          hasWorkout,
          strain,
          poorSleep,
          sleepPerf,
          isNap,
        };
      })
      .reverse();

    // Stats
    const hrvValues = data.map((d) => d.hrv);
    const avg = hrvValues.length > 0 ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length : 0;
    const min = hrvValues.length > 0 ? Math.min(...hrvValues) : 0;
    const max = hrvValues.length > 0 ? Math.max(...hrvValues) : 0;
    const latest = hrvValues[hrvValues.length - 1] ?? 0;
    const prev = hrvValues[hrvValues.length - 2] ?? 0;
    const change = prev > 0 ? ((latest - prev) / prev) * 100 : 0;

    // Correlations
    const workoutDays = data.filter((d) => d.hasWorkout);
    const restDays = data.filter((d) => !d.hasWorkout);
    const avgHrvWorkout = workoutDays.length > 0 ? workoutDays.reduce((s, d) => s + d.hrv, 0) / workoutDays.length : 0;
    const avgHrvRest = restDays.length > 0 ? restDays.reduce((s, d) => s + d.hrv, 0) / restDays.length : 0;

    const poorSleepDays = data.filter((d) => d.poorSleep);
    const goodSleepDays = data.filter((d) => !d.poorSleep && d.sleepPerf > 0);
    const avgHrvPoorSleep = poorSleepDays.length > 0 ? poorSleepDays.reduce((s, d) => s + d.hrv, 0) / poorSleepDays.length : 0;
    const avgHrvGoodSleep = goodSleepDays.length > 0 ? goodSleepDays.reduce((s, d) => s + d.hrv, 0) / goodSleepDays.length : 0;

    const highStrainDays = data.filter((d) => d.strain > 14);
    const avgHrvHighStrain = highStrainDays.length > 0 ? highStrainDays.reduce((s, d) => s + d.hrv, 0) / highStrainDays.length : 0;

    return {
      chartData: data,
      stats: { avg, min, max, latest, change, count: data.length },
      correlations: {
        avgHrvWorkout,
        avgHrvRest,
        avgHrvPoorSleep,
        avgHrvGoodSleep,
        avgHrvHighStrain,
        workoutDays: workoutDays.length,
        poorSleepDays: poorSleepDays.length,
      },
    };
  }, [recovery, workouts, sleep]);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
        <div className="h-8 w-56 rounded-lg bg-white/[0.06] mb-4" />
        <div className="h-64 rounded-xl bg-white/[0.04]" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-xl text-center">
        <p className="text-sm font-medium text-white/60">No HRV data available</p>
      </div>
    );
  }

  const referenceDots = chartData
    .filter((d) => d.hasWorkout || d.poorSleep || d.isNap)
    .map((d) => ({
      x: d.displayDate,
      y: d.hrv,
      color: d.poorSleep ? "#ef4444" : d.isNap ? "#a78bfa" : "#f59e0b",
      type: d.poorSleep ? "poor-sleep" : d.isNap ? "nap" : "workout",
    }));

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white/90">HRV Correlation Map</h3>
          <p className="mt-0.5 text-xs text-white/40">HRV with workout & sleep overlay — spot patterns</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[9px] text-white/40">Workout</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-[9px] text-white/40">Poor Sleep</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-purple-400" />
            <span className="text-[9px] text-white/40">Nap</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-4 flex gap-6">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-wider text-white/25">Latest</p>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-cyan-400">{stats.latest}ms</p>
            {stats.change !== 0 && (
              <span className={`flex items-center gap-0.5 text-[10px] ${stats.change > 0 ? "text-green-400" : "text-red-400"}`}>
                {stats.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stats.change > 0 ? "+" : ""}{stats.change.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-[9px] font-medium uppercase tracking-wider text-white/25">Avg</p>
          <p className="text-sm font-semibold text-white/60">{stats.avg.toFixed(0)}ms</p>
        </div>
        <div>
          <p className="text-[9px] font-medium uppercase tracking-wider text-white/25">Range</p>
          <p className="text-sm font-semibold text-white/60">{stats.min}–{stats.max}ms</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="hrv-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="displayDate" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} width={35} domain={['auto', 'auto']} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload as ChartPoint;
                return (
                  <div className="rounded-xl border border-white/10 bg-black/90 p-3 shadow-2xl backdrop-blur-xl min-w-[160px]">
                    <p className="text-xs font-semibold text-white/80 mb-1">{d.displayDate}</p>
                    <p className="text-sm font-bold text-cyan-400">{d.hrv}ms HRV</p>
                    <div className="mt-1.5 space-y-0.5">
                      {d.hasWorkout && <p className="text-[10px] text-amber-400">🏋️ Workout: {d.strain.toFixed(1)} strain</p>}
                      {d.poorSleep && <p className="text-[10px] text-red-400">😴 Poor sleep: {d.sleepPerf}%</p>}
                      {d.isNap && <p className="text-[10px] text-purple-400">💤 Nap detected</p>}
                      {!d.hasWorkout && !d.poorSleep && !d.isNap && d.sleepPerf > 0 && (
                        <p className="text-[10px] text-white/40">Sleep: {d.sleepPerf}% · Rest day</p>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine y={stats.avg} stroke="rgba(255,255,255,0.15)" strokeDasharray="5 5" label={{ value: "avg", position: "right", fill: "rgba(255,255,255,0.3)", fontSize: 9 }} />
            <Area type="monotone" dataKey="hrv" stroke="#06b6d4" strokeWidth={2} fill="url(#hrv-gradient)" dot={false} activeDot={{ r: 5, fill: "#06b6d4", stroke: "rgba(255,255,255,0.3)", strokeWidth: 2 }} />
            {referenceDots.map((dot, i) => (
              <ReferenceDot key={i} x={dot.x} y={dot.y} r={4} fill={dot.color} stroke="rgba(0,0,0,0.5)" strokeWidth={1} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Correlation insights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] font-medium uppercase tracking-wider text-white/30">Workout Impact</span>
          </div>
          <p className="text-xs text-white/60">
            {correlations.avgHrvWorkout > 0 && correlations.avgHrvRest > 0 ? (
              <>HRV on workout days: <span className="text-amber-400 font-semibold">{correlations.avgHrvWorkout.toFixed(0)}ms</span> vs rest: <span className="text-cyan-400 font-semibold">{correlations.avgHrvRest.toFixed(0)}ms</span></>
            ) : (
              <>No workout data to correlate</>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 mb-1">
            <Moon className="w-3 h-3 text-indigo-400" />
            <span className="text-[9px] font-medium uppercase tracking-wider text-white/30">Sleep Quality</span>
          </div>
          <p className="text-xs text-white/60">
            {correlations.avgHrvGoodSleep > 0 && correlations.avgHrvPoorSleep > 0 ? (
              <>Good sleep: <span className="text-green-400 font-semibold">{correlations.avgHrvGoodSleep.toFixed(0)}ms</span> vs poor: <span className="text-red-400 font-semibold">{correlations.avgHrvPoorSleep.toFixed(0)}ms</span></>
            ) : (
              <>Sleep data insufficient</>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3 h-3 text-orange-400" />
            <span className="text-[9px] font-medium uppercase tracking-wider text-white/30">High Strain</span>
          </div>
          <p className="text-xs text-white/60">
            {correlations.avgHrvHighStrain > 0 ? (
              <>After strain &gt;14: <span className="text-orange-400 font-semibold">{correlations.avgHrvHighStrain.toFixed(0)}ms</span> avg HRV</>
            ) : (
              <>No high-strain days yet</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
