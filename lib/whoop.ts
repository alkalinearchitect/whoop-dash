// WHOOP API v2 — Data Layer
// Base URL: https://api-7.whoop.com/v2/
// Auth: Bearer <token> via OAuth2
// WHOOP returns many scores as 0–1 floats; multiply by 100 for percentages.

// ---------------------------------------------------------------------------
// WHOOP API v2 Types
// ---------------------------------------------------------------------------

export interface WhoopCycle {
  id: number; user_id: number; start: string; end: string;
  timezone_offset: string; score_state: string;
  score: {
    recovery_score: number | null; strain: number | null;
    sleep_performance_percentage: number | null;
    sleep_consistency_percentage: number | null;
    sleep_efficiency_percentage: number | null;
    kilojoule: number | null; heart_rate_avg: number | null;
    heart_rate_max: number | null; heart_rate_min: number | null;
    respiratory_rate: number | null; spo2: number | null;
    skin_temp_celsius: number | null; hrv_rmssd: number | null;
    hrv_sdnn: number | null; resting_heart_rate: number | null;
  } | null;
}

export interface WhoopSleep {
  id: number; user_id: number; created_at: string; updated_at: string;
  start: string; end: string; timezone_offset: string; nap: boolean;
  score_state: string;
  score: {
    stage_summary: {
      total_in_bed_time_milli: number; total_awake_time_milli: number;
      total_no_data_time_milli: number; total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number; total_rem_sleep_time_milli: number;
      sleep_cycle_count: number; disturbance_count: number;
    } | null;
    sleep_needed: {
      baseline_milli: number; need_from_sleep_debt_milli: number;
      need_from_recent_strain_milli: number; need_from_recent_nap_milli: number;
    } | null;
    respiratory_rate: number | null; sleep_performance_percentage: number | null;
    sleep_consistency_percentage: number | null; sleep_efficiency_percentage: number | null;
  } | null;
}

export interface WhoopStrain {
  id: number; user_id: number; start: string; end: string;
  timezone_offset: string; score_state: string;
  score: {
    strain: number | null; kilojoule: number | null;
    average_heart_rate: number | null; max_heart_rate: number | null;
    percent_recorded: number | null; distance_meter: number | null;
    altitude_gain_meter: number | null; altitude_change_meter: number | null;
    zone_duration: {
      zone_zero_milli: number | null; zone_one_milli: number | null;
      zone_two_milli: number | null; zone_three_milli: number | null;
      zone_four_milli: number | null; zone_five_milli: number | null;
    } | null;
  } | null;
}

export interface WhoopWorkout {
  id: number; user_id: number; created_at: string; updated_at: string;
  start: string; end: string; timezone_offset: string; sport_id: number;
  score_state: string;
  score: {
    strain: number | null; kilojoule: number | null;
    average_heart_rate: number | null; max_heart_rate: number | null;
    percent_recorded: number | null; distance_meter: number | null;
    altitude_gain_meter: number | null; altitude_change_meter: number | null;
    zone_duration: {
      zone_zero_milli: number | null; zone_one_milli: number | null;
      zone_two_milli: number | null; zone_three_milli: number | null;
      zone_four_milli: number | null; zone_five_milli: number | null;
    } | null;
  } | null;
}

export interface WhoopRecovery {
  cycle_id: number; sleep_id: number; user_id: number;
  created_at: string; updated_at: string; score_state: string;
  score: {
    user_calibrating: boolean; recovery_score: number | null;
    resting_heart_rate: number | null; hrv_rmssd: number | null;
    spo2: number | null; skin_temp_celsius: number | null;
    respiratory_rate: number | null;
  } | null;
}

export interface WhoopProfile {
  user_id: number; email: string; first_name: string; last_name: string;
}

export interface WhoopRecords<T> { records: T[]; next_token: string | null }

// ---------------------------------------------------------------------------
// 2027 WHOOP Feature Types (not yet in public API — fetch returns null)
// ---------------------------------------------------------------------------

export interface WhoopHealthspan {
  whoop_age: number;
  pace_of_aging: number;
  biological_age: number;
  chronological_age: number;
  metrics: {
    vo2max: number;
    resting_heart_rate: number;
    sleep_consistency: number;
    strength_activity: number;
  };
}

export interface WhoopBloodPressure {
  systolic: number;
  diastolic: number;
  trend: 'rising' | 'falling' | 'stable';
}

