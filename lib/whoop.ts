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
// Sport name map (100 WHOOP sports)
// ---------------------------------------------------------------------------

export const SPORT_NAMES: Record<number, string> = {
  1:"Running",2:"Cycling",3:"Swimming",4:"Weightlifting",5:"Yoga",
  6:"Basketball",7:"Soccer",8:"Tennis",9:"Rowing",10:"Hiking",
  11:"Boxing",12:"CrossFit",13:"HIIT",14:"Pilates",15:"Dance",
  16:"Surfing",17:"Strength Training",18:"Stretching",19:"Snowboarding",20:"Rock Climbing",
  21:"Skiing",22:"Golf",23:"Skateboarding",24:"Martial Arts",25:"Football",
  26:"Baseball",27:"Volleyball",28:"Rugby",29:"Hockey",30:"Lacrosse",
  31:"Badminton",32:"Squash",33:"Functional Fitness",34:"Table Tennis",35:"Handball",
  36:"Cricket",37:"Softball",38:"Frisbee",39:"Curling",40:"Archery",
  41:"Fencing",42:"Gymnastics",43:"Virtual Run",44:"Virtual Cycle",45:"Virtual Row",
  46:"Virtual Swim",47:"Kickboxing",48:"Barre",49:"Tai Chi",50:"Indoor Climbing",
  51:"Bouldering",52:"Trail Running",53:"Obstacle Course",54:"Outdoor Run",55:"Outdoor Walk",
  56:"Indoor Walk",57:"Indoor Run",58:"Indoor Cycle",59:"Outdoor Run",60:"Outdoor Bike",
  61:"Indoor Bike",62:"Trail Run",63:"Track Run",64:"Road Bike",65:"Mountain Bike",
  66:"BMX",67:"Triathlon",68:"Duathlon",69:"Aquathlon",70:"Swim Run",
  71:"Open Water Swim",72:"Pool Swim",73:"Water Polo",74:"Diving",75:"Synchronized Swimming",
  76:"Canoeing",77:"Kayaking",78:"Sailing",79:"Windsurfing",80:"Kitesurfing",
  81:"Paddleboarding",82:"Rafting",83:"Ice Skating",84:"Roller Skating",85:"Sledding",
  86:"Snowshoeing",87:"Cross-Country Skiing",88:"Downhill Skiing",89:"Telemark Skiing",90:"Biathlon",
  91:"Modern Pentathlon",92:"Equestrian",93:"Polo",94:"Racquetball",95:"Pickleball",
  96:"Paddleball",97:"Broomball",98:"Jai Alai",99:"Cycling (Spinning)",100:"Motor Racing",
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
  }));
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

// ===========================================================================
// ⚠️  MOCK DATA — DEVELOPMENT ONLY — NOT USED IN PRODUCTION
// ===========================================================================
// Explicitly call generateMockData() for local dev. Fetch wrappers NEVER
// fall back to this. All fake data uses seeded PRNG (seed=42).
// ===========================================================================

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

export interface MockData {
  profile: WhoopProfile; cycles: WhoopCycle[]; recovery: WhoopRecovery[];
  sleep: WhoopSleep[]; workouts: WhoopWorkout[]; source: "mock"; fetched_at: string;
}

