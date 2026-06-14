import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  Activity, Moon, Heart, Flame, TrendingUp, TrendingDown,
  Minus, Zap, Droplets, Thermometer, Wind, Award, Calendar,
  Share2, Download, ChevronRight, AlertTriangle, CheckCircle2,
  Info, Dumbbell, Timer, Target, BarChart3, Wifi, WifiOff, Menu, X,
  RefreshCw, Clock
} from 'lucide-react';
import { RecoveryGauge } from '@/components/RecoveryGauge';
import { MetricCard } from '@/components/MetricCard';
import { TrendChart } from '@/components/TrendChart';
import { Hypnogram } from '@/components/Hypnogram';
import { StrainZones } from '@/components/StrainZones';
import { CalendarHeatmap } from '@/components/CalendarHeatmap';
import { WorkoutCard } from '@/components/WorkoutCard';
import { SignalsPanel } from '@/components/SignalsPanel';
import type { Cycle, Recovery, SleepRecord, Workout, User } from '@/lib/whoop';

// ── Helpers ──────────────────────────────────────────────────────────────────

function pct(val: number | null | undefined): number | null {
  if (val == null) return null;
  return val <= 1 ? Math.round(val * 100) : Math.round(val);
}

function safeNum(val: number | null | undefined, decimals = 0): string {
  if (val == null) return '—';
  return decimals > 0 ? val.toFixed(decimals) : String(Math.round(val));
}

function cycleStrain(c: Cycle | any): number {
  if (c?.score?.strain != null) return c.score.strain;
  if (c?.strain != null) return c.strain;
  return 0;
}

function recoveryScore(r: Recovery | any): number {
  if (r?.score?.recovery_score != null) return pct(r.score.recovery_score) ?? 0;
  if (r?.recovery_score != null) return pct(r.recovery_score) ?? 0;
  return 0;
}

function recoveryHRV(r: Recovery | any): number {
  if (r?.score?.hrv_rmssd != null) return Math.round(r.score.hrv_rmssd);
  if (r?.hrv_rmssd != null) return Math.round(r.hrv_rmssd);
  return 0;
}

function recoveryRHR(r: Recovery | any): number {
  if (r?.score?.resting_heart_rate != null) return Math.round(r.score.resting_heart_rate);
  if (r?.resting_heart_rate != null) return Math.round(r.resting_heart_rate);
  return 0;
}

function recoverySpO2(r: Recovery | any): number {
  if (r?.score?.spo2 != null) return r.score.spo2;
  if (r?.spo2 != null) return r.spo2;
  return 0;
}

function recoverySkinTemp(r: Recovery | any): number {
  if (r?.score?.skin_temp_celsius != null) return r.score.skin_temp_celsius;
  if (r?.skin_temp_celsius != null) return r.skin_temp_celsius;
  return 0;
}

function sleepEfficiency(s: SleepRecord | any): number {
  if (s?.score?.sleep_efficiency_percentage != null) return pct(s.score.sleep_efficiency_percentage) ?? 0;
  if (s?.sleep_efficiency_percentage != null) return pct(s.sleep_efficiency_percentage) ?? 0;
  return 0;
}

function sleepConsistency(s: SleepRecord | any): number {
  if (s?.score?.sleep_consistency_percentage != null) return pct(s.score.sleep_consistency_percentage) ?? 0;
  if (s?.sleep_consistency_percentage != null) return pct(s.sleep_consistency_percentage) ?? 0;
  return 0;
}

function sleepPerformance(s: SleepRecord | any): number {
  if (s?.score?.sleep_performance_percentage != null) return pct(s.score.sleep_performance_percentage) ?? 0;
  if (s?.sleep_performance_percentage != null) return pct(s.sleep_performance_percentage) ?? 0;
  return 0;
}

function sleepRespiratoryRate(s: SleepRecord | any): number {
  if (s?.score?.respiratory_rate != null) return s.score.respiratory_rate;
  if (s?.respiratory_rate != null) return s.respiratory_rate;
  return 0;
}

function sleepInBed(s: SleepRecord | any): number {
  if (s?.score?.stage_summary?.total_in_bed_time_milli != null) return s.score.stage_summary.total_in_bed_time_milli;
  if (s?.total_in_bed_time_milli != null) return s.total_in_bed_time_milli;
  return 0;
}

