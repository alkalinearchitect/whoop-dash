// WHOOP API v2 — Data Layer
// Base URL: https://api.whoop.com/v2
// Auth: Bearer <token> via OAuth2
//
// WHOOP returns many scores as 0–1 floats; multiply by 100 for percentages.
// Recovery scores come from sleep.performance_percentage * 100.

const BASE_URL = "https://api.prod.whoop.com/developer/v2";

// ---------------------------------------------------------------------------
// Pagination response wrapper
// ---------------------------------------------------------------------------

interface WhoopRecords<T> {
  records: T[];
  next_token: string | null;
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export interface User {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

// ---------------------------------------------------------------------------
// Cycle
// ---------------------------------------------------------------------------

export interface CycleScore {
  recovery_score: number | null;          // 0–1 → ×100 for %
  sleep_performance_percentage: number | null; // 0–1 → ×100 for %
  sleep_consistency_percentage: number | null; // 0–1 → ×100 for %
  sleep_efficiency_percentage: number | null;  // 0–1 → ×100 for %
  strain: number | null;
  kilojoule: number | null;
  heart_rate_avg: number | null;
  heart_rate_max: number | null;
  heart_rate_min: number | null;
  respiratory_rate: number | null;
  spo2: number | null;
  skin_temp_celsius: number | null;
  hrv_rmssd: number | null;
  hrv_sdnn: number | null;
  resting_heart_rate: number | null;
}

export interface Cycle {
  id: number;
  user_id: number;
  start: string;
  end: string;
  timezone_offset: string;
  score_state: string;
  score: CycleScore | null;
}

// ---------------------------------------------------------------------------
// Recovery
// ---------------------------------------------------------------------------

export interface RecoveryScore {
  user_calibrating: boolean;
  recovery_score: number | null;          // 0–1 → ×100 for %
  resting_heart_rate: number | null;
  hrv_rmssd: number | null;
  spo2: number | null;
  skin_temp_celsius: number | null;
}

export interface Recovery {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: string;
  score: RecoveryScore | null;
}

// ---------------------------------------------------------------------------
// Sleep
// ---------------------------------------------------------------------------

export interface SleepStageSummary {
  total_in_bed_time_milli: number;
  total_awake_time_milli: number;
  total_no_data_time_milli: number;
  total_light_sleep_time_milli: number;
  total_slow_wave_sleep_time_milli: number;
  total_rem_sleep_time_milli: number;
  sleep_cycle_count: number;
  disturbance_count: number;
}

export interface SleepNeeded {
  baseline_milli: number;
  need_from_sleep_debt_milli: number;
  need_from_recent_strain_milli: number;
  need_from_recent_nap_milli: number;
}

export interface SleepScore {
  stage_summary: SleepStageSummary | null;
  sleep_needed: SleepNeeded | null;
  respiratory_rate: number | null;
  sleep_performance_percentage: number | null;    // 0–1 → ×100 for recovery score display
  sleep_consistency_percentage: number | null;    // 0–1 → ×100 for %
  sleep_efficiency_percentage: number | null;     // 0–1 → ×100 for %
}

export interface SleepRecord {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score: SleepScore | null;
}

// ---------------------------------------------------------------------------
// Workout
// ---------------------------------------------------------------------------

export interface WorkoutZoneDuration {
  zone_zero_milli: number | null;
  zone_one_milli: number | null;
  zone_two_milli: number | null;
  zone_three_milli: number | null;
  zone_four_milli: number | null;
  zone_five_milli: number | null;
}

export interface WorkoutScore {
  strain: number | null;
  kilojoule: number | null;
  average_heart_rate: number | null;
  max_heart_rate: number | null;
  percent_recorded: number | null;
  distance_meter: number | null;
  altitude_gain_meter: number | null;
  altitude_change_meter: number | null;
  zone_duration: WorkoutZoneDuration | null;
}

export interface Workout {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_id: number;
  score_state: string;
  score: WorkoutScore | null;
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class WhoopApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, statusText: string, body: string) {
    super(`WHOOP API ${status}: ${statusText}${body ? ` — ${body}` : ""}`);
    this.name = "WhoopApiError";
    this.status = status;
    this.body = body;
  }
}

// ---------------------------------------------------------------------------
// WhoopAPI class
// ---------------------------------------------------------------------------

export class WhoopAPI {
  private token: string;

  constructor(accessToken: string) {
    this.token = accessToken;
  }

