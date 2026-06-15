"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Workout } from "../lib/whoop";

interface StrainZonesProps {
  workouts: Workout[];
  loading?: boolean;
}

const ZONE_CONFIG = [
  { key: "zone_zero_milli" as const, label: "Zone 0", name: "Rest", color: "#6b7280" },
  { key: "zone_one_milli" as const, label: "Zone 1", name: "Light", color: "#3b82f6" },
  { key: "zone_two_milli" as const, label: "Zone 2", name: "Moderate", color: "#22c55e" },
  { key: "zone_three_milli" as const, label: "Zone 3", name: "Tempo", color: "#eab308" },
  { key: "zone_four_milli" as const, label: "Zone 4", name: "Threshold", color: "#f97316" },
  { key: "zone_five_milli" as const, label: "Zone 5", name: "Max", color: "#ef4444" },
];

function formatTime(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function StrainZones({ workouts, loading }: StrainZonesProps) {
  const { chartData, totalMs, totalWorkouts } = useMemo(() => {
    const zoneTotals: Record<string, number> = {};
    ZONE_CONFIG.forEach((z) => (zoneTotals[z.key] = 0));

    workouts.forEach((w) => {
      const zd = w.score?.zone_duration;
      if (!zd) return;
      ZONE_CONFIG.forEach((z) => {
        zoneTotals[z.key] += Number(zd[z.key]) || 0;
      });
    });

    const total = Object.values(zoneTotals).reduce((a, b) => a + b, 0) || 1;

    const data = ZONE_CONFIG.map((z) => ({
      ...z,
      ms: zoneTotals[z.key],
      pct: Math.round((zoneTotals[z.key] / total) * 1000) / 10,
      hours: zoneTotals[z.key] / 3600000,
    })).filter((z) => z.ms > 0);

    return { chartData: data, totalMs: total, totalWorkouts: workouts.length };
  }, [workouts]);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
        <div className="h-8 w-40 rounded-lg bg-white/[0.06] mb-4" />
        <div className="mx-auto h-48 w-48 rounded-full bg-white/[0.04]" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
            <span className="text-xl">💓</span>
          </div>
          <p className="text-sm font-medium text-white/60">No zone data available</p>
          <p className="mt-1 text-xs text-white/30">Complete a workout to see heart rate zones</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white/90">Heart Rate Zones</h3>
          <p className="mt-0.5 text-xs text-white/40">
            {totalWorkouts} workouts · {formatTime(totalMs)} total
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut Chart */}
        <div className="relative h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="ms"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload as (typeof chartData)[0];
                  return (
                    <div className="rounded-xl border border-white/10 bg-black/90 px-3 py-2 shadow-2xl backdrop-blur-xl">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: data.color }} />
                        <span className="text-xs font-semibold text-white/80">
                          {data.label} — {data.name}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-white/50">
                        {formatTime(data.ms)} ({data.pct}%)
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white/80">
              {formatTime(totalMs)}
            </span>
            <span className="text-[9px] font-medium uppercase tracking-wider text-white/30">
              Total Time
            </span>
          </div>
        </div>

        {/* Zone breakdown */}
        <div className="flex-1 space-y-2.5">
          {ZONE_CONFIG.map((zone) => {
            const data = chartData.find((d) => d.key === zone.key);
            if (!data) return null;
            return (
              <div key={zone.key} className="group flex items-center gap-3">
                <div
                  className="h-3 w-3 shrink-0 rounded-sm transition-transform group-hover:scale-125"
                  style={{ backgroundColor: zone.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-white/60">
                      {zone.label} <span className="text-white/30">— {zone.name}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-white/70">
                      {data.pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${data.pct}%`,
                        backgroundColor: zone.color,
                        boxShadow: `0 0 8px ${zone.color}40`,
                      }}
                    />
                  </div>
                  <p className="mt-0.5 text-[9px] text-white/25">{formatTime(data.ms)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
