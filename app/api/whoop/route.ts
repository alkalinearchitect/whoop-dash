import { NextRequest, NextResponse } from 'next/server';

type WhoopRecord = { score_state?: string };

function scored<T extends WhoopRecord>(records: T[] | undefined): T[] {
  return (records || []).filter((record) => record.score_state === 'SCORED');
}

async function fetchWhoopJson(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`WHOOP request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  const limit = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get('limit') || '30', 10) || 30, 1),
    90,
  );
  const token = req.cookies.get('whoop_token')?.value || process.env.WHOOP_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json(
      { authenticated: false, error: 'WHOOP login required' },
      { status: 401 },
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    // Fetch core endpoints — these must succeed
    const [userRes, cyclesRes, recoveryRes, sleepRes, workoutsRes] = await Promise.all([
      fetch('https://api.prod.whoop.com/developer/v2/user/profile', { headers }),
      fetch(`https://api.prod.whoop.com/developer/v2/cycle?limit=${limit}`, { headers }),
      fetch(`https://api.prod.whoop.com/developer/v2/recovery?limit=${limit}`, { headers }),
      fetch(`https://api.prod.whoop.com/developer/v2/activity/sleep?limit=${limit}`, { headers }),
      fetch(`https://api.prod.whoop.com/developer/v2/activity/workout?limit=${limit}`, { headers }),
    ]);

    if (!userRes.ok) {
      throw new Error(`WHOOP profile request failed: ${userRes.status}`);
    }
    if (!cyclesRes.ok) {
      throw new Error(`WHOOP cycle request failed: ${cyclesRes.status}`);
    }
    if (!recoveryRes.ok) {
      throw new Error(`WHOOP recovery request failed: ${recoveryRes.status}`);
    }
    if (!sleepRes.ok) {
      throw new Error(`WHOOP sleep request failed: ${sleepRes.status}`);
    }
    if (!workoutsRes.ok) {
      throw new Error(`WHOOP workout request failed: ${workoutsRes.status}`);
    }

    const [userRaw, cyclesPayload, recoveryPayload, sleepPayload, workoutsPayload] =
      await Promise.all([
        userRes.json(),
        cyclesRes.json(),
        recoveryRes.json(),
        sleepRes.json(),
        workoutsRes.json(),
      ]);

    // Fetch optional endpoints — 404 means not available for this member
    const [healthspanRaw, bloodPressureRaw, vo2maxRaw, labsRaw] = await Promise.all([
      fetchWhoopJson('https://api.prod.whoop.com/developer/v2/user/healthspan', headers),
      fetchWhoopJson('https://api.prod.whoop.com/developer/v2/user/blood-pressure', headers),
      fetchWhoopJson('https://api.prod.whoop.com/developer/v2/user/vo2max', headers),
      fetchWhoopJson('https://api.prod.whoop.com/developer/v2/user/labs', headers),
    ]);

    // Shape user — only the fields we need
    const user = userRaw
      ? {
          first_name: userRaw.first_name ?? null,
          last_name: userRaw.last_name ?? null,
          email: userRaw.email ?? null,
        }
      : null;

    // Filter all records to SCORED only
    const cycles = scored(cyclesPayload?.records);
    const recovery = scored(recoveryPayload?.records);
    const sleep = scored(sleepPayload?.records);
    const workouts = scored(workoutsPayload?.records);

    // Shape optional data — null if WHOOP didn't return it
    const healthspan = healthspanRaw
      ? {
          whoop_age: healthspanRaw.whoop_age ?? null,
          pace_of_aging: healthspanRaw.pace_of_aging ?? null,
          biological_age: healthspanRaw.biological_age ?? null,
          chronological_age: healthspanRaw.chronological_age ?? null,
        }
      : null;

    const blood_pressure = bloodPressureRaw
      ? {
          systolic: bloodPressureRaw.systolic ?? null,
          diastolic: bloodPressureRaw.diastolic ?? null,
        }
      : null;

    const vo2max = vo2maxRaw
      ? {
          value: vo2maxRaw.value ?? null,
          percentile: vo2maxRaw.percentile ?? null,
        }
      : null;

    const labs = labsRaw
      ? {
          biomarker_count: labsRaw.biomarker_count ?? null,
          last_test_date: labsRaw.last_test_date ?? null,
        }
      : null;

    return NextResponse.json({
      authenticated: true,
      user,
      cycles,
      recovery,
      sleep,
      workouts,
      healthspan,
      blood_pressure,
      vo2max,
      labs,
      source: 'whoop-api',
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        authenticated: true,
        error: error instanceof Error ? error.message : 'WHOOP sync failed',
      },
      { status: 502 },
    );
  }
}
