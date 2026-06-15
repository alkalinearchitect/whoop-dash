import { cookies } from "next/headers";
import {
  Activity, Moon, Heart, Flame, TrendingUp, TrendingDown,
  Minus, Zap, Droplets, Thermometer, Wind,
  BarChart3, Wifi, WifiOff, RefreshCw, AlertTriangle, Timer, Target,
  Calendar, Clock, Dumbbell
} from "lucide-react";
import { RecoveryGauge } from "@/components/RecoveryGauge";
import { MetricCard } from "@/components/MetricCard";
import { TrendChart } from "@/components/TrendChart";
import { Hypnogram } from "@/components/Hypnogram";
import { StrainZones } from "@/components/StrainZones";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { WorkoutCard } from "@/components/WorkoutCard";
import { SignalsPanel } from "@/components/SignalsPanel";
import { RecoveryBreakdown } from "@/components/RecoveryBreakdown";
import { Streaks } from "@/components/Streaks";
import { generateMockData } from "@/lib/whoop";
import {
  cycleStrain, recoveryScore, recoveryHRV, recoveryRHR, recoverySpO2, recoverySkinTemp,
  sleepEfficiency, sleepConsistency, sleepPerformance, sleepRespiratoryRate,
  sleepInBed, sleepNeeded, sleepDisturbances,
  formatDuration, formatDate, computeStreak, generateSignals,
} from "@/lib/dashboard-utils";
import type { Cycle, Recovery, SleepRecord, Workout } from "@/lib/whoop";

// ─── Data Fetching ───────────────────────────────────────────────────────────

async function fetchWhoopData(limit: number = 30) {
  const cookieStore = await cookies();
  const token = cookieStore.get("whoop_token")?.value;
  if (token) {
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const [userRes, cyclesRes, recoveryRes, sleepRes, workoutsRes] = await Promise.all([
        fetch("https://api.prod.whoop.com/developer/v2/user/profile", { headers }),
        fetch(`https://api.prod.whoop.com/developer/v2/cycle?limit=${limit}`, { headers }),
        fetch(`https://api.prod.whoop.com/developer/v2/recovery?limit=${limit}`, { headers }),
        fetch(`https://api.prod.whoop.com/developer/v2/activity/sleep?limit=${limit}`, { headers }),
        fetch(`https://api.prod.whoop.com/developer/v2/activity/workout?limit=${limit}`, { headers }),
      ]);
      if (userRes.ok && cyclesRes.ok) {
        const user = await userRes.json();
        const cycles = await cyclesRes.json();
        const recovery = recoveryRes.ok ? await recoveryRes.json() : { records: [] };
        const sleep = sleepRes.ok ? await sleepRes.json() : { records: [] };
        const workouts = workoutsRes.ok ? await workoutsRes.json() : { records: [] };
        return {
          user: user || null,
          cycles: cycles.records || [],
          recovery: recovery.records || [],
          sleep: sleep.records || [],
          workouts: workouts.records || [],
          source: "whoop-api",
          fetched_at: new Date().toISOString(),
        };
      }
    } catch (e) {
      console.error("WHOOP API error:", e);
    }
  }
  return generateMockData(limit);
}

// ─── Stat Card Config ────────────────────────────────────────────────────────

interface StatConfig {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  explanation: string;
  detail: React.ReactNode;
}

