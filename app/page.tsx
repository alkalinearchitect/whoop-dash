'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Moon, Heart, Flame, TrendingUp, TrendingDown,
  Minus, Zap, Droplets, Thermometer, Wind, Award, Calendar,
  Share2, Download, ChevronRight, AlertTriangle, CheckCircle2,
  Info, Dumbbell, Timer, Target, BarChart3
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

interface DashboardData {
  user: User | null;
  cycles: Cycle[];
  recovery: Recovery[];
  sleep: SleepRecord[];
  workouts: Workout[];
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`glass p-6 animate-shimmer ${className}`}>
      <div className="h-4 w-24 bg-white/5 rounded mb-4" />
      <div className="h-8 w-16 bg-white/5 rounded mb-2" />
      <div className="h-3 w-32 bg-white/5 rounded" />
    </div>
  );
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<30 | 60 | 90>(30);
  const [activeTab, setActiveTab] = useState<'overview' | 'sleep' | 'strain' | 'trends'>('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/whoop?limit=${selectedPeriod}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch WHOOP data');
      }
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Generate signals from data
  const signals = [];
  if (data) {
    const latestRecovery = data.recovery[0];
    const latestSleep = data.sleep[0];
    const latestCycle = data.cycles[0];

    if (latestRecovery) {
      const score = (latestRecovery as any).recovery_score;
      if (score !== undefined) {
        if (score < 33) signals.push({ id: 'rec-low', type: 'warning' as const, message: `Recovery critically low at ${score}%. Prioritize rest today.`, icon: 'alert', timestamp: new Date().toISOString() });
        else if (score < 50) signals.push({ id: 'rec-mid', type: 'info' as const, message: `Recovery at ${score}%. Consider lighter training.`, icon: 'info', timestamp: new Date().toISOString() });
        else signals.push({ id: 'rec-high', type: 'success' as const, message: `Recovery strong at ${score}%. Ready to perform.`, icon: 'check', timestamp: new Date().toISOString() });
      }
    }
    if (latestSleep) {
      const eff = (latestSleep as any).sleep_efficiency_percentage;
      if (eff !== undefined && eff < 85) signals.push({ id: 'sleep-eff', type: 'warning' as const, message: `Sleep efficiency at ${eff}%. Review sleep hygiene.`, icon: 'alert', timestamp: new Date().toISOString() });
    }
    if (latestCycle) {
      const strain = (latestCycle as any).strain;
      if (strain !== undefined && strain > 18) signals.push({ id: 'strain-high', type: 'warning' as const, message: `High strain (${strain.toFixed(1)}). Risk of overtraining.`, icon: 'alert', timestamp: new Date().toISOString() });
    }
  }

  // Compute streaks
  const computeStreak = (items: any[], field: string, threshold: number, above = true): number => {
    let streak = 0;
    for (const item of items) {
      const val = item[field];
      if (val === undefined) break;
      if (above ? val >= threshold : val <= threshold) streak++;
      else break;
    }
    return streak;
  };

  const recoveryStreak = data ? computeStreak(data.recovery, 'recovery_score', 66) : 0;
  const sleepStreak = data ? computeStreak(data.sleep, 'sleep_efficiency_percentage', 85) : 0;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="glass p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button onClick={fetchData} className="px-6 py-3 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 hover:bg-cyan-500/30 transition-all">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">WHOOP Command Center</h1>
              <p className="text-xs text-zinc-500">{data?.user?.first_name ? `Welcome back, ${data.user.first_name}` : 'Elite Performance Analytics'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Toggle */}
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
              {([30, 60, 90] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === p
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {p}d
                </button>
              ))}
            </div>

            {/* Streak Badges */}
            {recoveryStreak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <Flame className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">{recoveryStreak}d</span>
                <span className="text-xs text-emerald-500/70">recovery</span>
              </div>
            )}
            {sleepStreak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-400">{sleepStreak}d</span>
                <span className="text-xs text-indigo-500/70">sleep</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-[1600px] mx-auto px-6 pt-6">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit border border-white/5">
          {([
            { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
            { id: 'sleep' as const, label: 'Sleep', icon: Moon },
            { id: 'strain' as const, label: 'Strain', icon: Flame },
            { id: 'trends' as const, label: 'Trends', icon: TrendingUp },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            {/* ===== OVERVIEW TAB ===== */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in-up">
                {/* Hero Row: Recovery + Strain + Key Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Recovery Gauge */}
                  <div className="glass p-6 flex flex-col items-center justify-center glow-cyan">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4">Recovery Score</h3>
                    <RecoveryGauge
                      score={data?.recovery[0] ? ((data.recovery[0] as any).recovery_score ?? 0) : 0}
                      size={180}
                    />
                    <p className="text-xs text-zinc-500 mt-3">
                      {data?.recovery[0] ? formatDate((data.recovery[0] as any).created_at || new Date().toISOString()) : 'No data'}
                    </p>
                  </div>

                  {/* Strain Gauge */}
                  <div className="glass p-6 flex flex-col items-center justify-center glow-orange">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4">Day Strain</h3>
                    <div className="relative w-44 h-44">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <circle
                          cx="50" cy="50" r="42" fill="none"
                          stroke="url(#strainGrad)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${Math.min(((data?.cycles[0] as any)?.strain ?? 0) / 20 * 264, 264)} 264`}
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient id="strainGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#ef4444" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-white animate-count-up">
                          {data?.cycles[0] ? ((data.cycles[0] as any).strain ?? 0).toFixed(1) : '—'}
                        </span>
                        <span className="text-xs text-zinc-500">out of 21</span>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-3 text-xs text-zinc-500">
                      <span>Low: 0-9</span>
                      <span>Mod: 10-14</span>
                      <span>High: 15+</span>
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard
                      label="HRV"
                      value={data?.recovery[0] ? String(Math.round((data.recovery[0] as any).hrv_rmssd ?? 0)) : '—'}
                      unit="ms"
                      icon={<Heart className="w-4 h-4" />}
                      accentColor="#06b6d4"
                      trend="stable"
                    />
                    <MetricCard
                      label="RHR"
                      value={data?.recovery[0] ? String(Math.round((data.recovery[0] as any).resting_heart_rate ?? 0)) : '—'}
                      unit="bpm"
                      icon={<Activity className="w-4 h-4" />}
                      accentColor="#ef4444"
                      trend="stable"
                    />
                    <MetricCard
                      label="SpO2"
                      value={data?.recovery[0] ? String((data.recovery[0] as any).spo2 ?? '—') : '—'}
                      unit="%"
                      icon={<Droplets className="w-4 h-4" />}
                      accentColor="#10b981"
                      trend="stable"
                    />
                    <MetricCard
                      label="Resp. Rate"
                      value={data?.sleep[0] ? String((data.sleep[0] as any).respiratory_rate ?? '—') : '—'}
                      unit="brpm"
                      icon={<Wind className="w-4 h-4" />}
                      accentColor="#8b5cf6"
                      trend="stable"
                    />
                  </div>
                </div>

                {/* Sleep Need vs Actual + Skin Temp */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="glass p-6 lg:col-span-2">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-400" />
                      Sleep Need vs Actual
                    </h3>
                    <div className="space-y-3">
                      {data?.sleep.slice(0, 5).map((s: any, i: number) => {
                        const needed = s.sleep_needed?.baseline_milli
                          ? formatDuration(s.sleep_needed.baseline_milli)
                          : '—';
                        const actual = s.total_in_bed_time_milli
                          ? formatDuration(s.total_in_bed_time_milli)
                          : '—';
                        const perf = s.sleep_performance_percentage ?? 0;
                        return (
                          <div key={i} className="flex items-center gap-4 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                            <span className="text-xs text-zinc-500 w-20">{formatDate(s.start)}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-zinc-400">Needed: {needed}</span>
                                <span className="text-xs text-zinc-400">Got: {actual}</span>
                              </div>
                              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${Math.min(perf, 100)}%`,
                                    background: perf >= 85 ? 'linear-gradient(90deg, #6366f1, #a78bfa)' : perf >= 60 ? 'linear-gradient(90deg, #f59e0b, #f97316)' : 'linear-gradient(90deg, #ef4444, #f97316)'
                                  }}
                                />
                              </div>
                            </div>
                            <span className={`text-sm font-semibold ${perf >= 85 ? 'text-indigo-400' : perf >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                              {Math.round(perf)}%
                            </span>
                          </div>
                        );
                      })}
                      {(!data?.sleep || data.sleep.length === 0) && (
                        <p className="text-sm text-zinc-500 text-center py-8">No sleep data available</p>
                      )}
                    </div>
                  </div>

                  <div className="glass p-6">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-orange-400" />
                      Skin Temperature
                    </h3>
                    <div className="space-y-4">
                      {data?.recovery.slice(0, 5).map((r: any, i: number) => {
                        const temp = r.skin_temp_celsius;
                        if (temp === undefined) return null;
                        return (
                          <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                            <span className="text-xs text-zinc-500">{formatDate(r.created_at || new Date().toISOString())}</span>
                            <span className="text-lg font-semibold text-white">{temp.toFixed(1)}°C</span>
                          </div>
                        );
                      })}
                      {(!data?.recovery || data.recovery.length === 0) && (
                        <p className="text-sm text-zinc-500 text-center py-8">No temperature data</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Signals + Calendar Heatmap */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1">
                    <SignalsPanel signals={signals} />
                  </div>
                  <div className="lg:col-span-2">
                    <CalendarHeatmap cycles={data?.cycles || []} />
                  </div>
                </div>
              </div>
            )}

            {/* ===== SLEEP TAB ===== */}
            {activeTab === 'sleep' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="glass p-6">
                  <h3 className="text-sm font-medium text-zinc-400 mb-6 flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    Sleep Architecture — Hypnogram
                  </h3>
                  <Hypnogram sleeps={data?.sleep || []} />
                </div>

                {/* Sleep Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard
                    label="Avg Sleep Efficiency"
                    value={data?.sleep.length ? String(Math.round(data.sleep.reduce((a: number, s: any) => a + (s.sleep_efficiency_percentage ?? 0), 0) / data.sleep.length)) : '—'}
                    unit="%"
                    icon={<Target className="w-4 h-4" />}
                    accentColor="#6366f1"
                    trend="stable"
                  />
                  <MetricCard
                    label="Avg Consistency"
                    value={data?.sleep.length ? String(Math.round(data.sleep.reduce((a: number, s: any) => a + (s.sleep_consistency_percentage ?? 0), 0) / data.sleep.length)) : '—'}
                    unit="%"
                    icon={<Calendar className="w-4 h-4" />}
                    accentColor="#a78bfa"
                    trend="stable"
                  />
                  <MetricCard
                    label="Avg Time in Bed"
                    value={data?.sleep.length ? formatDuration(data.sleep.reduce((a: number, s: any) => a + (s.total_in_bed_time_milli ?? 0), 0) / data.sleep.length) : '—'}
                    unit=""
                    icon={<Timer className="w-4 h-4" />}
                    accentColor="#38bdf8"
                    trend="stable"
                  />
                </div>

                {/* Nap Detection */}
                <div className="glass p-6">
                  <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Nap Detection
                  </h3>
                  <div className="space-y-2">
                    {data?.sleep.filter((s: any) => s.nap === true).slice(0, 10).map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span className="text-sm text-zinc-300">{formatDate(s.start)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <span>Duration: {s.total_in_bed_time_milli ? formatDuration(s.total_in_bed_time_milli) : '—'}</span>
                          <span className="text-amber-400 font-medium">Nap</span>
                        </div>
                      </div>
                    ))}
                    {data?.sleep.filter((s: any) => s.nap === true).length === 0 && (
                      <p className="text-sm text-zinc-500 text-center py-8">No naps detected in this period</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== STRAIN TAB ===== */}
            {activeTab === 'strain' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="glass p-6">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      Heart Rate Zone Distribution
                    </h3>
                    <StrainZones workouts={data?.workouts || []} />
                  </div>
                  <div className="glass p-6">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      Strain Trend
                    </h3>
                    <TrendChart
                      data={data?.cycles.slice(0, selectedPeriod).reverse().map((c: any) => ({
                        date: formatDate(c.start || c.created_at || new Date().toISOString()),
                        value: c.strain ?? 0,
                      })) || []}
                      dataKey="value"
                      color="#f59e0b"
                      label="Strain"
                      unit=""
                    />
                  </div>
                </div>

                {/* Workout Cards */}
                <div className="glass p-6">
                  <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-red-400" />
                    Recent Workouts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data?.workouts.slice(0, 12).map((w: any, i: number) => (
                      <WorkoutCard key={i} workout={w} />
                    ))}
                    {(!data?.workouts || data.workouts.length === 0) && (
                      <p className="text-sm text-zinc-500 text-center py-8 col-span-full">No workouts in this period</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== TRENDS TAB ===== */}
            {activeTab === 'trends' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="glass p-6">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-cyan-400" />
                      HRV Trend (RMSSD)
                    </h3>
                    <TrendChart
                      data={data?.recovery.slice(0, selectedPeriod).reverse().map((r: any) => ({
                        date: formatDate(r.created_at || new Date().toISOString()),
                        value: Math.round(r.hrv_rmssd ?? 0),
                      })) || []}
                      dataKey="value"
                      color="#06b6d4"
                      label="HRV"
                      unit="ms"
                    />
                  </div>
                  <div className="glass p-6">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-red-400" />
                      Resting Heart Rate
                    </h3>
                    <TrendChart
                      data={data?.recovery.slice(0, selectedPeriod).reverse().map((r: any) => ({
                        date: formatDate(r.created_at || new Date().toISOString()),
                        value: Math.round(r.resting_heart_rate ?? 0),
                      })) || []}
                      dataKey="value"
                      color="#ef4444"
                      label="RHR"
                      unit="bpm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="glass p-6">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-emerald-400" />
                      SpO2 Trend
                    </h3>
                    <TrendChart
                      data={data?.recovery.slice(0, selectedPeriod).reverse().map((r: any) => ({
                        date: formatDate(r.created_at || new Date().toISOString()),
                        value: r.spo2 ?? 0,
                      })) || []}
                      dataKey="value"
                      color="#10b981"
                      label="SpO2"
                      unit="%"
                    />
                  </div>
                  <div className="glass p-6">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                      <Wind className="w-4 h-4 text-purple-400" />
                      Respiratory Rate
                    </h3>
                    <TrendChart
                      data={data?.sleep.slice(0, selectedPeriod).reverse().map((s: any) => ({
                        date: formatDate(s.start || new Date().toISOString()),
                        value: s.respiratory_rate ?? 0,
                      })) || []}
                      dataKey="value"
                      color="#8b5cf6"
                      label="Resp Rate"
                      unit="brpm"
                    />
                  </div>
                </div>

                {/* Recovery Score Trend */}
                <div className="glass p-6">
                  <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    Recovery Score Trend
                  </h3>
                  <TrendChart
                    data={data?.recovery.slice(0, selectedPeriod).reverse().map((r: any) => ({
                      date: formatDate(r.created_at || new Date().toISOString()),
                      value: (r as any).recovery_score ?? 0,
                    })) || []}
                    dataKey="value"
                    color="#22c55e"
                    label="Recovery"
                    unit="%"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto px-6 py-8 border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-zinc-600">
          <span>WHOOP Command Center — Elite Performance Analytics</span>
          <span>Data from WHOOP API v2</span>
        </div>
      </footer>
    </div>
  );
}
