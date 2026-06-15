"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Moon } from "lucide-react";
import type { WhoopSleep as SleepRecord } from "../lib/whoop";

interface HypnogramProps {
  sleeps: SleepRecord[];
  loading?: boolean;
  explanation?: string;
}

interface SleepStageData {
  date: string;
  deep: number;
  rem: number;
  light: number;
  awake: number;
  deepMs: number;
  remMs: number;
  lightMs: number;
  awakeMs: number;
  totalMs: number;
}

const STAGE_CONFIG = [
  { key: "deep" as const, label: "Deep", color: "#6366f1" },
  { key: "rem" as const, label: "REM", color: "#a78bfa" },
  { key: "light" as const, label: "Light", color: "#38bdf8" },
  { key: "awake" as const, label: "Awake", color: "#f472b6" },
];

function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function Hypnogram({ sleeps, loading, explanation = "Sleep stages show recovery quality. Deep + REM = physical + mental recovery." }: HypnogramProps) {
  const nights = useMemo(() => {
    const res = sleeps
      .filter((s) => !s.nap && s.score?.stage_summary)
      .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())
      .slice(0, 14)
      .reverse()
      .map((s) => {
        const stage = s.score!.stage_summary!;
        const total = stage.total_in_bed_time_milli || 1;
        return {
          date: new Date(s.end).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          deep: (stage.total_slow_wave_sleep_time_milli / total) * 100,
          rem: (stage.total_rem_sleep_time_milli / total) * 100,
          light: (stage.total_light_sleep_time_milli / total) * 100,
          awake: (stage.total_awake_time_milli / total) * 100,
          deepMs: stage.total_slow_wave_sleep_time_milli,
          remMs: stage.total_rem_sleep_time_milli,
          lightMs: stage.total_light_sleep_time_milli,
          awakeMs: stage.total_awake_time_milli,
          totalMs: total,
        };
      });
    return res;
  }, [sleeps]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="h-8 w-48 rounded-lg bg-white/[0.06] mb-4" />
        <div className="h-64 rounded-xl bg-white/[0.04]" />
      </div>
    );
  }

  if (nights.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
            <Moon className="h-5 w-5 text-white/30" />
          </div>
          <p className="text-sm font-medium text-white/60">No sleep data available</p>
          <p className="mt-1 text-xs text-white/30">Sleep records will appear here once synced</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-white/90">Sleep Architecture</h3>
        <p className="mt-0.5 text-xs text-white/40">Last {nights.length} nights</p>
        {explanation && (
          <p className="mt-1 text-[11px] text-white/35">{explanation}</p>
        )}
      </div>

      <div className="mb-4 flex gap-4">
        {STAGE_CONFIG.map((stage) => (
          <div key={stage.key} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: stage.color }}
            />
            <span className="text-[10px] font-medium text-white/50">{stage.label}</span>
          </div>
        ))}
      </div>

      <div className="mb-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={nights}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            barCategoryGap="20%"
          >
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload as SleepStageData;
                return (
                  <div className="rounded-xl border border-white/10 bg-black/90 p-3 shadow-2xl backdrop-blur-xl">
                    <p className="mb-2 text-xs font-semibold text-white/80">{data.date}</p>
                    <div className="space-y-1">
                      {STAGE_CONFIG.map((stage) => (
                        <div key={stage.key} className="flex items-center gap-2 text-[11px]">
                          <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: stage.color }} />
                          <span className="text-white/50">{stage.label}:</span>
                          <span className="font-medium text-white/80">
                            {formatDuration(data[`${stage.key}Ms`])}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="deep" stackId="stages" radius={[0, 0, 0, 0]}>
              {nights.map((_, index) => (
                <Cell key={`deep-${index}`} fill={STAGE_CONFIG[0].color} />
              ))}
            </Bar>
            <Bar dataKey="rem" stackId="stages" radius={[0, 0, 0, 0]}>
              {nights.map((_, index) => (
                <Cell key={`rem-${index}`} fill={STAGE_CONFIG[1].color} />
              ))}
            </Bar>
            <Bar dataKey="light" stackId="stages" radius={[0, 0, 0, 0]}>
              {nights.map((_, index) => (
                <Cell key={`light-${index}`} fill={STAGE_CONFIG[2].color} />
              ))}
            </Bar>
            <Bar dataKey="awake" stackId="stages" radius={[4, 4, 0, 0]}>
              {nights.map((_, index) => (
                <Cell key={`awake-${index}`} fill={STAGE_CONFIG[3].color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.04] pt-3">
        <div className="flex gap-6">
          {STAGE_CONFIG.map((stage) => {
            const totalMs = nights.reduce((sum, n) => sum + n[`${stage.key}Ms`], 0);
            const avgMs = totalMs / nights.length;
            return (
              <div key={stage.key} className="text-center">
                <p className="text-[9px] font-medium uppercase tracking-wider text-white/30">
                  {stage.label} avg
                </p>
                <p className="text-xs font-semibold" style={{ color: stage.color }}>
                  {formatDuration(avgMs)}
                </p>
              </div>
            );
          })}
        </div>
        <div className="text-right">
          <p className="text-[9px] font-medium uppercase tracking-wider text-white/30">
            Total avg
          </p>
          <p className="text-xs font-semibold text-white/70">
            {formatDuration(nights.reduce((s, n) => s + n.totalMs, 0) / nights.length)}
          </p>
        </div>
      </div>
    </div>
  );
}
