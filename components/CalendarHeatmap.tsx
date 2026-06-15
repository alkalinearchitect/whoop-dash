"use client";

import { useMemo, useState } from "react";
import type { Cycle } from "../lib/whoop";

interface CalendarHeatmapProps {
  cycles: Cycle[];
  loading?: boolean;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getColor(score: number | null): string {
  if (score === null) return "rgba(255,255,255,0.03)";
  if (score >= 66) return "#22c55e";
  if (score >= 55) return "#84cc16";
  if (score >= 44) return "#eab308";
  if (score >= 33) return "#f97316";
  return "#ef4444";
}

function getIntensity(score: number | null): number {
  if (score === null) return 0.08;
  if (score >= 66) return 1;
  if (score >= 55) return 0.8;
  if (score >= 44) return 0.6;
  if (score >= 33) return 0.4;
  return 0.25;
}

export function CalendarHeatmap({ cycles, loading }: CalendarHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    score: number | null;
    x: number;
    y: number;
  } | null>(null);

  const { weeks, monthLabels, stats } = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 89); // 90 days
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const cycleMap = new Map<string, number>();
    cycles.forEach((c) => {
      const date = new Date(c.end);
      const key = date.toISOString().split("T")[0];
      const score = c.score?.recovery_score;
      if (score !== null && score !== undefined) {
        // WHOOP returns recovery_score as 0-1 float, convert to percentage
        cycleMap.set(key, score <= 1 ? Math.round(score * 100) : Math.round(score));
      }
    });

    const weekData: { date: string; score: number | null; day: number }[][] = [];
    const currentDate = new Date(startDate);
    const totalWeeks = 13; // ~90 days

    for (let w = 0; w < totalWeeks; w++) {
      const week: { date: string; score: number | null; day: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const key = currentDate.toISOString().split("T")[0];
        week.push({
          date: key,
          score: cycleMap.has(key) ? cycleMap.get(key)! : null,
          day: currentDate.getDay(),
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weekData.push(week);
    }

    // Month labels
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weekData.forEach((week, col) => {
      const month = new Date(week[0].date).getMonth();
      if (month !== lastMonth) {
        labels.push({
          label: new Date(week[0].date).toLocaleDateString("en-US", { month: "short" }),
          col,
        });
        lastMonth = month;
      }
    });

    // Stats
    const allScores = Array.from(cycleMap.values());
    const avgScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : null;
    const greenDays = allScores.filter((s) => s >= 66).length;
    const redDays = allScores.filter((s) => s < 33).length;

    return {
      weeks: weekData,
      monthLabels: labels,
      stats: { avgScore, greenDays, redDays, totalDays: allScores.length },
    };
  }, [cycles]);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
        <div className="h-8 w-48 rounded-lg bg-white/[0.06] mb-4" />
        <div className="h-28 rounded-xl bg-white/[0.04]" />
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
            <span className="text-xl">📅</span>
          </div>
          <p className="text-sm font-medium text-white/60">No recovery data</p>
          <p className="mt-1 text-xs text-white/30">Recovery scores will appear here over time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white/90">Recovery Heatmap</h3>
          <p className="mt-0.5 text-xs text-white/40">Last 90 days · Daily recovery scores</p>
        </div>
        {stats.avgScore !== null && (
          <div className="text-right">
            <p className="text-lg font-bold text-white/80">{stats.avgScore}%</p>
            <p className="text-[9px] font-medium uppercase tracking-wider text-white/30">
              90d avg
            </p>
          </div>
        )}
      </div>

      {/* Stats row */}
      {stats.totalDays > 0 && (
        <div className="mb-4 flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-green-500" />
            <span className="text-[10px] text-white/40">
              {stats.greenDays} green ({Math.round((stats.greenDays / stats.totalDays) * 100)}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-red-500" />
            <span className="text-[10px] text-white/40">
              {stats.redDays} red ({Math.round((stats.redDays / stats.totalDays) * 100)}%)
            </span>
          </div>
        </div>
      )}

      {/* Heatmap grid */}
      <div className="relative overflow-x-auto">
        <div className="flex gap-[3px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] pt-0">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="flex h-[14px] w-[10px] items-center justify-center"
              >
                <span className="text-[7px] text-white/20">
                  {i % 2 === 1 ? label : ""}
                </span>
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div
                  key={di}
                  className="group relative h-[14px] w-[14px] cursor-pointer rounded-[3px] transition-all duration-150 hover:scale-150 hover:z-10"
                  style={{
                    backgroundColor: getColor(day.score),
                    opacity: getIntensity(day.score),
                  }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredDay({
                      date: day.date,
                      score: day.score,
                      x: rect.left,
                      y: rect.top,
                    });
                  }}
                  onMouseLeave={() => setHoveredDay(null)}
                  title={
                    day.score !== null
                      ? `${day.date}: ${day.score}% recovery`
                      : day.date
                  }
                />
              ))}
            </div>
          ))}
        </div>

        {/* Month labels */}
        <div className="relative mt-1 h-4">
          {monthLabels.map((m, i) => (
            <span
              key={i}
              className="absolute text-[8px] text-white/25"
              style={{ left: `${14 + m.col * 17}px` }}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[9px] text-white/25">90 days</span>
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-white/25">Low</span>
          {["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"].map((color, i) => (
            <div
              key={i}
              className="h-2.5 w-2.5 rounded-[2px]"
              style={{ backgroundColor: color, opacity: 0.3 + i * 0.17 }}
            />
          ))}
          <span className="text-[8px] text-white/25">High</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-black/90 px-2.5 py-1.5 shadow-xl backdrop-blur-xl"
          style={{
            left: hoveredDay.x + 7,
            top: hoveredDay.y - 8,
          }}
        >
          <p className="text-[10px] text-white/50">{hoveredDay.date}</p>
          <p className="text-xs font-semibold text-white/80">
            {hoveredDay.score !== null ? `${hoveredDay.score}% recovery` : "No data"}
          </p>
        </div>
      )}
    </div>
  );
}
