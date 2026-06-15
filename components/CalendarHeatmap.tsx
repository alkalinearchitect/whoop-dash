"use client";

import { useMemo, useState } from "react";
import type { WhoopRecovery } from "../lib/whoop";

interface CalendarHeatmapProps {
  recovery: WhoopRecovery[];
  explanation: string;
  loading?: boolean;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function cellColor(score: number | null) {
  if (score === null) return "rgba(255,255,255,0.03)";
  if (score >= 66) return "#22c55e";
  if (score >= 33) return "#eab308";
  return "#ef4444";
}

function cellOpacity(score: number | null) {
  if (score === null) return 0.08;
  if (score >= 66) return 1;
  if (score >= 33) return 0.6;
  return 0.35;
}

export function CalendarHeatmap({ recovery, explanation, loading = false }: CalendarHeatmapProps) {
  const [hovered, setHovered] = useState<{ date: string; score: number | null; x: number; y: number } | null>(null);

  const { weeks, stats } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 48); // 7 weeks minus 1 day
    start.setDate(start.getDate() - start.getDay()); // align to Sunday

    const map = new Map<string, number>();
    recovery.forEach(r => {
      const key = new Date(r.created_at).toISOString().split("T")[0];
      const s = r.score?.recovery_score;
      if (s != null) map.set(key, s <= 1 ? Math.round(s * 100) : Math.round(s));
    });

    const wks: { date: string; score: number | null }[][] = [];
    const cur = new Date(start);
    for (let w = 0; w < 7; w++) {
      const week: { date: string; score: number | null }[] = [];
      for (let d = 0; d < 7; d++) {
        const key = cur.toISOString().split("T")[0];
        week.push({ date: key, score: map.has(key) ? map.get(key)! : null });
        cur.setDate(cur.getDate() + 1);
      }
      wks.push(week);
    }

    const scores = Array.from(map.values());
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const green = scores.filter(s => s >= 66).length;
    const red = scores.filter(s => s < 33).length;

    return { weeks: wks, stats: { avg, green, red, total: scores.length } };
  }, [recovery]);

  if (loading) {
    return (
      <div className="glass p-5">
        <div className="skeleton skeleton--title mb-3" />
        <div className="skeleton" style={{ height: 120 }} />
      </div>
    );
  }

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="section-title">Recovery Calendar</p>
        {stats.avg !== null && (
          <span className="text-lg font-bold text-white/80">{stats.avg}%</span>
        )}
      </div>
      <p className="explanation">{explanation}</p>

      {stats.total > 0 && (
        <div className="flex gap-3 mt-2 mb-3">
          <span className="flex items-center gap-1 text-[10px] text-white/40">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> {stats.green} green
          </span>
          <span className="flex items-center gap-1 text-[10px] text-white/40">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> {stats.red} red
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="flex gap-[3px]">
          <div className="flex flex-col gap-[3px]">
            {DAY_LABELS.map((l, i) => (
              <div key={i} className="h-[14px] flex items-center">
                <span className="text-[7px] text-white/20">{i % 2 === 1 ? l : ""}</span>
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div
                  key={di}
                  className="w-[14px] h-[14px] rounded-[3px] cursor-pointer transition-transform hover:scale-150 hover:z-10"
                  style={{ backgroundColor: cellColor(day.score), opacity: cellOpacity(day.score) }}
                  onMouseEnter={e => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setHovered({ date: day.date, score: day.score, x: r.left, y: r.top });
                  }}
                  onMouseLeave={() => setHovered(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[8px] text-white/25">7 weeks</span>
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-white/25">Low</span>
          {["#ef4444", "#eab308", "#22c55e"].map((c, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: c, opacity: 0.3 + i * 0.35 }} />
          ))}
          <span className="text-[8px] text-white/25">High</span>
        </div>
      </div>

      {hovered && (
        <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-black/90 px-2.5 py-1.5"
          style={{ left: hovered.x + 7, top: hovered.y - 8 }}>
          <p className="text-[10px] text-white/50">{hovered.date}</p>
          <p className="text-xs font-semibold text-white/80">
            {hovered.score !== null ? `${hovered.score}% recovery` : "No data"}
          </p>
        </div>
      )}
    </div>
  );
}
