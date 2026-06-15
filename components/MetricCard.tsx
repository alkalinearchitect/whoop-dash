"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";

type TrendDirection = "up" | "down" | "stable";
type CardSize = "sm" | "md" | "lg";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: TrendDirection;
  icon?: React.ReactNode;
  accentColor?: string;
  loading?: boolean;
  subtitle?: string;
  explanation?: string;
  detail?: React.ReactNode;
  size?: CardSize;
}

interface TrendConfig {
  icon: typeof TrendingUp;
  color: string;
  bg: string;
  label: string;
}

const TREND_CONFIG: Record<TrendDirection, TrendConfig> = {
  up: { icon: TrendingUp, color: "text-green-400", bg: "bg-green-400/10", label: "Up" },
  down: { icon: TrendingDown, color: "text-red-400", bg: "bg-red-400/10", label: "Down" },
  stable: { icon: Minus, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Stable" },
};

const SIZE_CONFIG: Record<CardSize, {
  padding: string;
  labelSize: string;
  valueSize: string;
  subtitleSize: string;
  explanationSize: string;
  trendTextSize: string;
  trendPadding: string;
  iconSize: string;
  chevronSize: string;
  gap: string;
}> = {
  sm: {
    padding: "p-3.5",
    labelSize: "text-[9px]",
    valueSize: "text-xl",
    subtitleSize: "text-[9px]",
    explanationSize: "text-[10px]",
    trendTextSize: "text-[8px]",
    trendPadding: "px-1.5 py-0.5",
    iconSize: "w-3 h-3",
    chevronSize: "w-3 h-3",
    gap: "gap-1",
  },
  md: {
    padding: "p-5",
    labelSize: "text-[10px]",
    valueSize: "text-2xl",
    subtitleSize: "text-[10px]",
    explanationSize: "text-[11px]",
    trendTextSize: "text-[9px]",
    trendPadding: "px-2 py-0.5",
    iconSize: "w-3.5 h-3.5",
    chevronSize: "w-3.5 h-3.5",
    gap: "gap-1.5",
  },
  lg: {
    padding: "p-6",
    labelSize: "text-xs",
    valueSize: "text-3xl",
    subtitleSize: "text-xs",
    explanationSize: "text-xs",
    trendTextSize: "text-[10px]",
    trendPadding: "px-2.5 py-1",
    iconSize: "w-4 h-4",
    chevronSize: "w-4 h-4",
    gap: "gap-2",
  },
};

export function MetricCard({
  label,
  value,
  unit,
  trend,
  icon,
  accentColor = "#6366f1",
  loading = false,
  subtitle,
  explanation,
  detail,
  size = "md",
}: MetricCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formattedValue = typeof value === "number"
    ? Number.isInteger(value) ? String(value) : value.toFixed(1)
    : value;

  const trendConfig = trend ? TREND_CONFIG[trend] : null;
  const TrendIcon = trendConfig?.icon;
  const isClickable = !!detail;
  const s = SIZE_CONFIG[size];

  if (loading) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] ${s.padding} backdrop-blur-xl`}>
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
        <div className="relative">
          <div className="mb-3 h-4 w-20 rounded bg-white/[0.06]" />
          <div className="mb-2 h-8 w-24 rounded bg-white/[0.06]" />
          <div className="h-3 w-16 rounded bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] ${s.padding} backdrop-blur-xl transition-all duration-300 ${isClickable ? "cursor-pointer hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-lg hover:shadow-black/20" : "hover:border-white/[0.12] hover:bg-white/[0.04]"}`}
      onClick={() => isClickable && setExpanded(!expanded)}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(!expanded); } } : undefined}
    >
      {/* Gradient border glow on hover */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${accentColor}15, transparent 50%, ${accentColor}08)`,
        }}
      />

      <div className="relative">
        {/* Top row: label + trend */}
        <div className="mb-3 flex items-center justify-between">
          <span className={`${s.labelSize} font-semibold uppercase tracking-[0.15em] text-white/35`}>
            {label}
          </span>
          <div className="flex items-center gap-2">
            {trendConfig && TrendIcon && (
              <div className={`flex items-center gap-1 rounded-full ${s.trendPadding} ${trendConfig.bg}`}>
                <TrendIcon className={`h-3 w-3 ${trendConfig.color}`} />
                <span className={`${s.trendTextSize} font-bold ${trendConfig.color}`}>
                  {trendConfig.label}
                </span>
              </div>
            )}
            {isClickable && (
              <div className="flex items-center justify-center rounded-full bg-white/[0.06] p-1 text-white/30 transition-all duration-200 group-hover:bg-white/[0.12] group-hover:text-white/70">
                {expanded ? <ChevronUp className={s.chevronSize} /> : <ChevronDown className={s.chevronSize} />}
              </div>
            )}
          </div>
        </div>

        {/* Value */}
        <div className={`flex items-baseline ${s.gap}`}>
          <span className={`${s.valueSize} font-bold tracking-tight transition-colors duration-300`} style={{ color: accentColor }}>
            {formattedValue}
          </span>
          {unit && <span className="text-sm font-medium text-white/30">{unit}</span>}
          {icon && (
            <div className="ml-auto opacity-40 transition-opacity group-hover:opacity-70">
              {icon}
            </div>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className={`mt-1.5 ${s.subtitleSize} text-white/25`}>{subtitle}</p>
        )}

        {/* Explanation text */}
        {explanation && (
          <p className={`mt-2 ${s.explanationSize} text-white/40 leading-relaxed border-t border-white/[0.04] pt-2`}>
            {explanation}
          </p>
        )}

        {/* Expandable detail section */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded && detail ? "mt-3 max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
        >
          {detail && (
            <div className="border-t border-white/[0.06] pt-3">
              {detail}
            </div>
          )}
        </div>

        {/* Accent line */}
        <div
          className="absolute bottom-0 left-0 h-0.5 w-full opacity-40"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          }}
        />
      </div>
    </div>
  );
}
