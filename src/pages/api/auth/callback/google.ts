// Google OAuth Callback
import type { APIRoute } from 'astro';
import { saveUser, getUserByEmail, createSession, isAdminUser } from '../../../../lib/kv';

export const GET: APIRoute = async ({ request, redirect, cookies }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return redirect('/login?error=oauth_failed');
  }

  const clientId     = import.meta.env.GOOGLE_CLIENT_ID;
  const clientSecret = import.meta.env.GOOGLE_CLIENT_SECRET;
  const redirectUri  = import.meta.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return redirect('/login?error=oauth_not_configured');
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        grant_type:    'authorization_code',
        code:          code,
        redirect_uri:  redirectUri
      })
    });

    const tokens = await tokenResponse.json();

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const googleUser = await userResponse.json();

    let user = await getUserByEmail(googleUser.email);

    if (!user) {
      user = {
        id:            `google_${googleUser.id}`,
        username:      googleUser.name,
        email:         googleUser.email,
        emailVerified: true,
        avatar:        googleUser.picture,
        provider:      'google',
        isAdmin:       isAdminUser(googleUser.name, googleUser.email),
        createdAt:     new Date().toISOString()
      };
      await saveUser(user);
    } else {
      user.isAdmin = isAdminUser(user.username, user.email);
      await saveUser(user);
    }

    const sessionId = await createSession(user.id, 365);
    cookies.set('session_id', sessionId, {
      path:     '/',
      httpOnly: true,
      secure:   import.meta.env.PROD,
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 365
    });

    return redirect('/dashboard');
  } catch (error) {
    console.error('Google OAuth error:', error);
    return redirect('/login?error=oauth_failed');
  }
};