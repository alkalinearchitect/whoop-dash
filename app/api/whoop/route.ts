import { NextRequest, NextResponse } from 'next/server';
import { getCycles, getRecovery, getSleep, getWorkouts, getUserProfile, generateMockData } from '@/lib/whoop';

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '30', 10);

    // Try to get token from cookie first (set by OAuth callback)
    const token = req.cookies.get('whoop_token')?.value
      || process.env.WHOOP_ACCESS_TOKEN;

    if (!token) {
      // Return mock data with proper structure
      const mock = generateMockData(limit);
      return NextResponse.json(mock);
    }

    // Fetch real WHOOP data
    const [user, cycles, recovery, sleep, workouts] = await Promise.all([
      getUserProfile(token).catch(() => null),
      getCycles(token, limit).catch(() => []),
      getRecovery(token, limit).catch(() => []),
      getSleep(token, limit).catch(() => []),
      getWorkouts(token, limit).catch(() => []),
    ]);

    return NextResponse.json({
      user,
      cycles,
      recovery,
      sleep,
      workouts,
      source: 'whoop-api',
      fetched_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('WHOOP API error:', error);
    // Fallback to mock on any error
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '30', 10);
    const mock = generateMockData(limit);
    return NextResponse.json(mock);
  }
}
