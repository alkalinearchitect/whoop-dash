import { Flame, Moon, TrendingUp, AlertTriangle } from "lucide-react";
import {
  formatDuration,
  formatDate,
  sleepActual,
  sleepNeeded,
  sleepNeededBaseline,
  sleepNeededDebt,
  sleepNeededNap,
  sleepNeededStrain,
  sleepPerformance,
} from "@/lib/dashboard-utils";
import type { WhoopSleep as SleepRecord } from "@/lib/whoop";

interface SleepNeedVsActualProps {
  sleeps: SleepRecord[];
  avgEfficiency: number;
}

function statusFor(deficitMs: number, perf: number) {
  if (deficitMs <= 0 && perf >= 85) {
    return { label: "Covered", className: "text-green-400" };
  }
  if (deficitMs <= 0) {
    return { label: "Need met", className: "text-cyan-400" };
  }
  return { label: "Deficit", className: "text-[#ff2d55]" };
}

export function SleepNeedVsActual({ sleeps, avgEfficiency }: SleepNeedVsActualProps) {
  const recent = sleeps.slice(0, 5);
  const avgNeed = recent.length
    ? Math.round(recent.reduce((sum, sleep) => sum + sleepNeeded(sleep), 0) / recent.length)
    : 0;
  const avgActual = recent.length
    ? Math.round(recent.reduce((sum, sleep) => sum + sleepActual(sleep), 0) / recent.length)
    : 0;
  const avgDelta = avgActual - avgNeed;
  const coveredNights = recent.filter((sleep) => sleepActual(sleep) >= sleepNeeded(sleep)).length;

  return (
    <section className="panel p-4 sm:p-6">
      <div className="section-heading">
        <div>
          <h2>Sleep need vs actual</h2>
          <p>Baseline, debt, strain, and nap load — compared against actual sleep, not just time in bed.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="pill">{avgEfficiency}% avg efficiency</span>
          <span className={`pill ${avgDelta >= 0 ? "pill-live" : "pill-crimson"}`}>
            {avgDelta >= 0 ? "+" : ""}{formatDuration(Math.abs(avgDelta))} {avgDelta >= 0 ? "avg surplus" : "avg deficit"}
          </span>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
            Avg need
            <Moon className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-[760] tracking-tight text-white">{formatDuration(avgNeed)}</div>
          <div className="mt-1 text-[11px] text-white/40">{recent.length} scored nights</div>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
            Avg actual
            <TrendingUp className="h-3.5 w-3.5 text-[#00d4ff]" />
          </div>
          <div className="text-2xl font-[760] tracking-tight text-white">{formatDuration(avgActual)}</div>
          <div className="mt-1 text-[11px] text-white/40">Light + deep + REM</div>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
            Balance
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className={`text-2xl font-[760] tracking-tight ${avgDelta >= 0 ? "text-green-400" : "text-[#ff2d55]"}`}>
            {avgDelta >= 0 ? "+" : ""}{formatDuration(Math.abs(avgDelta))}
          </div>
          <div className="mt-1 text-[11px] text-white/40">{avgDelta >= 0 ? "ahead of need" : "below need"}</div>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
            Covered
            <Flame className="h-3.5 w-3.5 text-[#ff2d55]" />
          </div>
          <div className="text-2xl font-[760] tracking-tight text-white">{coveredNights}/{recent.length}</div>
          <div className="mt-1 text-[11px] text-white/40">nights met need</div>
        </div>
      </div>

      {recent.length > 0 ? (
        <div className="space-y-3">
          {recent.map((sleep: SleepRecord, index: number) => {
            const need = sleepNeeded(sleep);
            const actual = sleepActual(sleep);
            const perf = sleepPerformance(sleep);
            const baseline = sleepNeededBaseline(sleep);
            const debt = sleepNeededDebt(sleep);
            const strainNeed = sleepNeededStrain(sleep);
            const napNeed = sleepNeededNap(sleep);
            const totalNeed = Math.max(need, 1);
            const delta = actual - totalNeed;
            const status = statusFor(delta, perf);
            const baselinePct = Math.min((baseline / totalNeed) * 100, 100);
            const debtPct = Math.min((debt / totalNeed) * 100, 100);
            const strainPct = Math.min((strainNeed / totalNeed) * 100, 100);
            const napPct = Math.min((napNeed / totalNeed) * 100, 100);
            const actualPct = Math.min((actual / totalNeed) * 100, 100);

            return (
              <article
                key={sleep.id || index}
                className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-[#ff2d55]/25 hover:bg-white/[0.045]"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">{formatDate(sleep.start)}</div>
                    <div className="mt-1 text-sm text-white/60">
                      {sleep.nap ? "Nap adjustment included" : "Nightly sleep score"}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-[800] ${perf >= 85 ? "text-green-400" : perf >= 60 ? "text-amber-400" : "text-[#ff2d55]"}`}>
                      {perf}% performance
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-[800] uppercase tracking-[0.12em] ${
                      delta >= 0 ? "border-green-400/25 text-green-300 bg-green-400/8" : "border-[#ff2d55]/25 text-[#ff8aa4] bg-[#ff2d55]/8"
                    }`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-[11px] text-white/40">
                      <span>Sleep need stack</span>
                      <span>{formatDuration(totalNeed)}</span>
                    </div>
                    <div className="flex h-4 overflow-hidden rounded-full bg-white/[0.055] ring-1 ring-white/[0.05]">
                      <div className="h-full bg-[#00d4ff]/80" style={{ width: `${baselinePct}%` }} />
                      {debt > 0 && <div className="h-full bg-[#ff2d55]/70" style={{ width: `${debtPct}%` }} />}
                      {strainNeed > 0 && <div className="h-full bg-amber-500/70" style={{ width: `${strainPct}%` }} />}
                      {napNeed > 0 && <div className="h-full bg-purple-500/70" style={{ width: `${napPct}%` }} />}
                    </div>
                    <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/[0.04]">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-white/80 shadow-[0_0_24px_rgba(255,255,255,0.55)]" style={{ width: `${actualPct}%` }} />
                      <div
                        className="absolute -top-1 h-4 w-0.5 rounded-full bg-[#ff2d55] shadow-[0_0_18px_rgba(255,45,85,0.8)]"
                        style={{ left: `${Math.min(100, (totalNeed / Math.max(totalNeed, actual)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 lg:min-w-[220px]">
                    <div className="rounded-xl border border-white/[0.06] bg-black/15 p-3 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">Need</div>
                      <div className="mt-1 text-lg font-[760] text-white">{formatDuration(totalNeed)}</div>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-black/15 p-3 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">Actual</div>
                      <div className="mt-1 text-lg font-[760] text-white">{formatDuration(actual)}</div>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-black/15 p-3 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">Gap</div>
                      <div className={`mt-1 text-lg font-[760] ${delta >= 0 ? "text-green-400" : "text-[#ff2d55]"}`}>
                        {delta >= 0 ? "+" : ""}{formatDuration(Math.abs(delta))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-black/15 p-3 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">Perf</div>
                      <div className="mt-1 text-lg font-[760] text-white">{perf}%</div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
          <Moon className="mx-auto mb-3 h-8 w-8 text-white/20" />
          <p className="text-sm text-white/50">No scored sleep records yet. WHOOP data will appear here after login.</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] text-white/45 md:grid-cols-5">
        <span className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-2"><span className="h-2 w-2 rounded-sm bg-[#00d4ff]/80" />Baseline</span>
        <span className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-2"><span className="h-2 w-2 rounded-sm bg-[#ff2d55]/70" />Debt</span>
        <span className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-2"><span className="h-2 w-2 rounded-sm bg-amber-500/70" />Strain</span>
        <span className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-2"><span className="h-2 w-2 rounded-sm bg-purple-500/70" />Nap</span>
        <span className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-2"><span className="h-2 w-4 rounded-full bg-white/80" />Actual sleep</span>
      </div>
    </section>
  );
}
