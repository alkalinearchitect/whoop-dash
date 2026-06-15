"use client";

import { useMemo } from "react";
import { Clock, Flame, Heart, Zap } from "lucide-react";
import type { WhoopWorkout } from "../lib/whoop";
import { getSportName } from "../lib/whoop";

interface WorkoutCardProps {
  workout: WhoopWorkout;
  explanation: string;
  loading?: boolean;
}

const ZONE_COLORS = ["#00d4ff", "#22c55e", "#eab308", "#f97316", "#ef4444"];
const ZONE_KEYS = ["zone_one_milli","zone_two_milli","zone_three_milli","zone_four_milli","zone_five_milli"] as const;
const ZONE_NAMES = ["Easy","Fat Burning","Tempo","Threshold","Max Effort"];

function fmtDur(start: string, end: string) {
  const m = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
}

function insight(strain: number, avgHr: number | null) {
  if (strain < 8) return "Recovery-focused session. Easy effort that promotes blood flow without adding fatigue.";
  if (strain < 14) return `Great zone 3-4 work. Solid aerobic stimulus at ${avgHr ?? "—"} bpm average — builds endurance.`;
  if (strain < 18) return "High-intensity session. Make sure to sleep well tonight to absorb the training benefit.";
  return "Maximum effort. Your body needs 24–48h to fully adapt. Prioritize rest and nutrition.";
}

export function WorkoutCard({ workout, explanation, loading = false }: WorkoutCardProps) {
  const d = useMemo(() => {
    const sport = getSportName(workout.sport_id);
    const strain = workout.score?.strain ?? 0;
    const avgHr = workout.score?.average_heart_rate ?? null;
    const maxHr = workout.score?.max_heart_rate ?? null;
    const kj = workout.score?.kilojoule ?? null;
    const duration = fmtDur(workout.start, workout.end);
    const date = new Date(workout.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
    const zd = workout.score?.zone_duration;
    const zones = ZONE_KEYS.map((key, i) => ({ label: `Z${i + 1}`, name: ZONE_NAMES[i], ms: zd?.[key] ?? 0, color: ZONE_COLORS[i] }));
    const total = zones.reduce((s, z) => s + z.ms, 0) || 1;
    const zonePcts = zones.map(z => ({ ...z, pct: Math.round((z.ms / total) * 100) }));
    return { sport, strain, avgHr, maxHr, kj, duration, date, zonePcts, insight: insight(strain, avgHr) };
  }, [workout]);

  if (loading) {
    return (
      <div className="glass p-4">
        <div className="skeleton skeleton--title mb-3" />
        <div className="card-grid--2col mb-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton--card" style={{ height: 48 }} />)}
        </div>
        <div className="skeleton skeleton--text" />
      </div>
    );
  }

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-white/85">{d.sport}</h4>
          <p className="text-[10px] text-white/35">{d.date}</p>
        </div>
        <span className="pill" style={{ borderColor: d.strain >= 15 ? "var(--danger)" : d.strain >= 10 ? "var(--warning)" : "var(--success)", color: d.strain >= 15 ? "var(--danger)" : d.strain >= 10 ? "var(--warning)" : "var(--success)" }}>
          {d.strain.toFixed(1)} strain
        </span>
      </div>

      <div className="card-grid--2col mb-3">
        {[
          { Icon: Clock, val: d.duration, lbl: "Duration" },
          { Icon: Heart,  val: d.avgHr ? `${d.avgHr}` : "—", lbl: "Avg HR" },
          { Icon: Flame,  val: d.maxHr ? `${d.maxHr}` : "—", lbl: "Max HR" },
          { Icon: Zap,    val: d.kj ? `${Math.round(d.kj)}` : "—", lbl: "kJ" },
        ].map(({ Icon, val, lbl }) => (
          <div key={lbl} className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-2 text-center">
            <Icon className="mx-auto mb-1 h-3 w-3 text-white/30" />
            <p className="text-xs font-semibold text-white/75">{val}</p>
            <p className="text-[8px] text-white/25">{lbl}</p>
          </div>
        ))}
      </div>

      {/* Zone bar */}
      <div className="mb-3">
        <div className="flex h-2 overflow-hidden rounded-full">
          {d.zonePcts.filter(z => z.pct > 0).map(z => (
            <div key={z.label} className="h-full" style={{ width: `${Math.max(z.pct, 2)}%`, background: z.color }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 mt-1">
          {d.zonePcts.filter(z => z.pct > 0).map(z => (
            <span key={z.label} className="text-[8px] text-white/30">{z.name} {z.pct}%</span>
          ))}
        </div>
      </div>

      <div className="ai-readout">
        <p className="text-[11px]">{d.insight}</p>
      </div>
      <p className="explanation">{explanation}</p>
    </div>
  );
}
