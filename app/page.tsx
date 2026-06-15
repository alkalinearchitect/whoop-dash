import { generateMockData } from "@/lib/whoop";
import { RecoveryGauge } from "@/components/RecoveryGauge";
import { MetricCard } from "@/components/MetricCard";
import { WorkoutCard } from "@/components/WorkoutCard";
import { StrainZones } from "@/components/StrainZones";
import { SleepScoreChart } from "@/components/SleepScoreChart";
import { TrendChart } from "@/components/TrendChart";
import DashboardTabs from "./DashboardTabs";

function fmtTime(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return m ? `${h}h ${m}m` : `${h}h`;
}

function getSportName(id: number) {
  const n: Record<number, string> = { 1:"Running",2:"Cycling",3:"Swimming",4:"Weightlifting",5:"Yoga",6:"Basketball",7:"Soccer",8:"Tennis",9:"Rowing",10:"Hiking",11:"Boxing",12:"CrossFit",13:"HIIT",14:"Pilates",15:"Dance",16:"Surfing",17:"Strength Training",18:"Stretching",19:"Snowboarding",20:"Rock Climbing",21:"Skiing",22:"Golf",23:"Skateboarding",24:"Martial Arts",25:"Football" };
  return n[id] ?? `Sport ${id}`;
}

export default function WhoopDashboard() {
  const data = generateMockData(30);
  const latestCycle = data.cycles[0];
  const latestSleep = data.sleep[0];
  const recentWorkouts = data.workouts.slice(0, 6);

  const recoveryScore = latestCycle?.score?.recovery_score != null
    ? Math.round(latestCycle.score.recovery_score * (latestCycle.score.recovery_score <= 1 ? 100 : 1)) : null;
  const sleepPerf = latestSleep?.score?.sleep_performance_percentage != null
    ? Math.round(latestSleep.score.sleep_performance_percentage * (latestSleep.score.sleep_performance_percentage <= 1 ? 100 : 1)) : null;
  const todayStrain = latestCycle?.score?.strain ?? null;
  const hrv = latestCycle?.score?.hrv_rmssd ?? null;
  const rhr = latestCycle?.score?.resting_heart_rate ?? null;
  const respRate = latestCycle?.score?.respiratory_rate ?? null;
  const spo2 = latestCycle?.score?.spo2 ?? null;
  const skinTemp = latestCycle?.score?.skin_temp_celsius ?? null;
  const sleepConsistency = latestSleep?.score?.sleep_consistency_percentage != null
    ? Math.round(latestSleep.score.sleep_consistency_percentage * (latestSleep.score.sleep_consistency_percentage <= 1 ? 100 : 1)) : null;

  const trendCycles = data.cycles.slice(0, 30).reverse();
  const recoveryTrend = trendCycles.map((c) => ({ date: c.start, value: c.score?.recovery_score != null ? Math.round(c.score.recovery_score * (c.score.recovery_score <= 1 ? 100 : 1)) : 0 }));
  const hrvTrend = trendCycles.map((c) => ({ date: c.start, value: c.score?.hrv_rmssd ?? 0 }));
  const rhrTrend = trendCycles.map((c) => ({ date: c.start, value: c.score?.resting_heart_rate ?? 0 }));
  const strainTrend = trendCycles.map((c) => ({ date: c.start, value: c.score?.strain ?? 0 }));
  const sleepTrend = data.sleep.slice(0, 30).reverse().map((s) => ({ date: s.start, value: s.score?.sleep_performance_percentage != null ? Math.round(s.score.sleep_performance_percentage * (s.score.sleep_performance_percentage <= 1 ? 100 : 1)) : 0 }));

  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

  const aiInsight = recoveryScore == null ? "Connect your WHOOP to see personalized insights." :
    recoveryScore >= 66 ? "🟢 You're fully recovered. Today is a great day for a hard session. Your body is ready to perform." :
    recoveryScore >= 33 ? "🟡 Moderate recovery. A solid workout is fine, but stay in zones 2-4. Save the max efforts for tomorrow." :
    "🔴 Low recovery. Your body is still repairing. Light movement only — walk, stretch, or rest. Pushing hard today increases injury risk.";

  const strainInsight = recoveryScore == null ? "Connect your WHOOP for a strain target." :
    recoveryScore >= 66 ? "🟢 You're recovered. Target 14-18 strain today. Push into zones 3-4. Your body can handle it." :
    recoveryScore >= 33 ? "🟡 Moderate recovery. Target 10-14 strain. Stay in zones 2-3. Save the intervals for tomorrow." :
    "🔴 Low recovery. Target 0-8 strain. Light movement only. A walk or easy yoga. Let your body repair.";

  return (
    <div className="app-shell">
      <div className="flex items-center justify-between mb-5 mt-2">
        <div>
          <h1 className="text-lg font-bold text-white/90">{greeting}</h1>
          <p className="caption">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="pill pill--warn">Demo</span>
        </div>
      </div>

      <DashboardTabs
        overviewContent={
          <div className="space-y-3">
            <RecoveryGauge score={recoveryScore} explanation="How ready your body is for strain today. Green (66-100%) = go hard. Amber (33-65%) = moderate effort. Red (0-32%) = rest day." />
            <div className="card-grid--2col">
              <MetricCard value={sleepPerf != null ? `${sleepPerf}%` : "—"} label="Sleep Performance" explanation="How much of your sleep need was actually met last night." size="md" />
              <MetricCard value={todayStrain != null ? todayStrain.toFixed(1) : "—"} label="Today's Strain" explanation="How hard you've pushed today on a 0-21+ scale." size="md" />
            </div>
            <div className="card-grid--2col">
              <MetricCard value={hrv ?? "—"} label="HRV" unit="ms" explanation="Heart Rate Variability. Higher = more recovered, less stress." size="sm" />
              <MetricCard value={rhr ?? "—"} label="Resting HR" unit="bpm" explanation="Your heart rate at complete rest. Lower = better cardiovascular fitness." size="sm" />
              <MetricCard value={respRate ?? "—"} label="Respiratory Rate" unit="br/min" explanation="Breaths per minute during sleep. Normal is 12-20." size="sm" />
              <MetricCard value={spo2 ? `${spo2}%` : "—"} label="SpO2" explanation="Blood oxygen saturation. Normal is 95-100%." size="sm" />
            </div>
            <MetricCard value={skinTemp ? `${skinTemp}°C` : "—"} label="Skin Temperature" explanation="Your skin temperature during sleep. WHOOP tracks deviation from YOUR baseline, not absolute." size="md" />
            <div className="ai-readout"><p className="text-[11px] text-white/70 leading-relaxed">{aiInsight}</p></div>
          </div>
        }
        sleepContent={
          <div className="space-y-3">
            <SleepScoreChart sleep={latestSleep} explanation="Your sleep score breaks down REM, light, and deep sleep." />
            <div className="card-grid--2col">
              <MetricCard value={sleepConsistency != null ? `${sleepConsistency}%` : "—"} label="Sleep Consistency" explanation="How consistent your sleep/wake times have been over the past 7 days." size="md" />
              <MetricCard value={latestSleep?.score?.sleep_efficiency_percentage != null ? `${Math.round(latestSleep.score.sleep_efficiency_percentage * (latestSleep.score.sleep_efficiency_percentage <= 1 ? 100 : 1))}%` : "—"} label="Sleep Efficiency" explanation="Percentage of time in bed that you were actually asleep. 85%+ is good." size="md" />
            </div>
            {latestSleep?.score?.sleep_needed && (
              <div className="glass p-4">
                <p className="section-title">Sleep Need Breakdown</p>
                <div className="card-grid--2col mt-3">
                  <MetricCard value={fmtTime(latestSleep.score.sleep_needed.baseline_milli)} label="Baseline Need" explanation="Your average sleep need based on personal history." size="sm" />
                  <MetricCard value={fmtTime(latestSleep.score.sleep_needed.need_from_sleep_debt_milli)} label="Sleep Debt" explanation="Extra sleep needed to pay back recent short nights." size="sm" />
                  <MetricCard value={fmtTime(latestSleep.score.sleep_needed.need_from_recent_strain_milli)} label="Strain Recovery" explanation="Extra sleep needed to recover from recent hard efforts." size="sm" />
                  <MetricCard value={fmtTime(latestSleep.score.sleep_needed.baseline_milli + latestSleep.score.sleep_needed.need_from_sleep_debt_milli + latestSleep.score.sleep_needed.need_from_recent_strain_milli + latestSleep.score.sleep_needed.need_from_recent_nap_milli)} label="Total Need" explanation="The total amount of sleep your body needed last night." size="sm" />
                </div>
              </div>
            )}
            {latestSleep?.score?.stage_summary && (
              <div className="glass p-4">
                <p className="section-title">Sleep Stages</p>
                <div className="space-y-3 mt-3">
                  {[
                    { name: "REM", ms: latestSleep.score.stage_summary.total_rem_sleep_time_milli, color: "#a78bfa", desc: "Memory consolidation, emotional processing, creativity." },
                    { name: "Light", ms: latestSleep.score.stage_summary.total_light_sleep_time_milli, color: "#06b6d4", desc: "Transition stage. Helps with memory." },
                    { name: "Deep (SWS)", ms: latestSleep.score.stage_summary.total_slow_wave_sleep_time_milli, color: "#6366f1", desc: "Physical repair, growth hormone, immune strengthening." },
                    { name: "Awake", ms: latestSleep.score.stage_summary.total_awake_time_milli, color: "#ef4444", desc: "Time awake during the night." },
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
        }
        strainContent={
          <div className="space-y-3">
            <div className="card-grid--2col">
              <MetricCard value={todayStrain != null ? todayStrain.toFixed(1) : "—"} label="Today's Strain" explanation="How hard you've pushed today on a 0-21+ scale." size="md" />
              <MetricCard value={latestCycle?.score?.heart_rate_avg ?? "—"} label="Avg Heart Rate" unit="bpm" explanation="Your average heart rate today." size="md" />
            </div>
            <div className="ai-readout"><p className="text-[11px] text-white/70 leading-relaxed">{strainInsight}</p></div>
            <StrainZones workouts={recentWorkouts} explanation="Heart rate zones show where your training time is spent." />
            <div>
              <p className="section-title">Recent Workouts</p>
              <div className="space-y-3 mt-3">
                {recentWorkouts.length === 0 ? (
                  <div className="glass p-6 text-center"><p className="text-sm text-white/50">No recent workouts.</p></div>
                ) : (
                  <div className="card-grid--2col">
                    {recentWorkouts.map((w) => (
                      <WorkoutCard key={w.id} workout={w} explanation={`${getSportName(w.sport_id)} • ${new Date(w.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        }
        trendsContent={
          <div className="space-y-3">
            <TrendChart data={recoveryTrend as unknown as Array<Record<string, unknown>>} dataKey="value" period="30d" label="Recovery" explanation="Your recovery score over time. Look for patterns." color="#34d399" />
            <TrendChart data={hrvTrend as unknown as Array<Record<string, unknown>>} dataKey="value" period="30d" label="HRV" unit="ms" explanation="Heart Rate Variability trend. Generally upward = improving fitness." color="#00d4ff" />
            <TrendChart data={rhrTrend as unknown as Array<Record<string, unknown>>} dataKey="value" period="30d" label="Resting HR" unit="bpm" explanation="Resting heart rate trend. Generally downward = improving fitness." color="#ff2d55" />
            <TrendChart data={sleepTrend as unknown as Array<Record<string, unknown>>} dataKey="value" period="30d" label="Sleep Performance" explanation="How well you're meeting your sleep need over time." color="#a78bfa" />
            <div className="glass p-4">
              <p className="section-title">Weekly Summary</p>
              <div className="card-grid--2col mt-3">
                <div className="text-center p-3 rounded-lg border border-white/[0.04] bg-white/[0.015]">
                  <p className="text-[8px] uppercase tracking-wider text-white/25">Best Recovery</p>
                  <p className="text-lg font-bold text-[var(--success)]">{recoveryTrend.length ? `${Math.max(...recoveryTrend.map(d => d.value))}%` : "—"}</p>
                </div>
                <div className="text-center p-3 rounded-lg border border-white/[0.04] bg-white/[0.015]">
                  <p className="text-[8px] uppercase tracking-wider text-white/25">Lowest Recovery</p>
                  <p className="text-lg font-bold text-[var(--danger)]">{recoveryTrend.length ? `${Math.min(...recoveryTrend.map(d => d.value))}%` : "—"}</p>
                </div>
                <div className="text-center p-3 rounded-lg border border-white/[0.04] bg-white/[0.015]">
                  <p className="text-[8px] uppercase tracking-wider text-white/25">Avg Strain</p>
                  <p className="text-lg font-bold text-white/70">{strainTrend.length ? (strainTrend.reduce((a, b) => a + b.value, 0) / strainTrend.length).toFixed(1) : "—"}</p>
                </div>
                <div className="text-center p-3 rounded-lg border border-white/[0.04] bg-white/[0.015]">
                  <p className="text-[8px] uppercase tracking-wider text-white/25">Avg Sleep</p>
                  <p className="text-lg font-bold text-white/70">{sleepTrend.length ? `${Math.round(sleepTrend.reduce((a, b) => a + b.value, 0) / sleepTrend.length)}%` : "—"}</p>
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
