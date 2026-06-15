"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TrendChartProps {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  period: "7d" | "30d" | "90d";
  explanation: string;
  label?: string;
  unit?: string;
  color?: string;
  loading?: boolean;
}

export function TrendChart({
  data, dataKey, period, explanation,
  label = "Value", unit = "", color = "#ff2d55", loading = false,
}: TrendChartProps) {
  const chartData = useMemo(() =>
    data.map(d => {
      const raw = d.date ?? d.day ?? d.timestamp;
      const display = raw ? new Date(raw as string).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
      return { ...d, displayDate: display };
    }), [data]);

  const stats = useMemo(() => {
    const vals = chartData.map(d => Number((d as Record<string, unknown>)[dataKey])).filter(v => !isNaN(v));
    if (!vals.length) return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const latest = vals[vals.length - 1];
    const prev = vals[vals.length - 2];
    const change = prev ? ((latest - prev) / Math.abs(prev)) * 100 : 0;
    return { avg, latest, change };
  }, [chartData, dataKey]);

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
        <p className="text-sm text-white/50">No trend data available yet.</p>
        <p className="explanation">{explanation}</p>
      </div>
    );
  }

  const gid = `tg-${dataKey}`;

  return (
    <div className="glass p-5">
      <p className="section-title">{label} <span className="text-white/30 font-normal text-[10px] ml-2">{period}</span></p>
      <p className="explanation">{explanation}</p>

      {stats && (
        <div className="flex gap-4 mt-2 mb-3">
          <div>
            <p className="text-[8px] uppercase tracking-wider text-white/25">Latest</p>
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-white/70">{stats.latest.toFixed(1)}{unit}</span>
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
            <span className="text-xs font-semibold text-white/60">{stats.avg.toFixed(1)}{unit}</span>
          </div>
        </div>
      )}

      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="displayDate" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const v = payload[0].value as number;
                const dt = (payload[0].payload as { displayDate: string }).displayDate;
                return (
                  <div className="rounded-lg border border-white/10 bg-black/90 px-2.5 py-1.5">
                    <p className="text-[10px] text-white/40">{dt}</p>
                    <p className="text-sm font-semibold" style={{ color }}>{v?.toFixed(1)}{unit}</p>
                  </div>
                );
              }}
            />
            {stats && <ReferenceLine y={stats.avg} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />}
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gid})`} dot={false} activeDot={{ r: 4, fill: color, stroke: "rgba(255,255,255,0.3)", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
