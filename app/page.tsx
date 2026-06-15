"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchWhoopCycles, fetchWhoopSleep, fetchWhoopWorkouts, fetchWhoopRecovery,
  generateMockData,
  type WhoopCycle, type WhoopSleep, type WhoopWorkout, type WhoopProfile,
} from "@/lib/whoop";
import {
  RecoveryGauge, MetricCard, TrendChart, StrainZones,
  WorkoutCard, SleepScoreChart, SurveySignals, HrvChart, CalendarHeatmap,
} from "@/components";
import { BarChart3, Moon, Activity, TrendingUp } from "lucide-react";

type Tab = "overview" | "sleep" | "strain" | "trends";
type Period = "7d" | "30d" | "90d";

interface DashboardData {
  profile: WhoopProfile | null;
  cycles: WhoopCycle[];
  sleep: WhoopSleep[];
  workouts: WhoopWorkout[];
  source: "api" | "mock";
  fetchedAt: string;
}

const TAB_META: { id: Tab; label: string; Icon: typeof BarChart3 }[] = [
  { id: "overview", label: "Overview", Icon: BarChart3 },
  { id: "sleep", label: "Sleep",    Icon: Moon },
  { id: "strain", label: "Strain",  Icon: Activity },
  { id: "trends", label: "Trends",  Icon: TrendingUp },
];

const isEmpty = (d: DashboardData) =>
  !d.cycles.length && !d.sleep.length && !d.workouts.length;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const fmtTime = (ms: number) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return m ? `${h}h ${m}m` : `${h}h`;
};