function sleepNeeded(s: SleepRecord | any): number {
  if (s?.score?.sleep_needed?.baseline_milli != null) return s.score.sleep_needed.baseline_milli;
  if (s?.sleep_needed?.baseline_milli != null) return s.sleep_needed.baseline_milli;
  return 0;
}

function sleepDisturbances(s: SleepRecord | any): number {
  if (s?.score?.stage_summary?.disturbance_count != null) return s.score.stage_summary.disturbance_count;
  if (s?.disturbances != null) return s.disturbances;
  return 0;
}

function formatDuration(ms: number): string {
  if (!ms) return '—';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return '—'; }
}

// ── Data Fetching (Server-Side) ──────────────────────────────────────────────

async function fetchWhoopData(limit: number = 30) {
  const cookieStore = await cookies();
  const token = cookieStore.get('whoop_token')?.value;
  const clientId = process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;

  // Try real API if token exists
  if (token) {
    try {
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const [userRes, cyclesRes, recoveryRes, sleepRes, workoutsRes] = await Promise.all([
        fetch('https://api-7.whoop.com/developer/v1/user/profile/basic', { headers }),
        fetch(`https://api-7.whoop.com/developer/v1/activity/cycle?limit=${limit}&end=${new Date().toISOString()}`, { headers }),
        fetch(`https://api-7.whoop.com/developer/v1/recovery?limit=${limit}&end=${new Date().toISOString()}`, { headers }),
        fetch(`https://api-7.whoop.com/developer/v1/activity/sleep?limit=${limit}&end=${new Date().toISOString()}`, { headers }),
        fetch(`https://api-7.whoop.com/developer/v1/activity/workout?limit=${limit}&end=${new Date().toISOString()}`, { headers }),
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
          source: 'whoop-api',
          fetched_at: new Date().toISOString(),
        };
      }
    } catch (e) {
      console.error('WHOOP API error:', e);
    }
  }

  // Fallback: generate mock data
  return generateMockData(limit);
}

