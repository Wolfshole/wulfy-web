// Discord OAuth Callback
import type { APIRoute } from 'astro';

const adminUsernames = ['Wulfy', 'UEBlackWulfGHG', 'ueblackwulf', 'ueblackwolf'];

function isAdminUser(username: string): boolean {
  return adminUsernames.some(admin => admin.toLowerCase() === username.toLowerCase());
}

export const GET: APIRoute = async ({ request, redirect, cookies }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    console.error('Discord OAuth error:', error);
    return redirect('/login?error=oauth_denied');
  }

  if (!code) {
    return redirect('/login?error=oauth_no_code');
  }

  const clientId     = import.meta.env.DISCORD_CLIENT_ID;
  const clientSecret = import.meta.env.DISCORD_CLIENT_SECRET;
  const redirectUri  = import.meta.env.DISCORD_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Discord OAuth not configured - missing environment variables');
    return redirect('/login?error=oauth_not_configured');
  }

  try {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
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

    if (!tokenResponse.ok) {
      console.error('Discord token exchange failed:', await tokenResponse.json());
      return redirect('/login?error=oauth_token_failed');
    }

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return redirect('/login?error=oauth_no_token');
    }

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!userResponse.ok) {
      return redirect('/login?error=oauth_user_failed');
    }

    const discordUser = await userResponse.json();

    if (!discordUser.id || !discordUser.username) {
      return redirect('/login?error=oauth_invalid_user');
    }

    const isAdmin = isAdminUser(discordUser.username);
    const user = {
      id:            `discord_${discordUser.id}`,
      username:      discordUser.username,
      email:         discordUser.email || `${discordUser.username}@discord.local`,
      emailVerified: true,
      avatar:        discordUser.avatar
                       ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                       : undefined,
      provider:      'discord' as const,
      isAdmin:       isAdmin,
      createdAt:     new Date().toISOString()
    };

    try {
      const { saveUser, createSession } = await import('../../../../lib/kv');
      await saveUser(user);
      const sessionId = await createSession(user.id, 365);
      cookies.set('session_id', sessionId, {
        path:     '/',
        httpOnly: true,
        secure:   import.meta.env.PROD,
        sameSite: 'lax',
        maxAge:   60 * 60 * 24 * 365
      });
    } catch (kvError) {
      console.warn('KV not available, using cookie fallback:', kvError);
      cookies.set('discord_user', JSON.stringify(user), {
        path:     '/',
        httpOnly: true,
        secure:   import.meta.env.PROD,
        sameSite: 'lax',
        maxAge:   60 * 60 * 24 * 365
      });
    }

    return redirect(isAdmin ? '/dashboard?welcome=discord' : '/?welcome=discord');

  } catch (error) {
    console.error('Discord OAuth error:', error);
    return redirect('/login?error=oauth_failed');
  }
};