export function generateMockData(limit: number): MockData {
  const rand = seededRandom(42);
  const now = new Date();
  const cycles: WhoopCycle[] = [];
  const recovery: WhoopRecovery[] = [];
  const sleep: WhoopSleep[] = [];
  const workouts: WhoopWorkout[] = [];

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

    cycles.push({ id: 1000 + i, user_id: 1, start: ds, end: ds, timezone_offset: "+00:00", score_state: "SCORED",
      score: { recovery_score: Math.round(rs * 10000) / 10000, strain: st, sleep_performance_percentage: Math.round(pp * 10000) / 10000,
        sleep_consistency_percentage: Math.round(sc * 10000) / 10000, sleep_efficiency_percentage: Math.round(se * 10000) / 10000,
        kilojoule: Math.round(st * 200 + rand() * 500), heart_rate_avg: Math.round(58 + rand() * 18),
        heart_rate_max: Math.round(135 + rand() * 35), heart_rate_min: Math.round(42 + rand() * 10),
        respiratory_rate: rr, spo2: sp, skin_temp_celsius: sk, hrv_rmssd: hrv,
        hrv_sdnn: Math.round(hrv * (1.1 + rand() * 0.3)), resting_heart_rate: rhr } });

    recovery.push({ cycle_id: 1000 + i, sleep_id: 2000 + i, user_id: 1, created_at: ds, updated_at: ds, score_state: "SCORED",
      score: { user_calibrating: false, recovery_score: Math.round(rs * 10000) / 10000, resting_heart_rate: rhr, hrv_rmssd: hrv, spo2: sp, skin_temp_celsius: sk, respiratory_rate: rr } });

    const s1 = new Date(d); s1.setHours(22, 0, 0, 0);
    const s2 = new Date(s1); s2.setHours(6, 0, 0, 0); s2.setDate(s2.getDate() + 1);

    sleep.push({ id: 2000 + i, user_id: 1, created_at: ds, updated_at: ds, start: s1.toISOString(), end: s2.toISOString(),
      timezone_offset: "+00:00", nap, score_state: "SCORED",
      score: { stage_summary: { total_in_bed_time_milli: ib, total_awake_time_milli: Math.round(ib * (0.05 + rand() * 0.10)),
          total_no_data_time_milli: 0, total_light_sleep_time_milli: Math.round(ib * (0.40 + rand() * 0.15)),
          total_slow_wave_sleep_time_milli: Math.round(ib * (0.10 + rand() * 0.10)),
          total_rem_sleep_time_milli: Math.round(ib * (0.15 + rand() * 0.15)),
          sleep_cycle_count: Math.round(3 + rand() * 3), disturbance_count: Math.round(1 + rand() * 7) },
        sleep_needed: { baseline_milli: Math.round(7.5 * 3600000), need_from_sleep_debt_milli: Math.round(rand() * 2 * 3600000),
          need_from_recent_strain_milli: Math.round(st * 60000), need_from_recent_nap_milli: nap ? Math.round(30 * 60000) : 0 },
        respiratory_rate: rr, sleep_performance_percentage: Math.round(pp * 10000) / 10000,
        sleep_consistency_percentage: Math.round(sc * 10000) / 10000, sleep_efficiency_percentage: Math.round(se * 10000) / 10000 } });

    if (rand() > 0.4) {
      const ws = new Date(d); ws.setHours(7 + Math.floor(rand() * 12), 0, 0, 0);
      const dur = Math.round(20 + rand() * 60);
      const we = new Date(ws.getTime() + dur * 60000);
      const si = [1, 2, 3, 5, 10, 17, 43, 54, 71, 121, 165, 185, 213, 357, 493];
      const wsStrain = Math.round((5 + rand() * 14) * 10) / 10;
      workouts.push({ id: 3000 + i, user_id: 1, created_at: ds, updated_at: ds, start: ws.toISOString(), end: we.toISOString(),
        timezone_offset: "+00:00", sport_id: si[Math.floor(rand() * si.length)], score_state: "SCORED",
        score: { strain: wsStrain, kilojoule: Math.round(wsStrain * 150 + rand() * 300),
          average_heart_rate: Math.round(110 + rand() * 40), max_heart_rate: Math.round(150 + rand() * 30),
          percent_recorded: 100, distance_meter: Math.round(rand() * 10000),
          altitude_gain_meter: Math.round(rand() * 200), altitude_change_meter: Math.round(rand() * 400),
          zone_duration: { zone_zero_milli: Math.round(dur * 60000 * 0.1), zone_one_milli: Math.round(dur * 60000 * 0.2),
            zone_two_milli: Math.round(dur * 60000 * 0.3), zone_three_milli: Math.round(dur * 60000 * 0.2),
            zone_four_milli: Math.round(dur * 60000 * 0.15), zone_five_milli: Math.round(dur * 60000 * 0.05) } } });
    }
  }

  return {
    profile: { user_id: 1, email: "demo@whoop.com", first_name: "Demo", last_name: "Athlete" },
    cycles, recovery, sleep, workouts, source: "mock", fetched_at: new Date().toISOString(),
  };
}
