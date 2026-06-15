"use client";

import { useEffect, useState, useMemo } from "react";

interface RecoveryGaugeProps {
  score: number | null;
  size?: number;
  strokeWidth?: number;
  loading?: boolean;
  label?: string;
}

function getZoneColor(score: number): { main: string; glow: string; label: string } {
  if (score >= 66) return { main: "#22c55e", glow: "rgba(34,197,94,0.3)", label: "Optimal" };
  if (score >= 33) return { main: "#eab308", glow: "rgba(234,179,8,0.3)", label: "Moderate" };
  return { main: "#ef4444", glow: "rgba(239,68,68,0.3)", label: "Low" };
}

export function RecoveryGauge({
  score,
  size = 160,
  strokeWidth = 10,
  loading,
  label = "Recovery",
}: RecoveryGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;

  const zone = useMemo(() => getZoneColor(score ?? 0), [score]);

  useEffect(() => {
    if (score === null) {
      setAnimatedScore(0);
      return;
    }
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore((score ?? 0) * eased);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [score]);

  const offset = circumference - (animatedScore / 100) * circumference;

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
        <div className="flex flex-col items-center">
          <div
            className="rounded-full bg-white/[0.04]"
            style={{ width: size, height: size }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
      <div className="flex flex-col items-center">
        {/* Label */}
        <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
          {label}
        </h3>

        {/* Gauge */}
        <div className="relative" style={{ width: size, height: size }}>
          {/* Glow effect */}
          <div
            className="absolute inset-0 rounded-full opacity-20 blur-xl transition-all duration-1000"
            style={{ backgroundColor: zone.main }}
          />

          <svg
            width={size}
            height={size}
            className="relative transform -rotate-90"
          >
            <defs>
              <filter id="gauge-glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={zone.main} stopOpacity={0.8} />
                <stop offset="100%" stopColor={zone.main} />
              </linearGradient>
            </defs>

            {/* Background track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Zone markers */}
            {/* Red zone: 0-33% */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#ef444420"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${(33 / 100) * circumference} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="butt"
            />
            {/* Yellow zone: 33-66% */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#eab30820"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${(33 / 100) * circumference} ${circumference}`}
              strokeDashoffset={-(33 / 100) * circumference}
              strokeLinecap="butt"
            />
            {/* Green zone: 66-100% */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#22c55e20"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${(34 / 100) * circumference} ${circumference}`}
              strokeDashoffset={-(66 / 100) * circumference}
              strokeLinecap="butt"
            />

            {/* Animated progress arc */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="url(#gauge-gradient)"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              filter="url(#gauge-glow)"
              style={{
                transition: "stroke-dashoffset 0.1s ease-out",
                opacity: score !== null ? 1 : 0.15,
              }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-4xl font-bold tabular-nums transition-colors duration-700"
              style={{ color: score !== null ? zone.main : "rgba(255,255,255,0.2)" }}
            >
              {score !== null ? Math.round(animatedScore) : "—"}
            </span>
            <span className="mt-0.5 text-[9px] font-medium text-white/25">%</span>
          </div>
        </div>

        {/* Zone label */}
        <div className="mt-4 flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: zone.main, boxShadow: `0 0 8px ${zone.glow}` }}
          />
          <span className="text-xs font-medium" style={{ color: zone.main }}>
            {score !== null ? zone.label : "No data"}
          </span>
        </div>

        {/* Zone legend */}
        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="text-[8px] text-white/25">&lt;33%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
            <span className="text-[8px] text-white/25">33-66%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-[8px] text-white/25">&gt;66%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
