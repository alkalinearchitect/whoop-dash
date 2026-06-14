'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Moon, Heart, Flame, TrendingUp, TrendingDown,
  Minus, Zap, Droplets, Thermometer, Wind, Award, Calendar,
  Share2, Download, ChevronRight, AlertTriangle, CheckCircle2,
  Info, Dumbbell, Timer, Target, BarChart3, Wifi, WifiOff, Menu, X
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
    <div className={`glass-card p-4 sm:p-6 animate-shimmer ${className}`}>
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

const TABS = [
  { id: 'overview' as const, label: 'Overview', labelShort: 'Home', icon: BarChart3 },
  { id: 'sleep' as const, label: 'Sleep', labelShort: 'Sleep', icon: Moon },
  { id: 'strain' as const, label: 'Strain', labelShort: 'Strain', icon: Flame },
  { id: 'trends' as const, label: 'Trends', labelShort: 'Trends', icon: TrendingUp },
];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<30 | 60 | 90>(30);
  const [activeTab, setActiveTab] = useState<'overview' | 'sleep' | 'strain' | 'trends'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const isLive = (data as any)?.source === 'whoop-api';

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className="glass-card p-6 sm:p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-sm sm:text-base text-zinc-400 mb-6">{error}</p>
          <button onClick={fetchData} className="px-6 py-3 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 hover:bg-cyan-500/30 transition-all active:scale-95">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 sm:py-4">
          {/* Top row: Logo + actions */}
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

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Connect WHOOP Button */}
              {!isLive && (
                <a
                  href={`https://api-7.whoop.com/oauth/oauth2/auth?response_type=code&client_id=${process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI || '')}&scope=read:recovery read:sleep read:workout read:profile`}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 hover:bg-cyan-500/30 transition-all text-sm font-medium active:scale-95"
                >
                  <Zap className="w-4 h-4" />
                  Connect WHOOP
                </a>
              )}

              {data && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${isLive ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'}`}>
                  {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isLive ? 'LIVE' : 'DEMO'}
                </div>
              )}

              <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                {([30, 60, 90] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setSelectedPeriod(p)}
                    className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-95 ${
                      selectedPeriod === p
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {p}d
                  </button>
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

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 active:scale-95"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-zinc-400" /> : <Menu className="w-5 h-5 text-zinc-400" />}
            </button>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pb-2 border-t border-white/5 pt-3 space-y-3 animate-fade-in-up">
              {!isLive && (
                <a
                  href={`https://api-7.whoop.com/oauth/oauth2/auth?response_type=code&client_id=${process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI || '')}&scope=read:recovery read:sleep read:workout read:profile`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 font-medium active:scale-95"
                >
                  <Zap className="w-4 h-4" />
                  Connect WHOOP
                </a>
              )}

              {data && (
                <div className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium ${isLive ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'}`}>
                  {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isLive ? 'LIVE DATA' : 'DEMO DATA'}
                </div>
              )}

              <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                {([30, 60, 90] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => { setSelectedPeriod(p); setMobileMenuOpen(false); }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                      selectedPeriod === p
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-zinc-500'
                    }`}
                  >
                    {p}d
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                {recoveryStreak > 0 && (
                  <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <Flame className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">{recoveryStreak}d recovery</span>
                  </div>
                )}
                {sleepStreak > 0 && (
                  <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-semibold text-indigo-400">{sleepStreak}d sleep</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Desktop Tab Navigation */}
      <div className="hidden md:block max-w-[1600px] mx-auto px-6 pt-6">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit border border-white/5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
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
      <main className="max-w-[1600px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            {/* ===== OVERVIEW TAB ===== */}
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
                {/* Hero Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* Recovery Gauge */}
                  <div className="glass-card p-4 sm:p-6 flex flex-col items-center justify-center glow-cyan sm:col-span-1">
                    <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-2 sm:mb-4">Recovery Score</h3>
                    <RecoveryGauge
                      score={data?.recovery[0] ? ((data.recovery[0] as any).recovery_score ?? 0) : 0}
                      size={140}
                    />
                    <p className="text-[10px] sm:text-xs text-zinc-500 mt-2 sm:mt-3">
                      {data?.recovery[0] ? formatDate((data.recovery[0] as any).created_at || new Date().toISOString()) : 'No data'}
                    </p>
                  </div>

                  {/* Strain Gauge */}
                  <div className="glass-card p-4 sm:p-6 flex flex-col items-center justify-center glow-orange">
                    <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-2 sm:mb-4">Day Strain</h3>
                    <div className="relative w-32 h-32 sm:w-44 sm:h-44">
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
                        <span className="text-2xl sm:text-4xl font-bold text-white animate-count-up">
                          {data?.cycles[0] ? ((data.cycles[0] as any).strain ?? 0).toFixed(1) : '—'}
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

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:col-span-2 lg:col-span-1">
                    <MetricCard
                      label="HRV"
                      value={data?.recovery[0] ? String(Math.round((data.recovery[0] as any).hrv_rmssd ?? 0)) : '—'}
                      unit="ms"
                      icon={<Heart className="w-3 h-3 sm:w-4 sm:h-4" />}
                      accentColor="#06b6d4"
                      trend="stable"
                    />
                    <MetricCard
                      label="RHR"
                      value={data?.recovery[0] ? String(Math.round((data.recovery[0] as any).resting_heart_rate ?? 0)) : '—'}
                      unit="bpm"
                      icon={<Activity className="w-3 h-3 sm:w-4 sm:h-4" />}
                      accentColor="#ef4444"
                      trend="stable"
                    />
                    <MetricCard
                      label="SpO2"
                      value={data?.recovery[0] ? String((data.recovery[0] as any).spo2 ?? '—') : '—'}
                      unit="%"
                      icon={<Droplets className="w-3 h-3 sm:w-4 sm:h-4" />}
                      accentColor="#10b981"
                      trend="stable"
                    />
                    <MetricCard
                      label="Resp Rate"
                      value={data?.sleep[0] ? String((data.sleep[0] as any).respiratory_rate ?? '—') : '—'}
                      unit="brpm"
                      icon={<Wind className="w-3 h-3 sm:w-4 sm:h-4" />}
                      accentColor="#8b5cf6"
                      trend="stable"
                    />
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
                        const needed = s.sleep_needed?.baseline_milli ? formatDuration(s.sleep_needed.baseline_milli) : '—';
                        const actual = s.total_in_bed_time_milli ? formatDuration(s.total_in_bed_time_milli) : '—';
                        const perf = s.sleep_performance_percentage ?? 0;
                        return (
                          <div key={i} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-white/[0.02] rounded-xl border border-white/5">
                            <span className="text-[10px] sm:text-xs text-zinc-500 w-16 sm:w-20 flex-shrink-0">{formatDate(s.start)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] sm:text-xs text-zinc-400">Need: {needed}</span>
                                <span className="text-[10px] sm:text-xs text-zinc-400">Got: {actual}</span>
                              </div>
                              <div className="h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${Math.min(perf, 100)}%`,
                                    background: perf >= 85 ? 'linear-gradient(90deg, #6366f1, #a78bfa)' : perf >= 60 ? 'linear-gradient(90deg, #f59e0b, #f97316)' : 'linear-gradient(90deg, #ef4444, #f97316)'
                                  }}
                                />
                              </div>
                            </div>
                            <span className={`text-xs sm:text-sm font-semibold flex-shrink-0 ${perf >= 85 ? 'text-indigo-400' : perf >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
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

                  <div className="glass-card p-4 sm:p-6">
                    <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                      <Thermometer className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                      Skin Temperature
                    </h3>
                    <div className="space-y-2 sm:space-y-4">
                      {data?.recovery.slice(0, 5).map((r: any, i: number) => {
                        const temp = r.skin_temp_celsius;
                        if (temp === undefined) return null;
                        return (
                          <div key={i} className="flex items-center justify-between p-2 sm:p-3 bg-white/[0.02] rounded-xl border border-white/5">
                            <span className="text-[10px] sm:text-xs text-zinc-500">{formatDate(r.created_at || new Date().toISOString())}</span>
                            <span className="text-sm sm:text-base font-semibold text-orange-400">{temp.toFixed(1)}°C</span>
                          </div>
                        );
                      })}
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

            {/* ===== SLEEP TAB ===== */}
            {activeTab === 'sleep' && (
              <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <MetricCard
                    label="Avg Sleep Efficiency"
                    value={data?.sleep.length ? `${Math.round(data.sleep.reduce((a: number, s: any) => a + (s.sleep_efficiency_percentage ?? 0), 0) / data.sleep.length)}` : '—'}
                    unit="%"
                    icon={<Moon className="w-3 h-3 sm:w-4 sm:h-4" />}
                    accentColor="#6366f1"
                    trend="stable"
                  />
                  <MetricCard
                    label="Avg Sleep Consistency"
                    value={data?.sleep.length ? `${Math.round(data.sleep.reduce((a: number, s: any) => a + (s.sleep_consistency_percentage ?? 0), 0) / data.sleep.length)}` : '—'}
                    unit="%"
                    icon={<Target className="w-3 h-3 sm:w-4 sm:h-4" />}
                    accentColor="#8b5cf6"
                    trend="stable"
                  />
                  <MetricCard
                    label="Avg Time in Bed"
                    value={data?.sleep.length ? formatDuration(data.sleep.reduce((a: number, s: any) => a + (s.total_in_bed_time_milli ?? 0), 0) / data.sleep.length) : '—'}
                    unit=""
                    icon={<Timer className="w-3 h-3 sm:w-4 sm:h-4" />}
                    accentColor="#06b6d4"
                    trend="stable"
                  />
                  <MetricCard
                    label="Avg Disturbances"
                    value={data?.sleep.length ? `${(data.sleep.reduce((a: number, s: any) => a + (s.disturbances ?? 0), 0) / data.sleep.length).toFixed(1)}` : '—'}
                    unit=""
                    icon={<AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />}
                    accentColor="#f59e0b"
                    trend="stable"
                  />
                </div>

                <Hypnogram sleeps={data?.sleep || []} />

                {/* Nap Detection */}
                <div className="glass-card p-4 sm:p-6">
                  <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                    Nap Detection
                  </h3>
                  <div className="space-y-2">
                    {data?.sleep?.filter((s: any) => s.nap === true).slice(0, 5).map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 sm:p-3 bg-white/[0.02] rounded-xl border border-white/5">
                        <span className="text-[10px] sm:text-xs text-zinc-500">{formatDate(s.start)}</span>
                        <span className="text-xs sm:text-sm font-medium text-yellow-400">
                          {s.total_in_bed_time_milli ? formatDuration(s.total_in_bed_time_milli) : '—'}
                        </span>
                      </div>
                    ))}
                    {(!data?.sleep?.filter((s: any) => s.nap === true).length) && (
                      <p className="text-xs sm:text-sm text-zinc-500 text-center py-4">No naps detected in this period</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== STRAIN TAB ===== */}
            {activeTab === 'strain' && (
              <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <StrainZones workouts={data?.workouts || []} />
                  <div className="glass-card p-4 sm:p-6">
                    <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                      <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                      Strain Trend
                    </h3>
                    <TrendChart
                      data={data?.cycles?.slice(0, selectedPeriod).reverse().map((c: any) => ({
                        displayDate: formatDate(c.created_at || c.day || new Date().toISOString()),
                        value: c.strain ?? 0,
                      })) || []}
                      dataKey="value"
                      color="#f59e0b"
                      label="Strain"
                      height={200}
                    />
                  </div>
                </div>

                {/* Workout Cards */}
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-zinc-300 mb-3 sm:mb-4 flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                    Recent Workouts
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {data?.workouts?.slice(0, 9).map((w: any, i: number) => (
                      <WorkoutCard key={i} workout={w} />
                    ))}
                    {(!data?.workouts || data.workouts.length === 0) && (
                      <div className="col-span-full glass-card p-8 text-center">
                        <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-sm text-zinc-500">No workouts in this period</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== TRENDS TAB ===== */}
            {activeTab === 'trends' && (
              <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div className="glass-card p-4 sm:p-6">
                    <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                      <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                      HRV Trend
                    </h3>
                    <TrendChart
                      data={data?.recovery?.slice(0, selectedPeriod).reverse().map((r: any) => ({
                        displayDate: formatDate(r.created_at || new Date().toISOString()),
                        value: Math.round(r.hrv_rmssd ?? 0),
                      })) || []}
                      dataKey="value"
                      color="#06b6d4"
                      label="HRV (ms)"
                      height={200}
                    />
                  </div>
                  <div className="glass-card p-4 sm:p-6">
                    <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                      <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                      Resting Heart Rate Trend
                    </h3>
                    <TrendChart
                      data={data?.recovery?.slice(0, selectedPeriod).reverse().map((r: any) => ({
                        displayDate: formatDate(r.created_at || new Date().toISOString()),
                        value: Math.round(r.resting_heart_rate ?? 0),
                      })) || []}
                      dataKey="value"
                      color="#ef4444"
                      label="RHR (bpm)"
                      height={200}
                    />
                  </div>
                  <div className="glass-card p-4 sm:p-6">
                    <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                      <Droplets className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                      SpO2 Trend
                    </h3>
                    <TrendChart
                      data={data?.recovery?.slice(0, selectedPeriod).reverse().map((r: any) => ({
                        displayDate: formatDate(r.created_at || new Date().toISOString()),
                        value: r.spo2 ?? 0,
                      })) || []}
                      dataKey="value"
                      color="#10b981"
                      label="SpO2 (%)"
                      height={200}
                    />
                  </div>
                  <div className="glass-card p-4 sm:p-6">
                    <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                      <Wind className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                      Respiratory Rate Trend
                    </h3>
                    <TrendChart
                      data={data?.sleep?.slice(0, selectedPeriod).reverse().map((s: any) => ({
                        displayDate: formatDate(s.start || new Date().toISOString()),
                        value: s.respiratory_rate ?? 0,
                      })) || []}
                      dataKey="value"
                      color="#8b5cf6"
                      label="Resp Rate (brpm)"
                      height={200}
                    />
                  </div>
                </div>

                {/* Recovery Score Trend - Full Width */}
                <div className="glass-card p-4 sm:p-6">
                  <h3 className="text-xs sm:text-sm font-medium text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                    <Award className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                    Recovery Score Trend
                  </h3>
                  <TrendChart
                    data={data?.recovery?.slice(0, selectedPeriod).reverse().map((r: any) => ({
                      displayDate: formatDate(r.created_at || new Date().toISOString()),
                      value: r.recovery_score ?? 0,
                    })) || []}
                    dataKey="value"
                    color="#eab308"
                    label="Recovery (%)"
                    height={250}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-xl border-t border-white/5 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all active:scale-95 min-w-[60px] ${
                activeTab === tab.id
                  ? 'text-cyan-400'
                  : 'text-zinc-500'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-cyan-400' : 'text-zinc-500'}`} />
              <span className="text-[10px] font-medium">{tab.labelShort}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
