import { NextRequest, NextResponse } from 'next/server';

type WhoopRecord = { score_state?: string };

function scored<T extends WhoopRecord>(records: T[] | undefined): T[] {
  return (records || []).filter((record) => record.score_state === 'SCORED');
}

export async function GET(req: NextRequest) {
  const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('limit') || '30', 10) || 30, 1), 90);
  const token = req.cookies.get('whoop_token')?.value || process.env.WHOOP_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json({
      authenticated: false,
      error: 'WHOOP login required. No demo data is shown.',
    }, { status: 401 });
  }

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const [userRes, cyclesRes, recoveryRes, sleepRes, workoutsRes] = await Promise.all([
      fetch('https://api.prod.whoop.com/developer/v2/user/profile', { headers }),
      fetch(`https://api.prod.whoop.com/developer/v2/cycle?limit=${limit}`, { headers }),
      fetch(`https://api.prod.whoop.com/developer/v2/recovery?limit=${limit}`, { headers }),
      fetch(`https://api.prod.whoop.com/developer/v2/activity/sleep?limit=${limit}`, { headers }),
      fetch(`https://api.prod.whoop.com/developer/v2/activity/workout?limit=${limit}`, { headers }),
    ]);

    if (!cyclesRes.ok) {
      return NextResponse.json({
        authenticated: true,
        error: `WHOOP cycle request failed: ${cyclesRes.status}`,
      }, { status: 502 });
    }

    const [user, cyclesPayload, recoveryPayload, sleepPayload, workoutsPayload] = await Promise.all([
      userRes.ok ? userRes.json() : Promise.resolve(null),
      cyclesRes.json(),
      recoveryRes.ok ? recoveryRes.json() : Promise.resolve({ records: [] }),
      sleepRes.ok ? sleepRes.json() : Promise.resolve({ records: [] }),
      workoutsRes.ok ? workoutsRes.json() : Promise.resolve({ records: [] }),
    ]);

    const cycles = scored<CycleLike>(cyclesPayload?.records);
    const recovery = scored<WhoopRecord>(recoveryPayload?.records);
    const sleep = scored<WhoopRecord>(sleepPayload?.records);
    const workouts = scored<WhoopRecord>(workoutsPayload?.records);

    return NextResponse.json({
      authenticated: true,
      user,
      cycles,
      recovery,
      sleep,
      workouts,
      source: 'whoop-api',
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: true,
      error: error instanceof Error ? error.message : 'WHOOP sync failed',
    }, { status: 502 });
  }
}

interface CycleLike extends WhoopRecord {}
