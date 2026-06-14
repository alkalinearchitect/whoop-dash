import { NextRequest, NextResponse } from 'next/server';
import {
  getCycles, getRecovery, getSleep, getWorkouts, getUserProfile,
  generateMockData,
  type Cycle, type Recovery, type SleepRecord, type Workout, type User
} from '@/lib/whoop';

function getAccessToken(req: NextRequest): string | null {
  // 1. Check cookie (from OAuth flow)
  const cookieToken = req.cookies.get('whoop_access_token')?.value;
  if (cookieToken) return cookieToken;

  // 2. Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

  // 3. Check env var (server-side)
  if (process.env.WHOOP_ACCESS_TOKEN) return process.env.WHOOP_ACCESS_TOKEN;

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '30', 10);
    const token = getAccessToken(req);

    if (!token) {
      // Return mock data when no token available
      return NextResponse.json(generateMockData(limit));
    }

    // Fetch real data from WHOOP API
    const [user, cycles, recovery, sleep, workouts] = await Promise.all([
      getUserProfile(token).catch(() => null),
      getCycles(token, limit),
      getRecovery(token, limit),
      getSleep(token, limit),
      getWorkouts(token, limit),
    ]);

    return NextResponse.json({
      user,
      cycles,
      recovery,
      sleep,
      workouts,
      source: 'whoop-api',
    });
  } catch (error: any) {
    console.error('WHOOP API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch WHOOP data' },
      { status: 500 }
    );
  }
}