function generateMockData(limit: number) {
  const now = new Date();
  const cycles: any[] = [];
  const recovery: any[] = [];
  const sleep: any[] = [];
  const workouts: any[] = [];

  for (let i = 0; i < limit; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const recoveryScore = Math.round((0.4 + Math.random() * 0.55) * 100) / 100;
    const strain = Math.round((5 + Math.random() * 16) * 10) / 10;
    const hrv = Math.round(35 + Math.random() * 45);
    const rhr = Math.round(42 + Math.random() * 18);
    const spo2 = Math.round((94 + Math.random() * 5) * 10) / 10;
    const skinTemp = Math.round((32 + Math.random() * 3.5) * 10) / 10;
    const respRate = Math.round((12 + Math.random() * 6) * 100) / 100;
    const sleepEff = Math.round((70 + Math.random() * 28) * 100) / 100;
    const sleepCons = Math.round((60 + Math.random() * 38) * 100) / 100;
    const sleepPerf = Math.round((50 + Math.random() * 48) * 100) / 100;
    const inBed = Math.round((6.5 + Math.random() * 2.5) * 3600000);
    const needed = Math.round((7 + Math.random() * 1.5) * 3600000);
    const disturbances = Math.floor(Math.random() * 10);
    const deepSleep = Math.round(inBed * (0.12 + Math.random() * 0.08));
    const remSleep = Math.round(inBed * (0.18 + Math.random() * 0.1));
    const lightSleep = Math.round(inBed * (0.45 + Math.random() * 0.1));
    const awake = inBed - deepSleep - remSleep - lightSleep;

    cycles.push({
      id: 1000 + i, user_id: 1, start: dateStr + 'T00:00:00.000Z', end: dateStr + 'T23:59:59.000Z',
      timezone_offset: '+00:00', score_state: 'SCORED',
      score: { recovery_score: recoveryScore, sleep_performance_percentage: sleepPerf, sleep_consistency_percentage: sleepCons, sleep_efficiency_percentage: sleepEff, strain, kilojoule: Math.round(strain * 200), heart_rate_avg: Math.round(65 + Math.random() * 20), heart_rate_max: Math.round(150 + Math.random() * 30), heart_rate_min: rhr, respiratory_rate: respRate, spo2, skin_temp_celsius: skinTemp, hrv_rmssd: hrv, hrv_sdnn: Math.round(hrv * 1.2), resting_heart_rate: rhr },
    });

    recovery.push({
      cycle_id: 1000 + i, sleep_id: 2000 + i, user_id: 1,
      created_at: dateStr + 'T08:00:00.000Z', updated_at: dateStr + 'T08:00:00.000Z',
      score_state: 'SCORED',
      score: { user_calibrating: false, recovery_score: recoveryScore, resting_heart_rate: rhr, hrv_rmssd: hrv, spo2, skin_temp_celsius: skinTemp },
    });

    sleep.push({
      id: 2000 + i, user_id: 1, created_at: dateStr + 'T08:00:00.000Z', updated_at: dateStr + 'T08:00:00.000Z',
      start: dateStr + 'T22:00:00.000Z', end: new Date(date.getTime() + 8 * 3600000).toISOString(),
      timezone_offset: '+00:00', nap: i % 7 === 0,
      score_state: 'SCORED',
      score: {
        stage_summary: { total_in_bed_time_milli: inBed, total_awake_time_milli: Math.max(0, awake), total_no_data_time_milli: 0, total_light_sleep_time_milli: lightSleep, total_slow_wave_sleep_time_milli: deepSleep, total_rem_sleep_time_milli: remSleep, sleep_cycle_count: 3 + Math.floor(Math.random() * 3), disturbance_count: disturbances },
        sleep_needed: { baseline_milli: 28800000, need_from_sleep_debt_milli: Math.round(Math.random() * 3600000), need_from_recent_strain_milli: Math.round(strain * 40000), need_from_recent_nap_milli: i % 7 === 0 ? 1800000 : 0 },
        respiratory_rate: respRate, sleep_performance_percentage: sleepPerf, sleep_consistency_percentage: sleepCons, sleep_efficiency_percentage: sleepEff,
      },
    });
  }

  // Generate workouts (every 2-3 days)
  const sportIds = [1, 5, 10, 43, 54, 71, 165, 185, 213, 357, 493];
  for (let i = 0; i < limit; i += 2 + Math.floor(Math.random() * 2)) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const strain = Math.round((5 + Math.random() * 14) * 10) / 10;
    const avgHR = Math.round(110 + Math.random() * 40);
    const maxHR = avgHR + Math.round(20 + Math.random() * 20);
    const duration = 20 + Math.floor(Math.random() * 50);
    const zones = {
      zone_zero_milli: duration * 60000 * 0.1,
      zone_one_milli: duration * 60000 * 0.15,
      zone_two_milli: duration * 60000 * 0.25,
      zone_three_milli: duration * 60000 * 0.25,
      zone_four_milli: duration * 60000 * 0.15,
      zone_five_milli: duration * 60000 * 0.1,
    };

    workouts.push({
      id: 3000 + i, user_id: 1, created_at: date.toISOString(), updated_at: date.toISOString(),
      start: date.toISOString(), end: new Date(date.getTime() + duration * 60000).toISOString(),
      timezone_offset: '+00:00', sport_id: sportIds[Math.floor(Math.random() * sportIds.length)],
      score_state: 'SCORED',
      score: { strain, kilojoule: Math.round(strain * 180), average_heart_rate: avgHR, max_heart_rate: maxHR, percent_recorded: 100, distance_meter: Math.round(strain * 500), altitude_gain_meter: Math.round(Math.random() * 150), altitude_change_meter: Math.round(Math.random() * 300), zone_duration: zones },
    });
  }

  return {
    user: { user_id: 1, email: 'athlete@whoop.com', first_name: 'Demo', last_name: 'Athlete' },
    cycles, recovery, sleep, workouts,
    source: 'mock',
    fetched_at: new Date().toISOString(),
  };
}

// ── Streak Computation ───────────────────────────────────────────────────────

function computeStreak(items: any[], getter: (item: any) => number, threshold: number, above = true): number {
  let streak = 0;
  for (const item of items) {
    const val = getter(item);
    if (val === 0) break;
    if (above ? val >= threshold : val <= threshold) streak++;
    else break;
  }
  return streak;
}

// ── Signals ──────────────────────────────────────────────────────────────────