  // -- low-level fetch -------------------------------------------------------

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new WhoopApiError(res.status, res.statusText, body);
    }

    return res.json() as Promise<T>;
  }

  // -- paginated fetch helper -------------------------------------------------

  private async fetchAll<T>(
    path: string,
    params: Record<string, string>,
    limit?: number,
  ): Promise<T[]> {
    const all: T[] = [];
    let nextToken: string | null = null;

    do {
      const p = { ...params };
      if (nextToken) p.nextToken = nextToken;

      const data = await this.request<WhoopRecords<T>>(path, p);
      all.push(...data.records);
      nextToken = data.next_token;
    } while (nextToken && (!limit || all.length < limit));

    // Trim to requested limit
    return limit ? all.slice(0, limit) : all;
  }

  // -- endpoints --------------------------------------------------------------

  /** GET /user/profile */
  async getUserProfile(): Promise<User> {
    return this.request<User>("/user/profile");
  }

  /** GET /cycle — returns `limit` most-recent cycles. */
  async getCycles(limit = 30): Promise<Cycle[]> {
    return this.fetchAll<Cycle>("/cycle", {}, limit);
  }

  /** GET /recovery — returns `limit` most-recent recovery records. */
  async getRecovery(limit = 30): Promise<Recovery[]> {
    return this.fetchAll<Recovery>("/recovery", {}, limit);
  }

  /** GET /activity/sleep — returns `limit` most-recent sleep records. */
  async getSleepRecords(limit = 30): Promise<SleepRecord[]> {
    return this.fetchAll<SleepRecord>("/activity/sleep", {}, limit);
  }

  /** GET /activity/workout — returns `limit` most-recent workouts. */
  async getWorkouts(limit = 30): Promise<Workout[]> {
    return this.fetchAll<Workout>("/activity/workout", {}, limit);
  }
}

// ---------------------------------------------------------------------------
// Standalone convenience functions (instantiate WhoopAPI internally)
// ---------------------------------------------------------------------------

export async function getUserProfile(token: string): Promise<User> {
  return new WhoopAPI(token).getUserProfile();
}

export async function getCycles(token: string, limit = 30): Promise<Cycle[]> {
  return new WhoopAPI(token).getCycles(limit);
}

export async function getRecovery(token: string, limit = 30): Promise<Recovery[]> {
  return new WhoopAPI(token).getRecovery(limit);
}

export async function getSleep(token: string, limit = 30): Promise<SleepRecord[]> {
  return new WhoopAPI(token).getSleepRecords(limit);
}

export async function getWorkouts(token: string, limit = 30): Promise<Workout[]> {
  return new WhoopAPI(token).getWorkouts(limit);
}

