"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface TrendChartProps {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  color?: string;
  label?: string;
  unit?: string;
  loading?: boolean;
  height?: number;
}

type PeriodKey = "30" | "60" | "90";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "30", label: "30D" },
  { key: "60", label: "60D" },
  { key: "90", label: "90D" },
];

export function TrendChart({
  data,
  dataKey,
  color = "#6366f1",
  label = "Value",
  unit = "",
  loading,
  height = 220,
}: TrendChartProps) {
  const [period, setPeriod] = useState<PeriodKey>("30");

  const filteredData = useMemo(() => {
    const days = parseInt(period);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return data
      .filter((d) => {
        const dateVal = d.date || d.day || d.timestamp;
        if (!dateVal) return true;
        return new Date(dateVal as string) >= cutoff;
      })
      .map((d) => ({
        ...d,
        displayDate: (() => {
          const dateVal = d.date || d.day || d.timestamp;
          if (!dateVal) return "";
          const dt = new Date(dateVal as string);
          if (days <= 30) {
            return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          }
          return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        })(),
      }));
  }, [data, period]);

  const stats = useMemo(() => {
    const values = filteredData
      .map((d) => Number((d as Record<string, unknown>)[dataKey]))
      .filter((v) => !isNaN(v) && v !== null);
    if (values.length === 0) return null;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const latest = values[0];
    const prev = values[1];
    const change = prev !== undefined && prev !== 0 ? ((latest - prev) / Math.abs(prev)) * 100 : 0;
    return { avg, min, max, latest, change, count: values.length };
  }, [filteredData, dataKey]);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-32 rounded-lg bg-white/[0.06]" />
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-10 rounded-md bg-white/[0.04]" />
            ))}
          </div>
        </div>
        <div style={{ height }} className="rounded-xl bg-white/[0.03]" />
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
            <span className="text-xl">📈</span>
          </div>
          <p className="text-sm font-medium text-white/60">No trend data available</p>
          <p className="mt-1 text-xs text-white/30">Data will appear as it&apos;s collected</p>
        </div>
      </div>
    );
  }

  const gradientId = `gradient-${dataKey}`;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white/90">{label}</h3>
          {stats && (
            <p className="mt-0.5 text-xs text-white/40">
              Latest: {stats.latest.toFixed(1)}{unit}
              {stats.change !== 0 && (
                <span className={stats.change > 0 ? "text-green-400/60" : "text-red-400/60"}>
                  {" "}
                  ({stats.change > 0 ? "+" : ""}
                  {stats.change.toFixed(1)}%)
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex gap-1 rounded-lg bg-white/[0.04] p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-md px-3 py-1 text-[10px] font-semibold transition-all ${
                period === p.key
                  ? "bg-white/10 text-white/90 shadow-sm"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="mb-4 flex gap-6">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-wider text-white/25">Avg</p>
            <p className="text-xs font-semibold text-white/60">
              {stats.avg.toFixed(1)}{unit}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-medium uppercase tracking-wider text-white/25">Min</p>
            <p className="text-xs font-semibold text-white/60">
              {stats.min.toFixed(1)}{unit}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-medium uppercase tracking-wider text-white/25">Max</p>
            <p className="text-xs font-semibold text-white/60">
              {stats.max.toFixed(1)}{unit}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-medium uppercase tracking-wider text-white/25">Points</p>
            <p className="text-xs font-semibold text-white/60">{stats.count}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="50%" stopColor={color} stopOpacity={0.1} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="displayDate"
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v: number) => (unit ? `${v}${unit}` : `${v}`)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const val = payload[0].value as number;
                const date = payload[0].payload?.displayDate;
                return (
                  <div className="rounded-xl border border-white/10 bg-black/90 px-3 py-2 shadow-2xl backdrop-blur-xl">
                    <p className="text-[10px] text-white/40">{date}</p>
                    <p className="text-sm font-semibold" style={{ color }}>
                      {val?.toFixed(1)}{unit}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r: 5,
                fill: color,
                stroke: "rgba(255,255,255,0.3)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