function generateSignals(data: any) {
  const signals: { id: string; type: 'warning' | 'info' | 'success'; message: string; icon: string; timestamp: string }[] = [];
  if (!data) return signals;

  const latestRecovery = data.recovery?.[0];
  const latestSleep = data.sleep?.[0];
  const latestCycle = data.cycles?.[0];

  if (latestRecovery) {
    const score = recoveryScore(latestRecovery);
    if (score > 0) {
      if (score < 33) signals.push({ id: 'rec-low', type: 'warning', message: `Recovery critically low at ${score}%. Prioritize rest today.`, icon: 'alert', timestamp: new Date().toISOString() });
      else if (score < 50) signals.push({ id: 'rec-mid', type: 'info', message: `Recovery at ${score}%. Consider lighter training.`, icon: 'info', timestamp: new Date().toISOString() });
      else signals.push({ id: 'rec-high', type: 'success', message: `Recovery strong at ${score}%. Ready to perform.`, icon: 'check', timestamp: new Date().toISOString() });
    }
  }
  if (latestSleep) {
    const eff = sleepEfficiency(latestSleep);
    if (eff > 0 && eff < 85) signals.push({ id: 'sleep-eff', type: 'warning', message: `Sleep efficiency at ${eff}%. Review sleep hygiene.`, icon: 'alert', timestamp: new Date().toISOString() });
  }
  if (latestCycle) {
    const strain = cycleStrain(latestCycle);
    if (strain > 18) signals.push({ id: 'strain-high', type: 'warning', message: `High strain (${strain.toFixed(1)}). Risk of overtraining.`, icon: 'alert', timestamp: new Date().toISOString() });
  }
  return signals;
}

