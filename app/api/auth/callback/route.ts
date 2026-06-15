import { NextRequest, NextResponse } from 'next/server';

function redirectWithError(request: NextRequest, error: string, message?: string) {
  const url = new URL('/', request.url);
  url.searchParams.set('error', error);
  if (message) url.searchParams.set('message', message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');
  const state = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get('whoop_oauth_state')?.value;

  if (error) {
    return redirectWithError(request, error);
  }

  if (!code) {
    return redirectWithError(request, 'no_code');
  }

  if (!state || !expectedState || state !== expectedState) {
    return redirectWithError(request, 'state_mismatch');
  }

  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  const redirectUri = process.env.WHOOP_REDIRECT_URI || process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    return redirectWithError(request, 'config', 'missing_credentials');
  }

  if (!redirectUri) {
    return redirectWithError(request, 'config', 'no_redirect_uri');
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
      return redirectWithError(request, 'token_failed', `status_${tokenRes.status}`);
    }

    const tokenData = JSON.parse(responseText);
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    if (!accessToken) {
      return redirectWithError(request, 'no_token');
    }

    const response = NextResponse.redirect(new URL('/?connected=true', request.url));

    response.cookies.set('whoop_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    if (refreshToken) {
      response.cookies.set('whoop_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    response.cookies.delete('whoop_oauth_state');

    return response;
  } catch (e: any) {
    return redirectWithError(request, 'server', e.message || 'unknown');
  }
}
