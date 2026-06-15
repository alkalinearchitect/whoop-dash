"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { WhoopWorkout } from "../lib/whoop";

interface StrainZonesProps {
  workouts: WhoopWorkout[];
  explanation: string;
  loading?: boolean;
}

const ZONES = [
  { key: "zone_one_milli" as const,    label: "Zone 1", name: "Easy",        color: "#00d4ff" },
  { key: "zone_two_milli" as const,   label: "Zone 2", name: "Fat Burning",  color: "#22c55e" },
  { key: "zone_three_milli" as const, label: "Zone 3", name: "Tempo",        color: "#eab308" },
  { key: "zone_four_milli" as const,  label: "Zone 4", name: "Threshold",    color: "#f97316" },
  { key: "zone_five_milli" as const,  label: "Zone 5", name: "Max Effort",   color: "#ef4444" },
];

function fmtTime(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
}

export function StrainZones({ workouts, explanation, loading = false }: StrainZonesProps) {
  const { data, totalMs } = useMemo(() => {
    const totals: Record<string, number> = {};
    ZONES.forEach(z => { totals[z.key] = 0; });
    workouts.forEach(w => {
      const zd = w.score?.zone_duration;
      if (!zd) return;
      ZONES.forEach(z => { totals[z.key] += Number(zd[z.key]) || 0; });
    });
    const total = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
    const chartData = ZONES.map(z => ({ ...z, ms: totals[z.key], pct: Math.round((totals[z.key] / total) * 1000) / 10 })).filter(z => z.ms > 0);
    return { data: chartData, totalMs: total };
  }, [workouts]);

  if (loading) {
    return (
      <div className="glass p-5">
        <div className="skeleton skeleton--title mb-3" />
        <div className="skeleton skeleton--circle mx-auto" style={{ width: 160, height: 160 }} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="glass p-6 text-center">
        <p className="text-sm text-white/50">No zone data yet. Complete a workout to see your heart rate zones.</p>
        <p className="explanation">{explanation}</p>
      </div>
    );
  }

  return (
    <div className="glass p-5">
      <p className="section-title">Heart Rate Zones</p>
      <p className="explanation">{explanation}</p>

      <div className="flex flex-col items-center gap-4 mt-3">
        <div className="relative w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="ms" stroke="none">
                {data.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload as (typeof data)[0];
                  return (
                    <div className="rounded-lg border border-white/10 bg-black/90 px-2.5 py-1.5 text-xs">
                      <span className="font-semibold" style={{ color: d.color }}>{d.label} — {d.name}</span>
                      <p className="text-white/50">{fmtTime(d.ms)} ({d.pct}%)</p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-white/80">{fmtTime(totalMs)}</span>
            <span className="text-[8px] text-white/30 uppercase tracking-wider">Total</span>
          </div>
        </div>

        <div className="w-full space-y-2">
          {ZONES.map(z => {
            const dz = data.find(d => d.key === z.key);
            if (!dz) return null;
            return (
              <div key={z.key} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: z.color }} />
                <div className="flex-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/60">{z.label} <span className="text-white/30">— {z.name}</span></span>
                    <span className="text-white/70 font-semibold">{dz.pct}%</span>
                  </div>
                  <div className="h-1 mt-0.5 rounded-full bg-white/[0.04]">
                    <div className="h-full rounded-full" style={{ width: `${dz.pct}%`, background: z.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
