import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  const redirectUri = process.env.WHOOP_REDIRECT_URI || process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/?error=config&message=missing_credentials', request.url));
  }

  if (!redirectUri) {
    return NextResponse.redirect(new URL('/?error=config&message=no_redirect_uri', request.url));
  }

  try {
    const tokenRes = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    const responseText = await tokenRes.text();

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL(`/?error=token_failed&status=${tokenRes.status}`, request.url));
    }

    const tokenData = JSON.parse(responseText);
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    if (!accessToken) {
      return NextResponse.redirect(new URL('/?error=no_token', request.url));
    }

    const cookieStore = await cookies();

    cookieStore.set('whoop_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    if (refreshToken) {
      cookieStore.set('whoop_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    return NextResponse.redirect(new URL('/?connected=true', request.url));
  } catch (e: any) {
    return NextResponse.redirect(new URL(`/?error=server&message=${encodeURIComponent(e.message || 'unknown')}`, request.url));
  }
}
