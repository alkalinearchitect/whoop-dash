import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', req.url));
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID || process.env.WHOOP_CLIENT_ID;
    const clientSecret = process.env.WHOOP_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI || process.env.WHOOP_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing WHOOP OAuth env vars');
      return NextResponse.redirect(new URL('/?error=config_error', req.url));
    }

    const tokenRes = await fetch('https://api-7.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('WHOOP token exchange failed:', tokenRes.status, errText);
      return NextResponse.redirect(new URL(`/?error=token_failed&status=${tokenRes.status}`, req.url));
    }

    const tokenData = await tokenRes.json();

    const response = NextResponse.redirect(new URL('/', req.url));
    response.cookies.set('whoop_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in || 3600,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=server_error', req.url));
  }
}