export interface WhoopVo2max {
  value: number;
  percentile: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface WhoopLabs {
  biomarker_count: number;
  last_test_date: string;
  panels: {
    name: string;
    biomarkers: number;
    date: string;
  }[];
}

// ---------------------------------------------------------------------------
// Sport name map (200+ WHOOP sports — IDs beyond known set fall back to "Sport {id}")
// ---------------------------------------------------------------------------

export const SPORT_NAMES: Record<number, string> = {
  1: "Running", 2: "Cycling", 3: "Swimming", 4: "Weightlifting", 5: "Yoga",
  6: "Basketball", 7: "Soccer", 8: "Tennis", 9: "Rowing", 10: "Hiking",
  11: "Boxing", 12: "CrossFit", 13: "HIIT", 14: "Pilates", 15: "Dance",
  16: "Surfing", 17: "Strength Training", 18: "Stretching", 19: "Snowboarding", 20: "Rock Climbing",
  21: "Skiing", 22: "Golf", 23: "Skateboarding", 24: "Martial Arts", 25: "Football",
  26: "Baseball", 27: "Volleyball", 28: "Rugby", 29: "Hockey", 30: "Lacrosse",
  31: "Badminton", 32: "Squash", 33: "Functional Fitness", 34: "Table Tennis", 35: "Handball",
  36: "Cricket", 37: "Softball", 38: "Frisbee", 39: "Curling", 40: "Archery",
  41: "Fencing", 42: "Gymnastics", 43: "Virtual Run", 44: "Virtual Cycle", 45: "Virtual Row",
  46: "Virtual Swim", 47: "Kickboxing", 48: "Barre", 49: "Tai Chi", 50: "Indoor Climbing",
  51: "Bouldering", 52: "Trail Running", 53: "Obstacle Course Race", 54: "Outdoor Run", 55: "Outdoor Walk",
  56: "Indoor Walk", 57: "Indoor Run", 58: "Indoor Cycle", 59: "Outdoor Run (GPS)", 60: "Outdoor Bike",
  61: "Indoor Bike", 62: "Trail Run", 63: "Track Run", 64: "Road Bike", 65: "Mountain Bike",
  66: "BMX", 67: "Triathlon", 68: "Duathlon", 69: "Aquathlon", 70: "Swim Run",
  71: "Open Water Swim", 72: "Pool Swim", 73: "Water Polo", 74: "Diving", 75: "Synchronized Swimming",
  76: "Canoeing", 77: "Kayaking", 78: "Sailing", 79: "Windsurfing", 80: "Kitesurfing",
  81: "Paddleboarding", 82: "Rafting", 83: "Ice Skating", 84: "Roller Skating", 85: "Sledding",
  86: "Snowshoeing", 87: "Cross-Country Skiing", 88: "Downhill Skiing", 89: "Telemark Skiing", 90: "Biathlon",
  91: "Modern Pentathlon", 92: "Equestrian", 93: "Polo", 94: "Racquetball", 95: "Pickleball",
  96: "Paddleball", 97: "Broomball", 98: "Jai Alai", 99: "Spinning", 100: "Motor Racing",
  // Extended placeholder range for WHOOP sport IDs 101–200
  101: "Motocross", 102: "Auto Racing", 103: "Ski Jumping", 104: "Snowmobile",
  105: "Skeleton", 106: "Luge", 107: "Bobsled", 108: "Baton Twirling",
  109: "Cheerleading", 110: "Dodgeball", 111: "Futsal", 112: "Padel",
  113: "Platform Tennis", 114: "Slacklining", 115: "Trampoline",
  116: "Parkour", 117: "Mountainboarding", 118: "Sandboarding", 119: "Wakesurfing",
  120: "Wakeboarding", 121: "Bodyboarding", 122: "Cliff Diving",
  123: "Underwater Hockey", 124: "Underwater Rugby", 125: "Speed Skating",
  126: "Short Track Speed Skating", 127: "Figure Skating", 128: "Roller Derby",
  129: "Ice Hockey (Sledge)", 130: "Wheelchair Basketball", 131: "Wheelchair Tennis",
  132: "Wheelchair Rugby", 133: "Powerlifting", 134: "Strongman",
  135: "Arm Wrestling", 136: "Axe Throwing", 137: "Knife Throwing",
  138: "Disc Golf", 139: "Flying Disc", 140: "Ultimate Frisbee",
  141: "Bocce", 142: "Shuffleboard", 143: "Horseshoe Pitching",
  144: "Lawn Bowling", 145: "Croquet", 146: "Caber Toss",
  147: "Highland Games", 148: "Log Rolling", 149: "Tug of War",
  150: "Orienteering", 151: "Rogaining", 152: "Geocaching (Sport)",
  153: "Adventure Racing", 154: "Sprint Orienteering", 155: "Canoe Polo",
  156: "Canoe Sprint", 157: "Canoe Slalom", 158: "Ocean Racing",
  159: "Stand Up Paddleboard Racing", 160: "Surf Kayaking",
  161: "Freediving", 162: "Spearfishing (Sport)", 163: "Swim Cross-Training",
  164: "Aquathlon (Long)", 165: "Quadrathlon", 166: "Tetrathlon",
  167: "Run-Bike-Run", 168: "Winter Triathlon", 169: "Cross Triathlon",
  170: "Indoor Triathlon", 171: "Ski Mountaineering", 172: "Rugby Sevens",
  173: "Touch Rugby", 174: "Flag Football", 175: "Arena Football",
  176: "Indoor Soccer", 177: "Beach Soccer", 178: "Beach Volleyball",
  179: "Sand Volleyball", 180: "Sepak Takraw",
  181: "Footvolley", 182: "Jorkyball", 183: "Rollball",
  184: "Speedball", 185: "Wallball", 186: "Racquet Sport (Other)",
  187: "Basque Pelota", 188: "Frontenis", 189: "Xare",
  190: "Valencian Pilota", 191: "Chaza", 192: "Tamburello",
  193: "Tambourine Tennis", 194: "Matkot", 195: "Beach Tennis",
  196: "Paddle Tennis", 197: "Platform Tennis (Outdoor)", 198: "Hybrid Sport",
  199: "Multi-Sport", 200: "General Athletic Training",
};

export const getSportName = (id: number) => SPORT_NAMES[id] ?? `Sport ${id}`;

// ---------------------------------------------------------------------------
// WHOOP API v2 fetch wrappers — throw on error, never fall back to mock
// ---------------------------------------------------------------------------

const BASE = "https://api-7.whoop.com/v2";
const auth = (t: string) => ({ Authorization: `Bearer ${t}`, "Content-Type": "application/json" });

async function paginate<T>(url: string, token: string): Promise<T[]> {
  const all: T[] = [];
  let next: string | null = null;
  do {
    const u = next ? `${url}&nextToken=${encodeURIComponent(next)}` : url;
    const r = await fetch(u, { headers: auth(token) });
    if (!r.ok) throw new Error(`WHOOP API ${r.status}: ${await r.text().catch(() => r.statusText)}`);
    const j = (await r.json()) as WhoopRecords<T>;
    all.push(...j.records);
    next = j.next_token;
  } while (next);
  return all;
}

const dateParams = (s?: string, e?: string) =>
  `${s ? `&start=${encodeURIComponent(s)}` : ""}${e ? `&end=${encodeURIComponent(e)}` : ""}`;

export async function fetchWhoopCycles(t: string, s?: string, e?: string): Promise<WhoopCycle[]> {
  return paginate<WhoopCycle>(`${BASE}/cycle?limit=25${dateParams(s, e)}`, t);
}

export async function fetchWhoopSleep(t: string, s?: string, e?: string): Promise<WhoopSleep[]> {
  return paginate<WhoopSleep>(`${BASE}/activity/sleep?limit=25${dateParams(s, e)}`, t);
}

export async function fetchWhoopStrain(t: string, s?: string, e?: string): Promise<WhoopStrain[]> {
  const cycles = await paginate<WhoopCycle>(`${BASE}/cycle?limit=25${dateParams(s, e)}`, t);
  return cycles.map((c) => ({
    id: c.id, user_id: c.user_id, start: c.start, end: c.end,
    timezone_offset: c.timezone_offset, score_state: c.score_state,
    score: c.score ? {
      strain: c.score.strain, kilojoule: c.score.kilojoule,
      average_heart_rate: c.score.heart_rate_avg, max_heart_rate: c.score.heart_rate_max,
      percent_recorded: null, distance_meter: null,
      altitude_gain_meter: null, altitude_change_meter: null, zone_duration: null,
    } : null,
  })) as WhoopStrain[];
}

export async function fetchWhoopWorkouts(t: string, s?: string, e?: string): Promise<WhoopWorkout[]> {
  return paginate<WhoopWorkout>(`${BASE}/activity/workout?limit=25${dateParams(s, e)}`, t);
}

export async function fetchWhoopRecovery(t: string, cycleId: number): Promise<WhoopRecovery> {
  const r = await fetch(`${BASE}/cycle/${cycleId}/recovery`, { headers: auth(t) });
  if (!r.ok) throw new Error(`WHOOP API ${r.status}: ${await r.text().catch(() => r.statusText)}`);
  return r.json() as Promise<WhoopRecovery>;
}

export async function fetchWhoopProfile(t: string): Promise<WhoopProfile> {
  const r = await fetch(`${BASE}/user/profile/basic`, { headers: auth(t) });
  if (!r.ok) throw new Error(`WHOOP API ${r.status}: ${await r.text().catch(() => r.statusText)}`);
  return r.json() as Promise<WhoopProfile>;
}

// ---------------------------------------------------------------------------
// 2027 WHOOP Feature Fetches (graceful — return null if endpoint unavailable)
// ---------------------------------------------------------------------------

async function tryFetch<T>(url: string, token: string): Promise<T | null> {
  const r = await fetch(url, { headers: auth(token) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`WHOOP API ${r.status}: ${await r.text().catch(() => r.statusText)}`);
  return r.json() as Promise<T>;
}

export async function fetchWhoopHealthspan(token: string): Promise<WhoopHealthspan | null> {
  return tryFetch<WhoopHealthspan>(`${BASE}/user/healthspan`, token);
}

export async function fetchWhoopBloodPressure(token: string): Promise<WhoopBloodPressure | null> {
  return tryFetch<WhoopBloodPressure>(`${BASE}/user/blood-pressure`, token);
}

export async function fetchWhoopVo2max(token: string): Promise<WhoopVo2max | null> {
  return tryFetch<WhoopVo2max>(`${BASE}/user/vo2max`, token);
}

export async function fetchWhoopLabs(token: string): Promise<WhoopLabs | null> {
  return tryFetch<WhoopLabs>(`${BASE}/user/labs`, token);
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/**
 * Return ISO start/end strings for the last N days (inclusive of today).
 * end = end of today (23:59:59.999Z)
 * start = end - (days - 1) days, set to midnight (00:00:00.000Z)
 */
export function getDayRange(days: number): { start: string; end: string } {
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * Format a 0–1 float as a percentage string (e.g. "85%").
 * Returns "—" for null or undefined.
 */
export function pct(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

/**
 * Format milliseconds to hours + minutes (e.g. "7h 23m").
 * Returns "—" for null or undefined.
 */
export function fmtMs(millis: number | null | undefined): string {
  if (millis == null) return "—";
  const totalMinutes = Math.floor(millis / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}


// ---------------------------------------------------------------------------
// MOCK DATA GENERATION — for demo/unauthenticated use
// ---------------------------------------------------------------------------

export interface MockDashboardData {
  profile: WhoopProfile;
  cycles: WhoopCycle[];
  sleep: WhoopSleep[];
  workouts: WhoopWorkout[];
  recovery: WhoopRecovery[];
  source: 'mock';
  fetched_at: string;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

export function generateMockData(limit: number = 30): MockDashboardData {
  const rand = seededRandom(42);
  const now = new Date();
  const cycles: WhoopCycle[] = [];
  const sleep: WhoopSleep[] = [];
  const workouts: WhoopWorkout[] = [];
  const recovery: WhoopRecovery[] = [];

  for (let i = 0; i < limit; i++) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const ds = d.toISOString();
    const rs = 0.25 + rand() * 0.70;
    const st = Math.round((4 + rand() * 16) * 10) / 10;
    const hrv = Math.round(30 + rand() * 40);
    const rhr = Math.round(45 + rand() * 20);
    const sp = Math.round((94 + rand() * 5) * 10) / 10;
    const sk = Math.round((33 + rand() * 3) * 10) / 10;
    const rr = Math.round((12 + rand() * 6) * 100) / 100;
    const se = 0.70 + rand() * 0.25;
    const sc = 0.50 + rand() * 0.45;
    const pp = 0.50 + rand() * 0.45;
    const ib = Math.round((6 + rand() * 3) * 3600000);
    const nap = rand() > 0.85;

    cycles.push({
      id: 1000 + i, user_id: 1, start: ds, end: ds, timezone_offset: '+00:00', score_state: 'SCORED',
      score: {
        recovery_score: Math.round(rs * 10000) / 10000, strain: st,
        sleep_performance_percentage: Math.round(pp * 10000) / 10000,
        sleep_consistency_percentage: Math.round(sc * 10000) / 10000,
        sleep_efficiency_percentage: Math.round(se * 10000) / 10000,
        kilojoule: Math.round(st * 200 + rand() * 500),
        heart_rate_avg: Math.round(58 + rand() * 18),
        heart_rate_max: Math.round(135 + rand() * 35),
        heart_rate_min: Math.round(42 + rand() * 10),
        respiratory_rate: rr, spo2: sp, skin_temp_celsius: sk,
        hrv_rmssd: hrv, hrv_sdnn: Math.round(hrv * (1.1 + rand() * 0.3)),
        resting_heart_rate: rhr
      }
    });

    recovery.push({
      cycle_id: 1000 + i, sleep_id: 2000 + i, user_id: 1,
      created_at: ds, updated_at: ds, score_state: 'SCORED',
      score: {
        user_calibrating: false, recovery_score: Math.round(rs * 10000) / 10000,
        resting_heart_rate: rhr, hrv_rmssd: hrv, spo2: sp,
        skin_temp_celsius: sk, respiratory_rate: rr
      }
    });

    const s1 = new Date(d); s1.setHours(22, 0, 0, 0);
    const s2 = new Date(d); s2.setHours(6, 30, 0, 0);
    sleep.push({
      id: 2000 + i, user_id: 1, created_at: ds, updated_at: ds,
      start: s1.toISOString(), end: s2.toISOString(),
      timezone_offset: '+00:00', nap, score_state: 'SCORED',
      score: {
        stage_summary: {
          total_in_bed_time_milli: ib,
          total_awake_time_milli: Math.round(ib * 0.05),
          total_no_data_time_milli: Math.round(ib * 0.01),
          total_light_sleep_time_milli: Math.round(ib * 0.45),
          total_slow_wave_sleep_time_milli: Math.round(ib * 0.25),
          total_rem_sleep_time_milli: Math.round(ib * 0.24),
          sleep_cycle_count: Math.floor(4 + rand() * 3),
          disturbance_count: Math.floor(rand() * 5)
        },
        sleep_needed: {
          baseline_milli: Math.round(8 * 3600000),
          need_from_sleep_debt_milli: Math.round(rand() * 3600000),
          need_from_recent_strain_milli: Math.round(st * 120000),
          need_from_recent_nap_milli: nap ? Math.round(900000) : 0
        },
        respiratory_rate: rr,
        sleep_performance_percentage: pp,
        sleep_consistency_percentage: sc,
        sleep_efficiency_percentage: se
      }
    });

    // Add workouts for some days
    if (rand() > 0.6) {
      const wStart = new Date(d); wStart.setHours(7 + Math.floor(rand() * 12), 0, 0, 0);
      const wEnd = new Date(wStart); wEnd.setMinutes(wEnd.getMinutes() + Math.floor(30 + rand() * 60));
      workouts.push({
        id: 3000 + i, user_id: 1, start: wStart.toISOString(), end: wEnd.toISOString(),
        created_at: wStart.toISOString(), updated_at: wEnd.toISOString(),
        timezone_offset: '+00:00', sport_id: 1, score_state: 'SCORED',
        score: {
          strain: st * (0.8 + rand() * 0.4), kilojoule: Math.round(200 + rand() * 800),
          average_heart_rate: Math.round(110 + rand() * 40),
          max_heart_rate: Math.round(150 + rand() * 30),
          percent_recorded: 98 + rand() * 2,
          distance_meter: rand() > 0.5 ? Math.round(3000 + rand() * 7000) : null,
          altitude_gain_meter: Math.round(rand() * 500),
          altitude_change_meter: Math.round(rand() * 200),
          zone_duration: {
            zone_zero_milli: Math.round(rand() * 300000),
            zone_one_milli: Math.round(rand() * 600000),
            zone_two_milli: Math.round(rand() * 600000),
            zone_three_milli: Math.round(rand() * 600000),
            zone_four_milli: Math.round(rand() * 300000),
            zone_five_milli: Math.round(rand() * 180000),
          }
        }
      });
    }
  }

  return {
    profile: { user_id: 1, email: 'demo@whoop.com', first_name: 'Athlete', last_name: 'Demo' },
    cycles, sleep, workouts, recovery,
    source: 'mock', fetched_at: new Date().toISOString()
  };
}
