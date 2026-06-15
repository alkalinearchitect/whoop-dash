"use client";

import { useEffect, useState, useMemo } from "react";

interface RecoveryGaugeProps {
  score: number | null;
  explanation: string;
  loading?: boolean;
  size?: number;
}

function zoneColor(score: number) {
  if (score >= 66) return { main: "var(--success)", label: "Optimal" };
  if (score >= 33) return { main: "var(--warning)", label: "Moderate" };
  return { main: "var(--danger)", label: "Low" };
}

export function RecoveryGauge({
  score,
  explanation,
  loading = false,
  size = 140,
}: RecoveryGaugeProps) {
  const [anim, setAnim] = useState(0);
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = r * 2 * Math.PI;
  const c = size / 2;
  const zone = useMemo(() => zoneColor(score ?? 0), [score]);

  useEffect(() => {
    if (score === null) { setAnim(0); return; }
    const start = performance.now();
    const dur = 900;
    function tick(now: number) {
      const p = Math.min((now - start) / dur, 1);
      setAnim((score ?? 0) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [score]);

  const offset = circ - (anim / 100) * circ;

  if (loading) {
    return (
      <div className="glass flex flex-col items-center p-5">
        <div className="skeleton skeleton--circle" style={{ width: size, height: size }} />
        <div className="skeleton skeleton--text-short mt-3" />
      </div>
    );
  }

  return (
    <div className="glass flex flex-col items-center p-5">
      <p className="metric-label mb-3">Recovery</p>
      <div className="ring-container" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={c} cy={c} r={r} stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} fill="none" />
          <circle
            cx={c} cy={c} r={r}
            stroke={zone.main}
            strokeWidth={stroke} fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ opacity: score != null ? 1 : 0.15 }}
          />
        </svg>
        <span className="ring-value" style={{ color: score != null ? zone.main : "rgba(255,255,255,0.2)" }}>
          {score != null ? Math.round(anim) : "—"}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <span className="status-dot" style={{ background: zone.main, width: 8, height: 8 }} />
        <span className="text-xs font-medium" style={{ color: zone.main }}>
          {score != null ? zone.label : "No data"}
        </span>
      </div>
      <p className="explanation">{explanation}</p>
    </div>
  );
}
