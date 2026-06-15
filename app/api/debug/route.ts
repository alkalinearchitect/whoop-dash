import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('whoop_token')?.value;
  
  const allCookies = Object.fromEntries(
    cookieStore.getAll().map(c => [c.name, c.value?.substring(0, 20) + '...'])
  );

  return NextResponse.json({
    hasToken: !!token,
    tokenLength: token?.length || 0,
    cookies: allCookies,
    env: {
      hasClientId: !!process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID,
      hasClientSecret: !!process.env.WHOOP_CLIENT_SECRET,
      hasRedirectUri: !!process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI,
      redirectUri: process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI,
    }
  });
}