// ---------------------------------------------------------------------------
// Mock data generator (for demo / no-token mode)
// ---------------------------------------------------------------------------

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateMockData(limit: number) {
  const rand = seededRandom(42);
  const now = new Date();

  const cycles: Cycle[] = [];
  const recovery: Recovery[] = [];
  const sleep: SleepRecord[] = [];
  const workouts: Workout[] = [];

  for (let i = 0; i < limit; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString();
    const recoveryScore = Math.round(40 + rand() * 55);
    const strain = Math.round((8 + rand() * 13) * 10) / 10;
    const hrv = Math.round(35 + rand() * 40);
    const rhr = Math.round(44 + rand() * 12);
    const spo2 = Math.round((94 + rand() * 5) * 10) / 10;
    const skinTemp = Math.round((32 + rand() * 4) * 10) / 10;
    const respRate = Math.round((12 + rand() * 6) * 100) / 100;
    const sleepEff = Math.round(70 + rand() * 28);
    const sleepCons = Math.round(60 + rand() * 38);
    const perfPct = Math.round((0.5 + rand() * 0.45) * 10000) / 10000;
    const inBed = Math.round((6 + rand() * 3) * 3600000);
    const rem = Math.round(inBed * (0.15 + rand() * 0.15));
    const sws = Math.round(inBed * (0.1 + rand() * 0.1));
    const light = Math.round(inBed * (0.4 + rand() * 0.15));
    const awake = Math.round(inBed * (0.05 + rand() * 0.1));
    const disturbances = Math.round(2 + rand() * 8);
    const baseline = Math.round(7.5 * 3600000);
    const debt = Math.round(rand() * 3600000);
    const nap = rand() > 0.85;

    cycles.push({
      id: 1000 + i, user_id: 1, start: dateStr, end: dateStr,
      timezone_offset: '+00:00', score_state: 'SCORED',
      score: {
        recovery_score: recoveryScore / 100, sleep_performance_percentage: perfPct,
        sleep_consistency_percentage: sleepCons / 100, sleep_efficiency_percentage: sleepEff / 100,
        strain, kilojoule: Math.round(strain * 200 + rand() * 500),
        heart_rate_avg: Math.round(60 + rand() * 20), heart_rate_max: Math.round(140 + rand() * 40),
        heart_rate_min: Math.round(40 + rand() * 10), respiratory_rate: respRate,
        spo2, skin_temp_celsius: skinTemp, hrv_rmssd: hrv, hrv_sdnn: Math.round(hrv * 1.2),
        resting_heart_rate: rhr,
      },
    });

    recovery.push({
      cycle_id: 1000 + i, sleep_id: 2000 + i, user_id: 1,
      created_at: dateStr, updated_at: dateStr, score_state: 'SCORED',
      score: { user_calibrating: false, recovery_score: recoveryScore / 100, resting_heart_rate: rhr, hrv_rmssd: hrv, spo2, skin_temp_celsius: skinTemp },
    });

    const sleepStart = new Date(date); sleepStart.setHours(22, 0, 0, 0);
    const sleepEnd = new Date(sleepStart); sleepEnd.setHours(6, 0, 0, 0); sleepEnd.setDate(sleepEnd.getDate() + 1);

    sleep.push({
      id: 2000 + i, user_id: 1, created_at: dateStr, updated_at: dateStr,
      start: sleepStart.toISOString(), end: sleepEnd.toISOString(),
      timezone_offset: '+00:00', nap, score_state: 'SCORED',
      score: {
        stage_summary: {
          total_in_bed_time_milli: inBed, total_awake_time_milli: awake,
          total_no_data_time_milli: 0, total_light_sleep_time_milli: light,
          total_slow_wave_sleep_time_milli: sws, total_rem_sleep_time_milli: rem,
          sleep_cycle_count: Math.round(3 + rand() * 3), disturbance_count: disturbances,
        },
        sleep_needed: {
          baseline_milli: baseline, need_from_sleep_debt_milli: debt,
          need_from_recent_strain_milli: Math.round(strain * 60000),
          need_from_recent_nap_milli: nap ? Math.round(30 * 60000) : 0,
        },
        respiratory_rate: respRate, sleep_performance_percentage: perfPct,
        sleep_consistency_percentage: sleepCons / 100, sleep_efficiency_percentage: sleepEff / 100,
      },
    });

    // ~60% of days have workouts
    if (rand() > 0.4) {
      const workoutStart = new Date(date); workoutStart.setHours(7 + Math.floor(rand() * 12), 0, 0, 0);
      const duration = Math.round(20 + rand() * 60);
      const workoutEnd = new Date(workoutStart.getTime() + duration * 60000);
      const sportIds = [1, 2, 3, 5, 10, 17, 43, 54, 71, 121, 165, 185, 213, 357, 493];
      const wStrain = Math.round((5 + rand() * 14) * 10) / 10;

      workouts.push({
        id: 3000 + i, user_id: 1, created_at: dateStr, updated_at: dateStr,
        start: workoutStart.toISOString(), end: workoutEnd.toISOString(),
        timezone_offset: '+00:00', sport_id: sportIds[Math.floor(rand() * sportIds.length)],
        score_state: 'SCORED',
        score: {
          strain: wStrain, kilojoule: Math.round(wStrain * 150 + rand() * 300),
          average_heart_rate: Math.round(110 + rand() * 40), max_heart_rate: Math.round(150 + rand() * 30),
          percent_recorded: 100, distance_meter: Math.round(rand() * 10000),
          altitude_gain_meter: Math.round(rand() * 200), altitude_change_meter: Math.round(rand() * 400),
          zone_duration: {
            zone_zero_milli: Math.round(duration * 60000 * 0.1),
            zone_one_milli: Math.round(duration * 60000 * 0.2),
            zone_two_milli: Math.round(duration * 60000 * 0.3),
            zone_three_milli: Math.round(duration * 60000 * 0.2),
            zone_four_milli: Math.round(duration * 60000 * 0.15),
            zone_five_milli: Math.round(duration * 60000 * 0.05),
          },
        },
      });
    }
  }

  return {
    user: { user_id: 1, email: 'demo@whoop.com', first_name: 'Demo', last_name: 'Athlete' },
    cycles, recovery, sleep, workouts,
    source: 'mock',
  };
}
