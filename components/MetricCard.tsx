"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "stable";
  icon?: React.ReactNode;
  accentColor?: string;
  loading?: string;
  subtitle?: string;
  explanation?: string;
  detail?: React.ReactNode;
}

const TREND_CONFIG = {
  up: { icon: TrendingUp, color: "text-green-400", bg: "bg-green-400/10", label: "Up" },
  down: { icon: TrendingDown, color: "text-red-400", bg: "bg-red-400/10", label: "Down" },
  stable: { icon: Minus, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Stable" },
};

export function MetricCard({
  label,
  value,
  unit,
  trend,
  icon,
  accentColor = "#6366f1",
  loading,
  subtitle,
  explanation,
  detail,
}: MetricCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formattedValue = typeof value === "number"
    ? Number.isInteger(value) ? String(value) : value.toFixed(1)
    : value;

  const trendConfig = trend ? TREND_CONFIG[trend] : null;
  const TrendIcon = trendConfig?.icon;
  const isClickable = !!detail;

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
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
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl transition-all duration-300 ${isClickable ? "cursor-pointer hover:border-white/[0.12] hover:bg-white/[0.04]" : "hover:border-white/[0.12] hover:bg-white/[0.04]"}`}
      onClick={() => isClickable && setExpanded(!expanded)}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {/* Gradient border glow on hover */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${accentColor}15, transparent 50%, ${accentColor}08)`,
        }}
      />

      <div className="relative">
        {/* Top row: label + trend */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">
            {label}
          </span>
          <div className="flex items-center gap-2">
            {trendConfig && TrendIcon && (
              <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${trendConfig.bg}`}>
                <TrendIcon className={`h-3 w-3 ${trendConfig.color}`} />
                <span className={`text-[9px] font-bold ${trendConfig.color}`}>
                  {trendConfig.label}
                </span>
              </div>
            )}
            {isClickable && (
              <div className="text-white/20 group-hover:text-white/50 transition-colors">
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            )}
          </div>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight" style={{ color: accentColor }}>
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
          <p className="mt-1.5 text-[10px] text-white/25">{subtitle}</p>
        )}

        {/* Explanation text */}
        {explanation && (
          <p className="mt-2 text-[11px] text-white/40 leading-relaxed border-t border-white/[0.04] pt-2">
            {explanation}
          </p>
        )}

        {/* Expandable detail section */}
        {expanded && detail && (
          <div className="mt-3 pt-3 border-t border-white/[0.06] animate-fade-in-up">
            {detail}
          </div>
        )}

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
