"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { WhoopRecovery } from "../lib/whoop";

interface HrvChartProps {
  recovery: WhoopRecovery[];
  explanation: string;
  loading?: boolean;
}

interface Point {
  date: string;
  displayDate: string;
  hrv: number;
}

export function HrvChart({ recovery, explanation, loading = false }: HrvChartProps) {
  const { chartData, stats } = useMemo(() => {
    const data: Point[] = recovery
      .filter(r => r.score?.hrv_rmssd != null)
      .map(r => {
        const d = new Date(r.created_at);
        return {
          date: d.toISOString().split("T")[0],
          displayDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          hrv: Math.round(r.score!.hrv_rmssd!),
        };
      })
      .reverse();

    const vals = data.map(d => d.hrv);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const latest = vals[vals.length - 1] ?? 0;
    const prev = vals[vals.length - 2] ?? 0;
    const change = prev > 0 ? ((latest - prev) / prev) * 100 : 0;

    return { chartData: data, stats: { avg, latest, change, min: vals.length ? Math.min(...vals) : 0, max: vals.length ? Math.max(...vals) : 0 } };
  }, [recovery]);

  if (loading) {
    return (
      <div className="glass p-5">
        <div className="skeleton skeleton--title mb-3" />
        <div className="skeleton" style={{ height: 180 }} />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="glass p-6 text-center">
        <p className="text-sm text-white/50">No HRV data available yet.</p>
        <p className="explanation">{explanation}</p>
      </div>
    );
  }

  return (
    <div className="glass p-5">
      <p className="section-title">HRV Trend</p>
      <p className="explanation">{explanation}</p>

      <div className="flex gap-4 mt-2 mb-3">
        <div>
          <p className="text-[8px] uppercase tracking-wider text-white/25">Latest</p>
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-cyan-400">{stats.latest}ms</span>
            {stats.change !== 0 && (
              <span className={`flex items-center gap-0.5 text-[10px] ${stats.change > 0 ? "text-green-400" : "text-red-400"}`}>
                {stats.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stats.change > 0 ? "+" : ""}{stats.change.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-[8px] uppercase tracking-wider text-white/25">Avg</p>
          <span className="text-xs font-semibold text-white/60">{stats.avg.toFixed(0)}ms</span>
        </div>
        <div>
          <p className="text-[8px] uppercase tracking-wider text-white/25">Range</p>
          <span className="text-xs font-semibold text-white/60">{stats.min}–{stats.max}ms</span>
        </div>
      </div>

      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <defs>
              <linearGradient id="hrv-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="displayDate" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} width={35} domain={["auto", "auto"]} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload as Point;
                return (
                  <div className="rounded-lg border border-white/10 bg-black/90 px-2.5 py-1.5">
                    <p className="text-[10px] text-white/40">{d.displayDate}</p>
                    <p className="text-sm font-bold text-cyan-400">{d.hrv}ms HRV</p>
                  </div>
                );
              }}
            />
            <ReferenceLine y={stats.avg} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="hrv" stroke="#06b6d4" strokeWidth={2} fill="url(#hrv-grad)" dot={false} activeDot={{ r: 4, fill: "#06b6d4", stroke: "rgba(255,255,255,0.3)", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