/* ------------------------------------------------------------------ */
/*  Period selector                                                    */
/* ------------------------------------------------------------------ */
function PeriodPicker({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex gap-1 mb-4">
      {(["7d", "30d", "90d"] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-all ${
            period === p
              ? "border-[var(--border-crimson)] bg-[rgba(255,45,85,0.12)] text-white"
              : "border-white/[0.06] bg-white/[0.02] text-white/30"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  MAIN PAGE                                                          */
/* ================================================================== */
export default function WhoopDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [period, setPeriod] = useState<Period>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  /* ---------- data fetch ---------- */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined"
        ? document.cookie.match(/whoop_token=([^;]+)/)?.[1]
        : null;

      if (!token) {
        // dev fallback — mock data when no token
        const mock = generateMockData(30);
        setData({
          profile: mock.profile,
          cycles: mock.cycles,
          sleep: mock.sleep,
          workouts: mock.workouts,
          source: "mock",
          fetchedAt: mock.fetched_at,
        });
        setLoading(false);
        return;
      }

      const [cycles, sleep, workouts] = await Promise.all([
        fetchWhoopCycles(token),
        fetchWhoopSleep(token),
        fetchWhoopWorkouts(token),
      ]);

      setData({
        profile: null,
        cycles,
        sleep,
        workouts,
        source: "api",
        fetchedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load WHOOP data";
      setError(msg);
      // fall back to mock on error
      const mock = generateMockData(30);
      setData({
        profile: mock.profile,
        cycles: mock.cycles,
        sleep: mock.sleep,
        workouts: mock.workouts,
        source: "mock",
        fetchedAt: mock.fetched_at,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ---------- derived ---------- */
  const latestCycle = data?.cycles?.[0] ?? null;
  const latestSleep = data?.sleep?.[0] ?? null;
  const recentWorkouts = (data?.workouts ?? []).slice(0, 6);
  const recoveryScore = latestCycle?.score?.recovery_score != null
    ? Math.round(latestCycle.score.recovery_score * (latestCycle.score.recovery_score <= 1 ? 100 : 1))
    : null;
  const sleepPerf = latestSleep?.score?.sleep_performance_percentage != null
    ? Math.round(latestSleep.score.sleep_performance_percentage * (latestSleep.score.sleep_performance_percentage <= 1 ? 100 : 1))
    : null;
  const todayStrain = latestCycle?.score?.strain ?? null;
  const hrv = latestCycle?.score?.hrv_rmssd ?? null;
  const rhr = latestCycle?.score?.resting_heart_rate ?? null;
  const respRate = latestCycle?.score?.respiratory_rate ?? null;
  const spo2 = latestCycle?.score?.spo2 ?? null;
  const skinTemp = latestCycle?.score?.skin_temp_celsius ?? null;
  const sleepConsistency = latestSleep?.score?.sleep_consistency_percentage != null
    ? Math.round(latestSleep.score.sleep_consistency_percentage * (latestSleep.score.sleep_consistency_percentage <= 1 ? 100 : 1))
    : null;

  /* trend data builders */
  const trendDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const trendCycles = (data?.cycles ?? []).slice(0, trendDays).reverse();
  const recoveryTrend = trendCycles.map((c) => ({
    date: c.start,
    value: c.score?.recovery_score != null
      ? Math.round(c.score.recovery_score * (c.score.recovery_score <= 1 ? 100 : 1))
      : 0,
  }));
  const hrvTrend = trendCycles.map((c) => ({
    date: c.start,
    value: c.score?.hrv_rmssd ?? 0,
  }));
  const rhrTrend = trendCycles.map((c) => ({
    date: c.start,
    value: c.score?.resting_heart_rate ?? 0,
  }));
  const strainTrend = trendCycles.map((c) => ({
    date: c.start,
    value: c.score?.strain ?? 0,
  }));
  const sleepTrend = (data?.sleep ?? []).slice(0, trendDays).reverse().map((s) => ({
    date: s.start,
    value: s.score?.sleep_performance_percentage != null
      ? Math.round(s.score.sleep_performance_percentage * (s.score.sleep_performance_percentage <= 1 ? 100 : 1))
      : 0,
  }));

  /* ---------- header ---------- */
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  /* ---------- render ---------- */
  return (
    <div className="app-shell">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 mt-2">
        <div>
          <h1 className="text-lg font-bold text-white/90">{greeting()}</h1>
          <p className="caption">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          {data?.source === "mock" && (
            <span className="pill pill--warn">Demo</span>
          )}
          {data?.source === "api" && (
            <span className="pill pill--live">Live</span>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="glass error-state mb-4">
          <p className="error-message">{error}</p>
          <p className="caption mt-1">Showing demo data instead.</p>
          <button onClick={load} className="mt-2 px-3 py-1 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[11px] text-white/50">
            Retry
          </button>
        </div>
      )}

      {/* ============ TAB CONTENT ============ */}

      {/* ---------- OVERVIEW ---------- */}
      {tab === "overview" && (
        <div className="space-y-3">
          {/* Recovery — hero */}
          <RecoveryGauge
            score={recoveryScore}
            explanation="How ready your body is for strain today. Green (66-100%) = go hard. Amber (33-65%) = moderate effort. Red (0-32%) = rest day. Based on HRV, RHR, sleep, and respiratory rate."
            loading={loading}
          />

          {/* Sleep + Strain row */}
          <div className="card-grid--2col">
            <MetricCard
              value={sleepPerf != null ? `${sleepPerf}%` : "—"}
              label="Sleep Performance"
              explanation="How much of your sleep need was actually met last night. 100%+ = you got enough. Below 80% = you're building sleep debt."
              loading={loading}
              size="md"
            />
            <MetricCard
              value={todayStrain != null ? todayStrain.toFixed(1) : "—"}
              label="Today's Strain"
              explanation="How hard you've pushed today on a 0-21+ scale. WHOOP recommends 10-14 for most days. Above 18 = very hard, needs recovery."
              loading={loading}
              size="md"
            />
          </div>

          {/* Vitals grid */}
          <div className="card-grid--2col">
            <MetricCard
              value={hrv ?? "—"}
              label="HRV"
              unit="ms"
              explanation="Heart Rate Variability. Higher = more recovered, less stress. Tracked in milliseconds while you sleep. Your personal trend matters more than the absolute number."
              loading={loading}
              size="sm"
            />
            <MetricCard
              value={rhr ?? "—"}
              label="Resting HR"
              unit="bpm"
              explanation="Your heart rate at complete rest. Lower = better cardiovascular fitness. Sudden spikes can mean illness, stress, or overtraining."
              loading={loading}
              size="sm"
            />
            <MetricCard
              value={respRate ?? "—"}
              label="Respiratory Rate"
              unit="br/min"
              explanation="Breaths per minute during sleep. Normal is 12-20. Sudden changes may indicate illness or alcohol impact."
              loading={loading}
              size="sm"
            />
            <MetricCard
              value={spo2 ? `${spo2}%` : "—"}
              label="SpO2"
              explanation="Blood oxygen saturation. Normal is 95-100%. Consistently below 95% may indicate breathing issues during sleep."
              loading={loading}
              size="sm"
            />
          </div>

          {/* Skin temp */}
          <MetricCard
            value={skinTemp ? `${skinTemp}°C` : "—"}
            label="Skin Temperature"
            explanation="Your skin temperature during sleep. WHOOP tracks deviation from YOUR baseline, not absolute. A spike can indicate illness onset or hormonal changes."
            loading={loading}
            size="md"
          />

          {/* AI Insight */}
          <div className="ai-readout">
            <p className="text-[11px] text-white/70 leading-relaxed">
              {loading ? "Analyzing your data..." : (
                recoveryScore == null ? "Connect your WHOOP to see personalized insights." :
                recoveryScore >= 66 ? "🟢 You're fully recovered. Today is a great day for a hard session. Your body is ready to perform." :
                recoveryScore >= 33 ? "🟡 Moderate recovery. A solid workout is fine, but stay in zones 2-4. Save the max efforts for tomorrow." :
                "🔴 Low recovery. Your body is still repairing. Light movement only — walk, stretch, or rest. Pushing hard today increases injury risk."
              )}
            </p>
          </div>
        </div>
      )}

      {/* ---------- SLEEP ---------- */}
      {tab === "sleep" && (
        <div className="space-y-3">
          <SleepScoreChart
            sleep={latestSleep}
            explanation="Your sleep score breaks down how much REM, light, and deep sleep you got. REM = memory and mood. Deep = physical repair. Light = transition. All three matter."
            loading={loading}
          />

          <div className="card-grid--2col">
            <MetricCard
              value={sleepConsistency != null ? `${sleepConsistency}%` : "—"}
              label="Sleep Consistency"
              explanation="How consistent your sleep/wake times have been over the past 7 days. Higher = better circadian rhythm. Irregular sleep hurts recovery even if total hours are fine."
              loading={loading}
              size="md"
            />
            <MetricCard
              value={latestSleep?.score?.sleep_efficiency_percentage != null
                ? `${Math.round(latestSleep.score.sleep_efficiency_percentage * (latestSleep.score.sleep_efficiency_percentage <= 1 ? 100 : 1))}%`
                : "—"}
              label="Sleep Efficiency"
              explanation="Percentage of time in bed that you were actually asleep. 85%+ is good. Below 80% means lots of tossing and turning."
              loading={loading}
              size="md"
            />
          </div>

          {/* Sleep need breakdown */}
          {latestSleep?.score?.sleep_needed && (
            <div className="glass p-4">
              <p className="section-title">Sleep Need Breakdown</p>
              <p className="explanation">How WHOOP calculated how much sleep you needed last night. Baseline is your personal average. Strain and sleep debt add to it.</p>
              <div className="card-grid--2col mt-3">
                <MetricCard
                  value={fmtTime(latestSleep.score.sleep_needed.baseline_milli)}
                  label="Baseline Need"
                  explanation="Your average sleep need based on your personal history."
                  loading={loading}
                  size="sm"
                />
                <MetricCard
                  value={fmtTime(latestSleep.score.sleep_needed.need_from_sleep_debt_milli)}
                  label="Sleep Debt"
                  explanation="Extra sleep needed to pay back recent short nights."
                  loading={loading}
                  size="sm"
                />
                <MetricCard
                  value={fmtTime(latestSleep.score.sleep_needed.need_from_recent_strain_milli)}
                  label="Strain Recovery"
                  explanation="Extra sleep needed to recover from recent hard efforts."
                  loading={loading}
                  size="sm"
                />
                <MetricCard
                  value={fmtTime(
                    latestSleep.score.sleep_needed.baseline_milli +
                    latestSleep.score.sleep_needed.need_from_sleep_debt_milli +
                    latestSleep.score.sleep_needed.need_from_recent_strain_milli +
                    latestSleep.score.sleep_needed.need_from_recent_nap_milli
                  )}
                  label="Total Need"
                  explanation="The total amount of sleep your body needed last night."
                  loading={loading}
                  size="sm"
                />
              </div>
            </div>
          )}

          {/* Sleep stages detail */}
          {latestSleep?.score?.stage_summary && (
            <div className="glass p-4">
              <p className="section-title">Sleep Stages</p>
              <p className="explanation">What each stage does for your body.</p>
              <div className="space-y-3 mt-3">
                {[
                  { name: "REM", ms: latestSleep.score.stage_summary.total_rem_sleep_time_milli, color: "#a78bfa", desc: "Rapid Eye Movement. Where dreaming happens. Critical for memory consolidation, emotional processing, and creativity." },
                  { name: "Light", ms: latestSleep.score.stage_summary.total_light_sleep_time_milli, color: "#06b6d4", desc: "Transition stage. Makes up most of your sleep. Helps with memory and prepares you for deep sleep." },
                  { name: "Deep (SWS)", ms: latestSleep.score.stage_summary.total_slow_wave_sleep_time_milli, color: "#6366f1", desc: "Slow Wave Sleep. Physical repair happens here. Growth hormone release, tissue repair, immune system strengthening." },
                  { name: "Awake", ms: latestSleep.score.stage_summary.total_awake_time_milli, color: "#ef4444", desc: "Time spent awake during the night. Brief awakenings are normal. Too much = fragmented sleep." },
                ].map((s) => (
                  <div key={s.name} className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-sm mt-1 shrink-0" style={{ background: s.color }} />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-xs font-semibold text-white/75">{s.name}</span>
                        <span className="text-xs text-white/50">{fmtTime(s.ms)}</span>
                      </div>
                      <p className="explanation mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- STRAIN ---------- */}
      {tab === "strain" && (
        <div className="space-y-3">
          {/* Today's strain */}
          <div className="card-grid--2col">
            <MetricCard
              value={todayStrain != null ? todayStrain.toFixed(1) : "—"}
              label="Today's Strain"
              explanation="How hard you've pushed today on a 0-21+ scale. 0-8 = light. 8-14 = moderate. 14-18 = hard. 18+ = maximum effort."
              loading={loading}
              size="md"
            />
            <MetricCard
              value={latestCycle?.score?.heart_rate_avg ?? "—"}
              label="Avg Heart Rate"
              unit="bpm"
              explanation="Your average heart rate today. Resting is 50-70 for most athletes. During activity, higher zones build different fitness adaptations."
              loading={loading}
              size="md"
            />
          </div>

          {/* Strain Coach */}
          <div className="ai-readout">
            <p className="text-[11px] text-white/70 leading-relaxed">
              {loading ? "Calculating strain recommendation..." : (
                recoveryScore == null ? "Connect your WHOOP to get a personalized strain target." :
                recoveryScore >= 66 ? "🟢 You're recovered. Target 14-18 strain today. Push into zones 3-4. Your body can handle it." :
                recoveryScore >= 33 ? "🟡 Moderate recovery. Target 10-14 strain. Stay in zones 2-3. Save the intervals for tomorrow." :
                "🔴 Low recovery. Target 0-8 strain. Light movement only. A walk or easy yoga. Let your body repair."
              )}
            </p>
          </div>

          {/* Zones */}
          <StrainZones
            workouts={recentWorkouts}
            explanation="Heart rate zones show where your training time is spent. Zone 1-2 = easy/recovery. Zone 3 = tempo. Zone 4-5 = high intensity. A balanced mix builds complete fitness."
            loading={loading}
          />

          {/* Recent workouts */}
          <div>
            <p className="section-title">Recent Workouts</p>
            <p className="explanation">High-intensity sessions from the past week. Strain measures cardiovascular load from 0-21+.</p>
            <div className="space-y-3 mt-3">
              {loading ? (
                <div className="card-grid--2col">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton skeleton--card" style={{ height: 160 }} />
                  ))}
                </div>
              ) : recentWorkouts.length === 0 ? (
                <div className="glass p-6 text-center">
                  <p className="text-sm text-white/50">No recent workouts. Start a session to see your data here.</p>
                </div>
              ) : (
                <div className="card-grid--2col">
                  {recentWorkouts.map((w) => (
                    <WorkoutCard
                      key={w.id}
                      workout={w}
                      explanation={`${getSportName(w.sport_id)} • ${fmtDate(w.start)}`}
                      loading={false}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------- TRENDS ---------- */}
      {tab === "trends" && (
        <div className="space-y-3">
          <PeriodPicker period={period} onChange={setPeriod} />

          <TrendChart
            data={recoveryTrend as unknown as Array<Record<string, unknown>>}
            dataKey="value"
            period={period}
            label="Recovery"
            explanation="Your recovery score over time. Look for patterns — does it drop after hard training blocks? Does it improve with better sleep?"
            color="#34d399"
            loading={loading}
          />

          <TrendChart
            data={hrvTrend as unknown as Array<Record<string, unknown>>}
            dataKey="value"
            period={period}
            label="HRV"
            unit="ms"
            explanation="Heart Rate Variability trend. Generally upward = improving fitness and recovery. Dips can mean stress, illness, or overtraining."
            color="#00d4ff"
            loading={loading}
          />

          <TrendChart
            data={rhrTrend as unknown as Array<Record<string, unknown>>}
            dataKey="value"
            period={period}
            label="Resting Heart Rate"
            unit="bpm"
            explanation="Resting heart rate trend. Generally downward = improving fitness. Sudden upticks can signal illness or accumulated fatigue."
            color="#ff2d55"
            loading={loading}
          />

          <TrendChart
            data={sleepTrend as unknown as Array<Record<string, unknown>>}
            dataKey="value"
            period={period}
            label="Sleep Performance"
            explanation="How well you're meeting your sleep need over time. Consistently below 80% means you're chronically under-sleeping."
            color="#a78bfa"
            loading={loading}
          />

          {/* Weekly summary */}
          <div className="glass p-4">
            <p className="section-title">Weekly Summary</p>
            <p className="explanation">Your best and worst days this week at a glance.</p>
            {loading ? (
              <div className="skeleton skeleton--card mt-3" style={{ height: 80 }} />
            ) : (
              <div className="card-grid--2col mt-3">
                <div className="text-center p-3 rounded-lg border border-white/[0.04] bg-white/[0.015]">
                  <p className="text-[8px] uppercase tracking-wider text-white/25">Best Recovery</p>
                  <p className="text-lg font-bold text-[var(--success)]">
                    {recoveryTrend.length ? `${Math.max(...recoveryTrend.map(d => d.value))}%` : "—"}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg border border-white/[0.04] bg-white/[0.015]">
                  <p className="text-[8px] uppercase tracking-wider text-white/25">Lowest Recovery</p>
                  <p className="text-lg font-bold text-[var(--danger)]">
                    {recoveryTrend.length ? `${Math.min(...recoveryTrend.map(d => d.value))}%` : "—"}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg border border-white/[0.04] bg-white/[0.015]">
                  <p className="text-[8px] uppercase tracking-wider text-white/25">Avg Strain</p>
                  <p className="text-lg font-bold text-white/70">
                    {strainTrend.length ? strainTrend.reduce((a, b) => a + b.value, 0) / strainTrend.length : "—"}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg border border-white/[0.04] bg-white/[0.015]">
                  <p className="text-[8px] uppercase tracking-wider text-white/25">Avg Sleep</p>
                  <p className="text-lg font-bold text-white/70">
                    {sleepTrend.length ? `${Math.round(sleepTrend.reduce((a, b) => a + b.value, 0) / sleepTrend.length)}%` : "—"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ BOTTOM TAB BAR ============ */}
      <div className="tab-bar">
        <div className="tab-bar__inner">
          {TAB_META.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`tab-item ${tab === id ? "active" : ""}`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function getSportName(id: number) {
  const names: Record<number, string> = {
    1:"Running",2:"Cycling",3:"Swimming",4:"Weightlifting",5:"Yoga",
    6:"Basketball",7:"Soccer",8:"Tennis",9:"Rowing",10:"Hiking",
    11:"Boxing",12:"CrossFit",13:"HIIT",14:"Pilates",15:"Dance",
    16:"Surfing",17:"Strength Training",18:"Stretching",19:"Snowboarding",20:"Rock Climbing",
    21:"Skiing",22:"Golf",23:"Skateboarding",24:"Martial Arts",25:"Football",
  };
  return names[id] ?? `Sport ${id}`;
}