function buildOverviewStats(data: ReturnType<typeof generateMockData>): StatConfig[] {
  const r0 = data.recovery[0];
  const s0 = data.sleep[0];
  const c0 = data.cycles[0];
  return [
    {
      label: "HRV",
      value: String(r0 ? recoveryHRV(r0) : 0),
      unit: "ms",
      icon: <Heart className="w-3.5 h-3.5" />,
      color: "#06b6d4",
      explanation: "Heart Rate Variability reflects autonomic nervous system resilience. Higher = better recovery capacity.",
      detail: (
        <div className="space-y-1.5 text-[11px] text-white/50">
          <p>• <strong className="text-white/60">Optimal:</strong> 50+ ms — strong parasympathetic tone</p>
          <p>• <strong className="text-white/60">Moderate:</strong> 30–49 ms — adequate recovery</p>
          <p>• <strong className="text-white/60">Low:</strong> &lt;30 ms — stress or fatigue detected</p>
          <p className="text-white/30 mt-2">WHOOP tracks HRV during sleep. Watch the 7-day trend, not daily fluctuations.</p>
        </div>
      ),
    },
    {
      label: "Resting HR",
      value: String(r0 ? recoveryRHR(r0) : 0),
      unit: "bpm",
      icon: <Activity className="w-3.5 h-3.5" />,
      color: "#ef4444",
      explanation: "Resting Heart Rate indicates cardiovascular fitness and recovery status. Lower is generally better.",
      detail: (
        <div className="space-y-1.5 text-[11px] text-white/50">
          <p>• <strong className="text-white/60">Athletic:</strong> 40–55 bpm</p>
          <p>• <strong className="text-white/60">Average:</strong> 60–80 bpm</p>
          <p>• <strong className="text-white/60">Elevated:</strong> 80+ bpm — stress, dehydration, or illness</p>
          <p className="text-white/30 mt-2">RHR spikes when your body is fighting something or hasn't recovered from yesterday's strain.</p>
        </div>
      ),
    },
    {
      label: "SpO2",
      value: String(r0 ? recoverySpO2(r0) : 0),
      unit: "%",
      icon: <Droplets className="w-3.5 h-3.5" />,
      color: "#10b981",
      explanation: "Blood oxygen saturation during sleep. Healthy levels are 95–100%.",
      detail: (
        <div className="space-y-1.5 text-[11px] text-white/50">
          <p>• <strong className="text-white/60">Normal:</strong> 95–100%</p>
          <p>• <strong className="text-white/60">Monitor:</strong> 90–94% — consult if persistent</p>
          <p>• <strong className="text-white/60">Concerning:</strong> Below 90% — seek medical advice</p>
          <p className="text-white/30 mt-2">Altitude, sleep apnea, and congestion can cause temporary drops.</p>
        </div>
      ),
    },
    {
      label: "Resp Rate",
      value: String(s0 ? sleepRespiratoryRate(s0).toFixed(1) : "—"),
      unit: "brpm",
      icon: <Wind className="w-3.5 h-3.5" />,
      color: "#8b5cf6",
      explanation: "Respiratory rate during sleep. Lower, steadier breathing indicates deeper recovery.",
      detail: (
        <div className="space-y-1.5 text-[11px] text-white/50">
          <p>• <strong className="text-white/60">Restful:</strong> 12–16 breaths/min</p>
          <p>• <strong className="text-white/60">Elevated:</strong> 18+ — stress, alcohol, or illness</p>
          <p>• <strong className="text-white/60">Athletes:</strong> Often 10–14 breaths/min</p>
          <p className="text-white/30 mt-2">Alcohol and late meals spike respiratory rate. Track to find your optimal evening routine.</p>
        </div>
      ),
    },
    {
      label: "Skin Temp",
      value: String(r0 ? recoverySkinTemp(r0).toFixed(1) : "—"),
      unit: "°C",
      icon: <Thermometer className="w-3.5 h-3.5" />,
      color: "#f97316",
      explanation: "Skin temperature deviation from your baseline. Spikes can indicate illness or hormonal changes.",
      detail: (
        <div className="space-y-1.5 text-[11px] text-white/50">
          <p>• <strong className="text-white/60">Normal range:</strong> 33–36°C</p>
          <p>• <strong className="text-white/60">Spike:</strong> +0.5°C+ may indicate immune response</p>
          <p>• <strong className="text-white/60">Drop:</strong> Cold environment or poor circulation</p>
          <p className="text-white/30 mt-2">Track deviations from your personal baseline, not absolute values.</p>
        </div>
      ),
    },
    {
      label: "Sleep Perf",
      value: s0 ? String(sleepPerformance(s0)) : "—",
      unit: "%",
      icon: <Moon className="w-3.5 h-3.5" />,
      color: "#6366f1",
      explanation: "Sleep performance vs your need. Above 85% means you're meeting your recovery demands.",
      detail: (
        <div className="space-y-1.5 text-[11px] text-white/50">
          <p>• <strong className="text-white/60">Excellent:</strong> 90%+</p>
          <p>• <strong className="text-white/60">Good:</strong> 80–89%</p>
          <p>• <strong className="text-white/60">Insufficient:</strong> Below 80% — increase time in bed</p>
          <p className="text-white/30 mt-2">High strain days increase your sleep need. Don't skimp after hard sessions.</p>
        </div>
      ),
    },
  ];
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const selectedPeriod = (Number(params.period) || 30) as 30 | 60 | 90;
  const activeTab = (params.tab as "overview" | "sleep" | "strain" | "trends") || "overview";
  const data = await fetchWhoopData(selectedPeriod);
  const signals = generateSignals(data);
  const stats = buildOverviewStats(data);
  const recoveryStreak = computeStreak(data.recovery, (r: Recovery) => recoveryScore(r), 66);
  const sleepStreak = computeStreak(data.sleep, (s: SleepRecord) => sleepEfficiency(s), 85);
  const isLive = data.source === "whoop-api";
  const state = Math.random().toString(36).substring(2, 15);
  const oauthUrl = `https://api.prod.whoop.com/oauth/oauth2/auth?response_type=code&client_id=${process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID || ""}&redirect_uri=${process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI || ""}&scope=read:recovery%20read:cycles%20read:sleep%20read:workout%20read:profile&state=${state}`;

  const TABS = [
    { id: "overview" as const, label: "Overview", labelShort: "Home", icon: BarChart3 },
    { id: "sleep" as const, label: "Sleep", labelShort: "Sleep", icon: Moon },
    { id: "strain" as const, label: "Strain", labelShort: "Strain", icon: Flame },
    { id: "trends" as const, label: "Trends", labelShort: "Trends", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] pb-20 md:pb-0">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-bold gradient-text truncate">WHOOP Command Center</h1>
                <p className="text-[10px] sm:text-xs text-zinc-500 truncate">
                  {isLive ? (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live data
                      {data.fetched_at && <span className="text-white/30"> · Updated {new Date(data.fetched_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                    </span>
                  ) : (
                    "Demo mode — Connect WHOOP for live data"
                  )}
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {!isLive && (
                <a href={oauthUrl} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 hover:bg-cyan-500/30 transition-all text-sm font-medium active:scale-95">
                  <Zap className="w-4 h-4" />Connect WHOOP
                </a>
              )}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${isLive ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border border-amber-500/20 text-amber-400"}`}>
                {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isLive ? "LIVE" : "DEMO"}
              </div>
              <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                {([30, 60, 90] as const).map((p) => (
                  <a key={p} href={`/?period=${p}&tab=${activeTab}`} className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-95 ${selectedPeriod === p ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-zinc-500 hover:text-zinc-300"}`}>
                    {p}d
                  </a>
                ))}
              </div>
              {recoveryStreak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">{recoveryStreak}d</span>
                  <span className="text-xs text-emerald-500/70 hidden lg:inline">recovery</span>
                </div>
              )}
              {sleepStreak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-indigo-400">{sleepStreak}d</span>
                  <span className="text-xs text-indigo-500/70 hidden lg:inline">sleep</span>
                </div>
              )}
            </div>

            <div className="md:hidden flex items-center gap-2">
              {!isLive && (
                <a href={oauthUrl} className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 text-xs font-medium active:scale-95">
                  <Zap className="w-3 h-3" />Connect
                </a>
              )}
              {isLive && (
                <a href="/" className="p-2 rounded-xl bg-white/5 border border-white/10 active:scale-95">
                  <RefreshCw className="w-4 h-4 text-zinc-400" />
                </a>
              )}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${isLive ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                {isLive ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                {isLive ? "LIVE" : "DEMO"}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation ── */}
      <div className="hidden md:block max-w-[1600px] mx-auto px-6 pt-6">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit border border-white/5">
          {TABS.map((tab) => (
            <a key={tab.id} href={`/?period=${selectedPeriod}&tab=${tab.id}`} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${activeTab === tab.id ? "bg-white/10 text-white border border-white/10" : "text-zinc-500 hover:text-zinc-300"}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="max-w-[1600px] mx-auto px-3 sm:px-6 py-4 sm:py-6">

        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === "overview" && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
            {/* Today's Summary Banner */}
            {signals.length > 0 && (
              <div className={`rounded-2xl border p-4 ${signals[0].type === "warning" ? "border-amber-500/20 bg-amber-500/[0.04]" : signals[0].type === "success" ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-blue-500/20 bg-blue-500/[0.04]"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${signals[0].type === "warning" ? "bg-amber-400/10 text-amber-400" : signals[0].type === "success" ? "bg-green-400/10 text-green-400" : "bg-blue-400/10 text-blue-400"}`}>
                    {signals[0].type === "warning" ? <AlertTriangle className="w-4 h-4" /> : signals[0].type === "success" ? <Zap className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${signals[0].type === "warning" ? "text-amber-400/80" : signals[0].type === "success" ? "text-green-400/80" : "text-blue-400/80"}`}>
                      {signals[0].type === "warning" ? "Attention Needed" : signals[0].type === "success" ? "Looking Great" : "Daily Insight"}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">{signals[0].message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Hero: Recovery + Strain */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="glass-card p-4 sm:p-6 flex flex-col items-center justify-center glow-cyan">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-2 sm:mb-4">Recovery Score</h3>
                <RecoveryGauge score={data.recovery[0] ? recoveryScore(data.recovery[0]) : 0} size={140} />
                <p className="text-[10px] sm:text-xs text-zinc-500 mt-2 sm:mt-3">
                  {data.recovery[0] ? formatDate(data.recovery[0].created_at) : "No data"}
                </p>
              </div>

              <div className="glass-card p-4 sm:p-6 flex flex-col items-center justify-center glow-orange">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-2 sm:mb-4">Day Strain</h3>
                <div className="relative w-32 h-32 sm:w-44 sm:h-44">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="url(#strainGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${Math.min((cycleStrain(data?.cycles[0]) / 21) * 264, 264)} 264`} className="transition-all duration-1000 ease-out" />
                    <defs>
                      <linearGradient id="strainGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl sm:text-4xl font-bold text-white animate-count-up">
                      {data?.cycles[0] ? cycleStrain(data.cycles[0]).toFixed(1) : "—"}
                    </span>
                    <span className="text-[10px] sm:text-xs text-zinc-500">out of 21</span>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-4 mt-2 sm:mt-3 text-[10px] sm:text-xs text-zinc-500">
                  <span>Low: 0-9</span>
                  <span>Mod: 10-14</span>
                  <span>High: 15+</span>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:col-span-2 lg:col-span-1">
                {stats.slice(0, 4).map((s) => (
                  <MetricCard key={s.label} label={s.label} value={s.value} unit={s.unit} icon={s.icon} accentColor={s.color} explanation={s.explanation} detail={s.detail} size="sm" />
                ))}
              </div>
            </div>

            {/* More Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {stats.slice(4).map((s) => (
                <MetricCard key={s.label} label={s.label} value={s.value} unit={s.unit} icon={s.icon} accentColor={s.color} explanation={s.explanation} detail={s.detail} size="sm" />
              ))}
            </div>

            {/* Sleep Need vs Actual + Skin Temp */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="glass-card p-4 sm:p-6 lg:col-span-2">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                  <Moon className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
                  Sleep Need vs Actual
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {data?.sleep.slice(0, 5).map((s: SleepRecord, i: number) => {
                    const needed = sleepNeeded(s);
                    const actual = sleepInBed(s);
                    const perf = sleepPerformance(s);
                    const baseline = s?.score?.sleep_needed?.baseline_milli ?? needed;
                    const debt = s?.score?.sleep_needed?.need_from_sleep_debt_milli ?? 0;
                    const strainNeed = s?.score?.sleep_needed?.need_from_recent_strain_milli ?? 0;
                    const napNeed = s?.score?.sleep_needed?.need_from_recent_nap_milli ?? 0;
                    const totalNeeded = baseline + debt + strainNeed + napNeed;
                    const deficit = actual - totalNeeded;
                    return (
                      <div key={i} className="p-3 sm:p-4 bg-white/[0.02] rounded-xl border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] sm:text-xs text-zinc-500 font-medium">{formatDate(s.start)}</span>
                          <span className={`text-xs sm:text-sm font-semibold ${perf >= 85 ? "text-indigo-400" : perf >= 60 ? "text-amber-400" : "text-red-400"}`}>{perf}%</span>
                        </div>
                        <div className="h-3 sm:h-4 bg-white/5 rounded-full overflow-hidden flex mb-2">
                          <div className="h-full bg-indigo-500/60 transition-all duration-700" style={{ width: `${(baseline / totalNeeded) * 100}%` }} />
                          {debt > 0 && <div className="h-full bg-red-500/50 transition-all duration-700" style={{ width: `${(debt / totalNeeded) * 100}%` }} />}
                          {strainNeed > 0 && <div className="h-full bg-amber-500/50 transition-all duration-700" style={{ width: `${(strainNeed / totalNeeded) * 100}%` }} />}
                          {napNeed > 0 && <div className="h-full bg-purple-500/50 transition-all duration-700" style={{ width: `${(napNeed / totalNeeded) * 100}%` }} />}
                        </div>
                        <div className="relative h-1 bg-white/5 rounded-full mb-2">
                          <div className="absolute h-2 -top-0.5 rounded-full bg-white/80 transition-all duration-700" style={{ width: `${Math.min((actual / totalNeeded) * 100, 100)}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
                          <span className="text-zinc-500">Need: {formatDuration(totalNeeded)}</span>
                          <span className={`font-medium ${deficit >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {deficit >= 0 ? "+" : ""}{formatDuration(Math.abs(deficit))} {deficit >= 0 ? "surplus" : "deficit"}
                          </span>
                          <span className="text-zinc-500">Got: {formatDuration(actual)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-indigo-500/60" /><span className="text-[9px] text-zinc-500">Baseline</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-500/50" /><span className="text-[9px] text-zinc-500">Sleep Debt</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-amber-500/50" /><span className="text-[9px] text-zinc-500">Strain</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-purple-500/50" /><span className="text-[9px] text-zinc-500">Nap</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-0.5 rounded-full bg-white/80" /><span className="text-[9px] text-zinc-500">Actual</span></div>
                </div>
              </div>

              <div className="glass-card p-4 sm:p-6">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                  <Thermometer className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                  Skin Temperature
                </h3>
                <div className="text-center mb-3 sm:mb-4">
                  <span className="text-3xl sm:text-4xl font-bold text-white">{data?.recovery[0] ? recoverySkinTemp(data.recovery[0]).toFixed(1) : "—"}</span>
                  <span className="text-lg sm:text-xl text-zinc-500 ml-1">°C</span>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  {data?.recovery.slice(0, 5).map((r: Recovery, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[10px] sm:text-xs">
                      <span className="text-zinc-500">{formatDate(r.created_at)}</span>
                      <span className="text-zinc-300">{recoverySkinTemp(r).toFixed(1)}°C</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recovery Breakdown + Streaks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <RecoveryBreakdown recovery={data?.recovery?.[0] ?? null} sleepPerformance={data?.sleep?.[0] ? sleepPerformance(data.sleep[0]) : null} />
              <Streaks cycles={data?.cycles} recovery={data?.recovery} sleep={data?.sleep} />
            </div>

            {/* Signals + Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <SignalsPanel signals={signals} />
              <CalendarHeatmap cycles={data?.cycles || []} />
            </div>
          </div>
        )}

        {/* ═══ SLEEP TAB ═══ */}
        {activeTab === "sleep" && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <MetricCard label="Avg Efficiency" value={data?.sleep?.length ? Math.round(data.sleep.reduce((a: number, s: SleepRecord) => a + sleepEfficiency(s), 0) / data.sleep.length) : 0} unit="%" icon={<Moon className="w-3 h-3 sm:w-4 sm:h-4" />} accentColor="#6366f1" explanation="Percentage of time in bed actually sleeping. Above 85% is healthy." size="sm" />
              <MetricCard label="Avg Consistency" value={data?.sleep?.length ? Math.round(data.sleep.reduce((a: number, s: SleepRecord) => a + sleepConsistency(s), 0) / data.sleep.length) : 0} unit="%" icon={<Target className="w-3 h-3 sm:w-4 sm:h-4" />} accentColor="#8b5cf6" explanation="Sleep/wake time consistency. Regularity matters more than duration." size="sm" />
              <MetricCard label="Avg Time in Bed" value={data?.sleep?.length ? formatDuration(Math.round(data.sleep.reduce((a: number, s: SleepRecord) => a + sleepInBed(s), 0) / data.sleep.length)) : "—"} unit="" icon={<Timer className="w-3 h-3 sm:w-4 sm:h-4" />} accentColor="#06b6d4" explanation="Total time in bed including awakenings. Actual sleep time is lower." size="sm" />
              <MetricCard label="Avg Disturbances" value={data?.sleep?.length ? Math.round(data.sleep.reduce((a: number, s: SleepRecord) => a + sleepDisturbances(s), 0) / data.sleep.length) : 0} unit="" icon={<AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />} accentColor="#f59e0b" explanation="Sleep disruptions per night. Lower is better for deep recovery." size="sm" />
            </div>
            <Hypnogram sleeps={data?.sleep || []} />
            <div className="glass-card p-4 sm:p-6">
              <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                <Moon className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
                Nap Detection
              </h3>
              {data?.sleep?.filter((s: SleepRecord) => s.nap).length > 0 ? (
                <div className="space-y-2">
                  {data.sleep.filter((s: SleepRecord) => s.nap).map((s: SleepRecord, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 sm:p-3 bg-white/[0.02] rounded-xl border border-white/5">
                      <span className="text-[10px] sm:text-xs text-zinc-400">{formatDate(s.start)}</span>
                      <span className="text-[10px] sm:text-xs text-indigo-400 font-medium">{formatDuration(sleepInBed(s))}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-4">No naps detected in this period</p>
              )}
            </div>
          </div>
        )}

        {/* ═══ STRAIN TAB ═══ */}
        {activeTab === "strain" && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <StrainZones workouts={data?.workouts || []} />
              <div className="glass-card p-4 sm:p-6">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                  <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                  Strain Trend
                </h3>
                <div className="h-48 sm:h-64">
                  <TrendChart data={data?.cycles?.slice(0, selectedPeriod).reverse().map((c: Cycle) => ({ date: formatDate(c.start), value: cycleStrain(c) })) || []} dataKey="value" color="#f59e0b" label="Strain" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                <Dumbbell className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                Recent Workouts
              </h3>
              {data?.workouts?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {data?.workouts?.slice(0, 9).map((w: Workout, i: number) => (
                    <WorkoutCard key={i} workout={w} />
                  ))}
                </div>
              ) : (
                <div className="glass-card p-8 text-center">
                  <p className="text-sm text-zinc-500">No workouts recorded in this period</p>
                  <p className="text-xs text-zinc-600 mt-1">Complete a tracked workout to see it here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ TRENDS TAB ═══ */}
        {activeTab === "trends" && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="glass-card p-4 sm:p-6">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4">HRV Trend (ms)</h3>
                <div className="h-48 sm:h-64">
                  <TrendChart data={data?.recovery?.slice(0, selectedPeriod).reverse().map((r: Recovery) => ({ date: formatDate(r.created_at), value: recoveryHRV(r) })) || []} color="#06b6d4" label="HRV" dataKey="value" />
                </div>
              </div>
              <div className="glass-card p-4 sm:p-6">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4">Resting Heart Rate (bpm)</h3>
                <div className="h-48 sm:h-64">
                  <TrendChart data={data?.recovery?.slice(0, selectedPeriod).reverse().map((r: Recovery) => ({ date: formatDate(r.created_at), value: recoveryRHR(r) })) || []} color="#ef4444" label="RHR" dataKey="value" />
                </div>
              </div>
              <div className="glass-card p-4 sm:p-6">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4">SpO2 Trend (%)</h3>
                <div className="h-48 sm:h-64">
                  <TrendChart data={data?.recovery?.slice(0, selectedPeriod).reverse().map((r: Recovery) => ({ date: formatDate(r.created_at), value: recoverySpO2(r) })) || []} color="#10b981" label="SpO2" dataKey="value" />
                </div>
              </div>
              <div className="glass-card p-4 sm:p-6">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4">Respiratory Rate (brpm)</h3>
                <div className="h-48 sm:h-64">
                  <TrendChart data={data?.sleep?.slice(0, selectedPeriod).reverse().map((s: SleepRecord) => ({ date: formatDate(s.start), value: sleepRespiratoryRate(s) })) || []} color="#8b5cf6" label="Resp Rate" dataKey="value" />
                </div>
              </div>
            </div>
            <div className="glass-card p-4 sm:p-6">
              <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4">Recovery Score Trend</h3>
              <div className="h-48 sm:h-64">
                <TrendChart data={data?.recovery?.slice(0, selectedPeriod).reverse().map((r: Recovery) => ({ date: formatDate(r.created_at), value: recoveryScore(r) })) || []} color="#06b6d4" label="Recovery" dataKey="value" />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-xl border-t border-white/5 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {TABS.map((tab) => (
            <a key={tab.id} href={`/?period=${selectedPeriod}&tab=${tab.id}`} className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all active:scale-95 min-w-[60px] ${activeTab === tab.id ? "text-cyan-400" : "text-zinc-500"}`}>
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-cyan-400" : "text-zinc-500"}`} />
              <span className="text-[10px] font-medium">{tab.labelShort}</span>
              {activeTab === tab.id && <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cyan-400 rounded-full" />}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