// ── Page Component (Server Component) ────────────────────────────────────────

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ period?: string; tab?: string }> }) {
  const params = await searchParams;
  const selectedPeriod = (Number(params.period) || 30) as 30 | 60 | 90;
  const activeTab = (params.tab as 'overview' | 'sleep' | 'strain' | 'trends') || 'overview';

  const data = await fetchWhoopData(selectedPeriod);
  const signals = generateSignals(data);

  const recoveryStreak = computeStreak(data.recovery, (r: any) => recoveryScore(r), 66);
  const sleepStreak = computeStreak(data.sleep, (s: any) => sleepEfficiency(s), 85);
  const isLive = data.source === 'whoop-api';

  const oauthUrl = `https://api-7.whoop.com/oauth/oauth2/auth?response_type=code&client_id=${process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID || ''}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI || '')}&scope=read:recovery read:sleep read:workout read:profile`;

  const TABS = [
    { id: 'overview' as const, label: 'Overview', labelShort: 'Home', icon: BarChart3 },
    { id: 'sleep' as const, label: 'Sleep', labelShort: 'Sleep', icon: Moon },
    { id: 'strain' as const, label: 'Strain', labelShort: 'Strain', icon: Flame },
    { id: 'trends' as const, label: 'Trends', labelShort: 'Trends', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] pb-20 md:pb-0">
      {/* Header */}
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
                  {data?.user?.first_name ? `Welcome, ${data.user.first_name}` : 'Elite Performance Analytics'}
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {!isLive && (
                <a href={oauthUrl} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 hover:bg-cyan-500/30 transition-all text-sm font-medium active:scale-95">
                  <Zap className="w-4 h-4" />
                  Connect WHOOP
                </a>
              )}

              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${isLive ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'}`}>
                {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isLive ? 'LIVE' : 'DEMO'}
              </div>

              <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                {([30, 60, 90] as const).map(p => (
                  <a key={p} href={`/?period=${p}&tab=${activeTab}`} className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-95 ${selectedPeriod === p ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}>
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

            <a href="/" className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 active:scale-95">
              <RefreshCw className="w-5 h-5 text-zinc-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Desktop Tab Navigation */}
      <div className="hidden md:block max-w-[1600px] mx-auto px-6 pt-6">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit border border-white/5">
          {TABS.map(tab => (
            <a key={tab.id} href={`/?period=${selectedPeriod}&tab=${tab.id}`} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${activeTab === tab.id ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </a>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-3 sm:px-6 py-4 sm:py-6">

        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
            {/* Hero Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="glass-card p-4 sm:p-6 flex flex-col items-center justify-center glow-cyan sm:col-span-1">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-2 sm:mb-4">Recovery Score</h3>
                <RecoveryGauge score={data.recovery[0] ? recoveryScore(data.recovery[0]) : 0} size={140} />
                <p className="text-[10px] sm:text-xs text-zinc-500 mt-2 sm:mt-3">
                  {data.recovery[0] ? formatDate(data.recovery[0].created_at) : 'No data'}
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
                      {data?.cycles[0] ? safeNum(cycleStrain(data.cycles[0]), 1) : '—'}
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

              <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:col-span-2 lg:col-span-1">
                <MetricCard label="HRV" value={safeNum(data?.recovery[0] ? recoveryHRV(data.recovery[0]) : 0)} unit="ms" icon={<Heart className="w-3 h-3 sm:w-4 sm:h-4" />} accentColor="#06b6d4" trend="stable" />
                <MetricCard label="RHR" value={safeNum(data?.recovery[0] ? recoveryRHR(data.recovery[0]) : 0)} unit="bpm" icon={<Activity className="w-3 h-3 sm:w-4 sm:h-4" />} accentColor="#ef4444" trend="stable" />
                <MetricCard label="SpO2" value={safeNum(data?.recovery[0] ? recoverySpO2(data.recovery[0]) : 0)} unit="%" icon={<Droplets className="w-3 h-3 sm:w-4 sm:h-4" />} accentColor="#10b981" trend="stable" />
                <MetricCard label="Resp Rate" value={safeNum(data?.sleep[0] ? sleepRespiratoryRate(data.sleep[0]) : 0, 1)} unit="brpm" icon={<Wind className="w-3 h-3 sm:w-4 sm:h-4" />} accentColor="#8b5cf6" trend="stable" />
              </div>
            </div>

            {/* Sleep Need vs Actual + Skin Temp */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="glass-card p-4 sm:p-6 lg:col-span-2">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                  <Moon className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
                  Sleep Need vs Actual
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {data?.sleep.slice(0, 5).map((s: any, i: number) => {
                    const needed = sleepNeeded(s);
                    const actual = sleepInBed(s);
                    const perf = sleepPerformance(s);
                    return (
                      <div key={i} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-white/[0.02] rounded-xl border border-white/5">
                        <span className="text-[10px] sm:text-xs text-zinc-500 w-16 sm:w-20 flex-shrink-0">{formatDate(s.start)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] sm:text-xs text-zinc-400">Need: {formatDuration(needed)}</span>
                            <span className="text-[10px] sm:text-xs text-zinc-400">Got: {formatDuration(actual)}</span>
                          </div>
                          <div className="h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(perf, 100)}%`, background: perf >= 85 ? 'linear-gradient(90deg, #6366f1, #a78bfa)' : perf >= 60 ? 'linear-gradient(90deg, #f59e0b, #f97316)' : 'linear-gradient(90deg, #ef4444, #f97316)' }} />
                          </div>
                        </div>
                        <span className={`text-xs sm:text-sm font-semibold flex-shrink-0 ${perf >= 85 ? 'text-indigo-400' : perf >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                          {perf}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card p-4 sm:p-6">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                  <Thermometer className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                  Skin Temperature
                </h3>
                <div className="text-center mb-3 sm:mb-4">
                  <span className="text-3xl sm:text-4xl font-bold text-white">{data?.recovery[0] ? safeNum(recoverySkinTemp(data.recovery[0]), 1) : '—'}</span>
                  <span className="text-lg sm:text-xl text-zinc-500 ml-1">°C</span>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  {data?.recovery.slice(0, 5).map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[10px] sm:text-xs">
                      <span className="text-zinc-500">{formatDate(r.created_at)}</span>
                      <span className="text-zinc-300">{safeNum(recoverySkinTemp(r), 1)}°C</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Signals + Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <SignalsPanel signals={signals} />
              <CalendarHeatmap cycles={data?.cycles || []} />
            </div>
          </div>
        )}

        {/* ═══ SLEEP TAB ═══ */}
        {activeTab === 'sleep' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <MetricCard label="Avg Efficiency" value={safeNum(data?.sleep?.length ? Math.round(data.sleep.reduce((a: number, s: any) => a + sleepEfficiency(s), 0) / data.sleep.length) : 0)} unit="%" icon={<Moon className="w-3 h-3 sm:w-4 sm:h-4" />} accentColor="#6366f1" trend="stable" />
              <MetricCard label="Avg Consistency" value={safeNum(data?.sleep?.length ? Math.round(data.sleep.reduce((a: number, s: any) => a + sleepConsistency(s), 0) / data.sleep.length) : 0)} unit="%" icon={<Target className="w-3 h-3 sm:w-4 sm:h-4" />} accentColor="#8b5cf6" trend="stable" />
              <MetricCard label="Avg Time in Bed" value={data?.sleep?.length ? formatDuration(Math.round(data.sleep.reduce((a: number, s: any) => a + sleepInBed(s), 0) / data.sleep.length)) : '—'} unit="" icon={<Timer className="w-3 h-3 sm:w-4 sm:h-4" />} accentColor="#06b6d4" trend="stable" />
              <MetricCard label="Avg Disturbances" value={safeNum(data?.sleep?.length ? Math.round(data.sleep.reduce((a: number, s: any) => a + sleepDisturbances(s), 0) / data.sleep.length) : 0)} unit="" icon={<AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />} accentColor="#f59e0b" trend="stable" />
            </div>

            <Hypnogram sleeps={data?.sleep || []} />

            {/* Nap Detection */}
            <div className="glass-card p-4 sm:p-6">
              <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                <Moon className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
                Nap Detection
              </h3>
              {data?.sleep?.filter((s: any) => s.nap).length > 0 ? (
                <div className="space-y-2">
                  {data.sleep.filter((s: any) => s.nap).map((s: any, i: number) => (
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
        {activeTab === 'strain' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <StrainZones workouts={data?.workouts || []} />
              <div className="glass-card p-4 sm:p-6">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                  <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                  Strain Trend
                </h3>
                <div className="h-48 sm:h-64">
                  <TrendChart
                    data={data?.cycles?.slice(0, selectedPeriod).reverse().map((c: any) => ({ date: formatDate(c.start), value: cycleStrain(c) })) || []}
                    color="#f59e0b"
                    label="Strain"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                <Dumbbell className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                Recent Workouts
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {data?.workouts?.slice(0, 9).map((w: any, i: number) => (
                  <WorkoutCard key={i} workout={w} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TRENDS TAB ═══ */}
        {activeTab === 'trends' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="glass-card p-4 sm:p-6">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4">HRV Trend (ms)</h3>
                <div className="h-48 sm:h-64">
                  <TrendChart data={data?.recovery?.slice(0, selectedPeriod).reverse().map((r: any) => ({ date: formatDate(r.created_at), value: recoveryHRV(r) })) || []} color="#06b6d4" label="HRV" />
                </div>
              </div>
              <div className="glass-card p-4 sm:p-6">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4">Resting Heart Rate (bpm)</h3>
                <div className="h-48 sm:h-64">
                  <TrendChart data={data?.recovery?.slice(0, selectedPeriod).reverse().map((r: any) => ({ date: formatDate(r.created_at), value: recoveryRHR(r) })) || []} color="#ef4444" label="RHR" />
                </div>
              </div>
              <div className="glass-card p-4 sm:p-6">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4">SpO2 Trend (%)</h3>
                <div className="h-48 sm:h-64">
                  <TrendChart data={data?.recovery?.slice(0, selectedPeriod).reverse().map((r: any) => ({ date: formatDate(r.created_at), value: recoverySpO2(r) })) || []} color="#10b981" label="SpO2" />
                </div>
              </div>
              <div className="glass-card p-4 sm:p-6">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4">Respiratory Rate (brpm)</h3>
                <div className="h-48 sm:h-64">
                  <TrendChart data={data?.sleep?.slice(0, selectedPeriod).reverse().map((s: any) => ({ date: formatDate(s.start), value: sleepRespiratoryRate(s) })) || []} color="#8b5cf6" label="Resp Rate" />
                </div>
              </div>
            </div>

            <div className="glass-card p-4 sm:p-6">
              <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4">Recovery Score Trend</h3>
              <div className="h-48 sm:h-64">
                <TrendChart data={data?.recovery?.slice(0, selectedPeriod).reverse().map((r: any) => ({ date: formatDate(r.created_at), value: recoveryScore(r) })) || []} color="#06b6d4" label="Recovery" />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-xl border-t border-white/5 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {TABS.map(tab => (
            <a key={tab.id} href={`/?period=${selectedPeriod}&tab=${tab.id}`} className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all active:scale-95 min-w-[60px] ${activeTab === tab.id ? 'text-cyan-400' : 'text-zinc-500'}`}>
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-cyan-400' : 'text-zinc-500'}`} />
              <span className="text-[10px] font-medium">{tab.labelShort}</span>
              {activeTab === tab.id && <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cyan-400 rounded-full" />}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
