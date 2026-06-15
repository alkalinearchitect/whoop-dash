import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const allParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const state = request.nextUrl.searchParams.get('state');
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  console.log('OAuth callback received:', { state, hasCode: !!code, error });

  if (error) {
    console.error('OAuth error from WHOOP:', error);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    console.error('No code in callback');
    const debugUrl = request.nextUrl.toString();
    return NextResponse.redirect(new URL(`/?error=no_code&url=${encodeURIComponent(debugUrl)}`, request.url));
  }

  // Use the correct environment variables - the server-side ones for the token exchange
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  // Use the same redirect URI that was used in the OAuth initiation
  const redirectUri = process.env.WHOOP_REDIRECT_URI || process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI;

  console.log('Token exchange config:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    redirectUri,
    nodeEnv: process.env.NODE_ENV,
  });

  if (!clientId || !clientSecret) {
    console.error('Missing WHOOP OAuth credentials');
    return NextResponse.redirect(new URL('/?error=config&message=missing_credentials', request.url));
  }

  if (!redirectUri) {
    console.error('Missing redirect URI');
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
      console.error('Token exchange failed:', {
        status: tokenRes.status,
        body: responseText.substring(0, 500),
      });
      // Include error details in redirect for debugging
      return NextResponse.redirect(new URL(`/?error=token_failed&status=${tokenRes.status}`, request.url));
    }

    const tokenData = JSON.parse(responseText);
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    if (!accessToken) {
      console.error('No access token in response:', responseText.substring(0, 200));
      return NextResponse.redirect(new URL('/?error=no_token', request.url));
    }

    console.log('Access token obtained, expires_in:', tokenData.expires_in, 'hasRefresh:', !!refreshToken);

    const cookieStore = await cookies();
    
    // Set access token cookie
    cookieStore.set('whoop_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Store refresh token if available (for token refresh)
    if (refreshToken) {
      cookieStore.set('whoop_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    console.log('Cookies set successfully');
    return NextResponse.redirect(new URL('/?connected=true', request.url));
  } catch (e: any) {
    console.error('OAuth callback exception:', e.message);
    return NextResponse.redirect(new URL(`/?error=server&message=${encodeURIComponent(e.message || 'unknown')}`, request.url));
  }
}
