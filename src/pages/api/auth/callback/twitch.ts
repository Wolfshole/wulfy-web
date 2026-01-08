// Twitch OAuth Callback
import type { APIRoute } from 'astro';
import { saveUser, getUserByEmail, createSession } from '../../../../lib/kv';

export const GET: APIRoute = async ({ request, redirect, cookies }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (!code) {
    return redirect('/login?error=oauth_failed');
  }
  
  try {
    // Token austauschen
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: import.meta.env.TWITCH_CLIENT_ID,
        client_secret: import.meta.env.TWITCH_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${url.origin}/api/auth/callback/twitch`
      })
    });
    
    const tokens = await tokenResponse.json();
    
    // Benutzerdaten abrufen
    const userResponse = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Client-Id': import.meta.env.TWITCH_CLIENT_ID
      }
    });
    
    const twitchData = await userResponse.json();
    const twitchUser = twitchData.data[0];
    
    let user = await getUserByEmail(twitchUser.email);
    
    if (!user) {
      user = {
        id: `twitch_${twitchUser.id}`,
        username: twitchUser.display_name,
        email: twitchUser.email,
        avatar: twitchUser.profile_image_url,
        provider: 'twitch',
        isAdmin: false,
        createdAt: new Date().toISOString()
      };
      await saveUser(user);
    }
    
    const sessionId = await createSession(user.id, 30);
    cookies.set('session_id', sessionId, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    });
    
    return redirect('/dashboard');
  } catch (error) {
    console.error('Twitch OAuth error:', error);
    return redirect('/login?error=oauth_failed');
  }
};
