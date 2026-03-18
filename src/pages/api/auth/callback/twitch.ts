// Twitch OAuth Callback
import type { APIRoute } from 'astro';
import { saveUser, getUserByEmail, createSession } from '../../../../lib/kv';

export const GET: APIRoute = async ({ request, redirect, cookies }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return redirect('/login?error=oauth_failed');
  }

  const clientId     = import.meta.env.TWITCH_CLIENT_ID;
  const clientSecret = import.meta.env.TWITCH_CLIENT_SECRET;
  const redirectUri  = import.meta.env.TWITCH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return redirect('/login?error=oauth_not_configured');
  }

  try {
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
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

    const userResponse = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Client-Id':     clientId
      }
    });

    const twitchData = await userResponse.json();
    const twitchUser = twitchData.data[0];

    let user = await getUserByEmail(twitchUser.email);

    if (!user) {
      user = {
        id:            `twitch_${twitchUser.id}`,
        username:      twitchUser.display_name,
        email:         twitchUser.email,
        emailVerified: true,
        avatar:        twitchUser.profile_image_url,
        provider:      'twitch',
        isAdmin:       false,
        createdAt:     new Date().toISOString()
      };
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
    console.error('Twitch OAuth error:', error);
    return redirect('/login?error=oauth_failed');
  }
};