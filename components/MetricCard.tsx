"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type TrendDirection = "up" | "down" | "neutral";
type CardSize = "sm" | "md" | "lg";

interface MetricCardProps {
  value: string | number | null;
  label: string;
  unit?: string;
  explanation: string;
  trend?: TrendDirection;
  size?: CardSize;
  loading?: boolean;
}

const trendConfig = {
  up:     { Icon: TrendingUp,  color: "var(--success)", label: "Up" },
  down:   { Icon: TrendingDown, color: "var(--danger)",  label: "Down" },
  neutral:{ Icon: Minus,        color: "var(--warning)", label: "Stable" },
};

const sizeConfig = {
  sm: { pad: "p-3", value: "text-xl",  label: "text-[9px]", expl: "text-[10px]" },
  md: { pad: "p-4", value: "text-2xl", label: "text-[10px]", expl: "text-[11px]" },
  lg: { pad: "p-5", value: "text-3xl", label: "text-[11px]", expl: "text-[12px]" },
};

export function MetricCard({
  value,
  label,
  unit,
  explanation,
  trend,
  size = "md",
  loading = false,
}: MetricCardProps) {
  const s = sizeConfig[size];

  if (loading) {
    return (
      <div className={`glass ${s.pad}`}>
        <div className="skeleton skeleton--text-short mb-2" />
        <div className="skeleton skeleton--metric mb-2" />
        <div className="skeleton skeleton--text-short" style={{ width: "40%" }} />
      </div>
    );
  }

  const display = value == null ? "—" : typeof value === "number" ? value.toFixed(1) : value;
  const tc = trend ? trendConfig[trend] : null;

  return (
    <div className={`glass ${s.pad}`}>
      <p className={`metric-label ${s.label}`}>{label}</p>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={`metric-value ${s.value}`}>{display}</span>
        {unit && <span className="text-sm text-white/30">{unit}</span>}
        {tc && (
          <tc.Icon className="w-3.5 h-3.5 ml-1" style={{ color: tc.color }} />
        )}
      </div>
      <p className={`explanation ${s.expl}`}>{explanation}</p>
    </div>
  );
}
