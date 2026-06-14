import { NextResponse } from 'next/server';

async function whoopFetch(token: string, endpoint: string, params?: Record<string, string>) {
  const url = new URL(`https://api.whoop.com/v2/${endpoint}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WHOOP API ${res.status}: ${body}`);
  }
  return res.json();
}

function generateMockData(limit: number) {
  const days = Array.from({ length: limit }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString();
  });

  return {
    user: { user_id: 12345, email: 'demo@whoop.com', first_name: 'Demo', last_name: 'User' },
    cycles: days.map((d, i) => ({
      id: 1000 + i, start: d, end: d, created_at: d,
      strain: 8 + Math.random() * 12,
      kilojoule: 8000 + Math.random() * 12000,
      average_heart_rate: 65 + Math.random() * 20,
      max_heart_rate: 140 + Math.random() * 50,
      recovery_score: Math.floor(40 + Math.random() * 55),
      sleep_performance_percentage: 70 + Math.random() * 30,
    })),
    recovery: days.map((d, i) => ({
      id: 2000 + i, created_at: d,
      recovery_score: Math.floor(40 + Math.random() * 55),
      resting_heart_rate: Math.floor(48 + Math.random() * 12),
      hrv_rmssd: Math.floor(35 + Math.random() * 35),
      spo2: Math.floor(95 + Math.random() * 4),
      skin_temp_celsius: 33 + Math.random() * 2,
      respiratory_rate: 13 + Math.random() * 4,
    })),
    sleep: days.map((d, i) => ({
      id: 3000 + i, start: d, end: d,
      total_in_bed_time_milli: (6 + Math.random() * 3) * 3600000,
      sleep_efficiency_percentage: 75 + Math.random() * 22,
      sleep_consistency_percentage: 60 + Math.random() * 35,
      sleep_quality_percentage: 70 + Math.random() * 25,
      sleep_performance_percentage: 70 + Math.random() * 25,
      respiratory_rate: 13 + Math.random() * 4,
      resting_heart_rate: Math.floor(48 + Math.random() * 10),
      hrv_rmssd: Math.floor(35 + Math.random() * 30),
      nap: Math.random() > 0.85,
      sleep_needed: {
        baseline_milli: (7.5 + Math.random() * 1.5) * 3600000,
        need_from_sleep_debt_milli: Math.random() * 3600000,
        need_from_recent_strain_milli: Math.random() * 1800000,
      },
      sleep_stage_summary: {
        total_in_bed_time_milli: (6 + Math.random() * 3) * 3600000,
        total_sleep_time_milli: (5.5 + Math.random() * 3) * 3600000,
        total_awake_time_milli: Math.random() * 3600000,
        total_light_sleep_time_milli: (2.5 + Math.random() * 1.5) * 3600000,
        total_slow_wave_sleep_time_milli: (1 + Math.random() * 0.8) * 3600000,
        total_rem_sleep_time_milli: (1.2 + Math.random() * 0.8) * 3600000,
        sleep_cycle_count: Math.floor(4 + Math.random() * 3),
        disturbance_count: Math.floor(Math.random() * 8),
      },
    })),
    workouts: Array.from({ length: Math.min(Math.floor(limit / 3), 20) }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i * 3);
      return {
        id: 4000 + i,
        start: date.toISOString(),
        end: new Date(date.getTime() + (30 + Math.random() * 90) * 60000).toISOString(),
        sport_id: [1, 71, 72, 16, 43, 4, 12][Math.floor(Math.random() * 7)],
        strain: 6 + Math.random() * 12,
        kilojoule: 500 + Math.random() * 3000,
        average_heart_rate: 110 + Math.random() * 40,
        max_heart_rate: 150 + Math.random() * 40,
        zone_duration: {
          zone_zero_milli: Math.random() * 600000,
          zone_one_milli: Math.random() * 1200000,
          zone_two_milli: Math.random() * 1800000,
          zone_three_milli: Math.random() * 1200000,
          zone_four_milli: Math.random() * 600000,
          zone_five_milli: Math.random() * 300000,
        },
      };
    }),
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '30', 10);
    const token = process.env.WHOOP_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json(generateMockData(limit));
    }

    const [profile, cycles, recoveryRes, sleep, workouts] = await Promise.all([
      whoopFetch(token, 'user/profile').catch(() => null),
      whoopFetch(token, 'cycle', { limit: String(limit), order: 'desc' }),
      whoopFetch(token, 'recovery', { limit: String(limit), order: 'desc' }),
      whoopFetch(token, 'sleep', { limit: String(limit), order: 'desc' }),
      whoopFetch(token, 'activity/workout', { limit: String(Math.min(limit, 50)), order: 'desc' }),
    ]);

    return NextResponse.json({
      user: profile || null,
      cycles: cycles?.records || [],
      recovery: recoveryRes?.records || [],
      sleep: sleep?.records || [],
      workouts: workouts?.records || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
