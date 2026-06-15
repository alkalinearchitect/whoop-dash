import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID || process.env.WHOOP_CLIENT_ID || '';
  const redirectUri = process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI || process.env.WHOOP_REDIRECT_URI || '';

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'WHOOP OAuth not configured' }, { status: 500 });
  }

  const state = crypto.randomUUID();
  const scope = 'read:recovery read:cycles read:sleep read:workout read:profile';
  const oauthUrl = `https://api.prod.whoop.com/oauth/oauth2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;

  const response = NextResponse.redirect(oauthUrl);
  response.cookies.set('whoop_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });

  return response;
}
