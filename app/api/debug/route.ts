import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    env: {
      hasClientId: !!process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID,
      hasClientSecret: !!process.env.WHOOP_CLIENT_SECRET,
      hasRedirectUri: !!process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI,
      redirectUriConfigured: !!process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI,
    },
  });
}