"use client";

import { useMemo } from "react";
import type { Workout } from "../lib/whoop";

interface WorkoutCardProps {
  workout: Workout;
  loading?: boolean;
}

const SPORT_NAMES: Record<number, string> = {
  0: "Running", 1: "Cycling", 2: "Swimming", 3: "Weightlifting",
  4: "Yoga", 5: "Basketball", 6: "Soccer", 7: "Tennis",
  8: "Rowing", 9: "Hiking", 10: "Boxing", 11: "Martial Arts",
  12: "CrossFit", 13: "HIIT", 14: "Pilates", 15: "Dance",
  16: "Surfing", 17: "Strength", 18: "Snowboarding", 19: "Rock Climbing",
  32: "Strength", 33: "Functional Fitness", 43: "Virtual Run",
  59: "Outdoor Run", 60: "Outdoor Bike", 62: "Trail Run",
  100: "Other",
};

const SPORT_ICONS: Record<number, string> = {
  0: "🏃", 1: "🚴", 2: "🏊", 3: "🏋️", 4: "🧘", 5: "🏀", 6: "⚽", 7: "🎾",
  8: "🚣", 9: "🥾", 10: "🥊", 12: "💪", 13: "🔥", 17: "🏋️", 19: "🧗",
  32: "🏋️", 43: "🏃", 59: "🏃", 60: "🚴", 62: "🏃",
};

const ZONE_COLORS = ["#6b7280", "#3b82f6", "#22c55e", "#eab308", "#f97316", "#ef4444"];
const ZONE_KEYS = [
  "zone_zero_milli",
  "zone_one_milli",
  "zone_two_milli",
  "zone_three_milli",
  "zone_four_milli",
  "zone_five_milli",
] as const;

function getSportName(id: number): string {
  return SPORT_NAMES[id] || `Sport ${id}`;
}

function getSportIcon(id: number): string {
  return SPORT_ICONS[id] || "🏃";
}

function formatDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const remain = mins % 60;
  return remain > 0 ? `${h}h ${remain}m` : `${h}h`;
}

function getStrainColor(strain: number): string {
  if (strain >= 18) return "#ef4444";
  if (strain >= 14) return "#f97316";
  if (strain >= 10) return "#22c55e";
  return "#3b82f6";
}

export function WorkoutCard({ workout, loading }: WorkoutCardProps) {
  const details = useMemo(() => {
    const sport = getSportName(workout.sport_id);
    const icon = getSportIcon(workout.sport_id);
    const strain = workout.score?.strain ?? 0;
    const avgHr = workout.score?.average_heart_rate;
    const maxHr = workout.score?.max_heart_rate;
    const kj = workout.score?.kilojoule;
    const duration = formatDuration(workout.start, workout.end);
    const date = new Date(workout.start).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Zone breakdown
    const zd = workout.score?.zone_duration;
    const zones = ZONE_KEYS.map((key, i) => ({
      label: `Z${i}`,
      ms: zd?.[key] ?? 0,
      color: ZONE_COLORS[i],
    }));
    const totalZoneMs = zones.reduce((s, z) => s + z.ms, 0) || 1;
    const zonePcts = zones.map((z) => ({
      ...z,
      pct: Math.round((z.ms / totalZoneMs) * 100),
    }));

    return {
      sport,
      icon,
      strain,
      avgHr,
      maxHr,
      kj,
      duration,
      date,
      zonePcts,
      strainColor: getStrainColor(strain),
    };
  }, [workout]);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-white/[0.06]" />
          <div className="flex-1">
            <div className="h-4 w-24 rounded bg-white/[0.06] mb-1" />
            <div className="h-3 w-32 rounded bg-white/[0.04]" />
          </div>
        </div>
        <div className="h-20 rounded-xl bg-white/[0.03]" />
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]">
      {/* Gradient accent */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${details.strainColor}08, transparent 60%)`,
        }}
      />

      <div className="relative">
        {/* Header row */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: `${details.strainColor}15` }}
          >
            {details.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white/85">{details.sport}</h4>
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                style={{
                  backgroundColor: `${details.strainColor}20`,
                  color: details.strainColor,
                }}
              >
                {details.strain.toFixed(1)} strain
              </span>
            </div>
            <p className="text-[10px] text-white/30">{details.date}</p>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="mb-4 grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-[8px] font-semibold uppercase tracking-wider text-white/25">
              Duration
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white/70">{details.duration}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-semibold uppercase tracking-wider text-white/25">
              Avg HR
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white/70">
              {details.avgHr ? `${details.avgHr} bpm` : "—"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-semibold uppercase tracking-wider text-white/25">
              Max HR
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white/70">
              {details.maxHr ? `${details.maxHr} bpm` : "—"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-semibold uppercase tracking-wider text-white/25">
              Energy
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white/70">
              {details.kj ? `${Math.round(details.kj)} kJ` : "—"}
            </p>
          </div>
        </div>

        {/* Zone breakdown mini-bars */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
          <p className="mb-2 text-[8px] font-semibold uppercase tracking-wider text-white/25">
            Heart Rate Zone Distribution
          </p>
          {/* Stacked bar */}
          <div className="mb-2 flex h-2.5 overflow-hidden rounded-full">
            {details.zonePcts.map((zone) => (
              <div
                key={zone.label}
                className="h-full transition-all duration-500"
                style={{
                  width: `${Math.max(zone.pct, 1)}%`,
                  backgroundColor: zone.color,
                }}
                title={`${zone.label}: ${zone.pct}%`}
              />
            ))}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            {details.zonePcts
              .filter((z) => z.pct > 0)
              .map((zone) => (
                <div key={zone.label} className="flex items-center gap-1">
                  <div
                    className="h-1.5 w-1.5 rounded-sm"
                    style={{ backgroundColor: zone.color }}
                  />
                  <span className="text-[8px] text-white/30">
                    {zone.label} {zone.pct}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
