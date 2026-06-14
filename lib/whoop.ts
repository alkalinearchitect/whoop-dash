// WHOOP API v2 — Data Layer
// Base URL: https://api.whoop.com/v2
// Auth: Bearer <_REDACTED> token (OAuth2)
//
// WHOOP returns many scores as 0–1 floats; multiply by 100 for percentages.
// Recovery scores come from sleep.performance_percentage * 100.

const BASE_URL = "https://api.whoop.com/v2";

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

  /** GET /sleep — returns `limit` most-recent sleep records. */
  async getSleepRecords(limit = 30): Promise<SleepRecord[]> {
    return this.fetchAll<SleepRecord>("/sleep", {}, limit);
  }

  /** GET /activity/workout — returns `limit` most-recent workouts. */
  async getWorkouts(limit = 30): Promise<Workout[]> {
    return this.fetchAll<Workout>("/activity/workout", {}, limit);
  }
}
