// Discord OAuth Callback
import type { APIRoute } from 'astro';
import { saveUser, getUserByEmail, createSession, isAdminUser } from '../../../../lib/kv';

export const GET: APIRoute = async ({ request, redirect, cookies }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  if (!code) {
    return redirect('/login?error=oauth_failed');
  }
  
  try {
    // Token austauschen
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: import.meta.env.DISCORD_CLIENT_ID,
        client_secret: import.meta.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${url.origin}/api/auth/callback/discord`
      })
    });
    
    const tokens = await tokenResponse.json();
    
    // Benutzerdaten abrufen
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });
    
    const discordUser = await userResponse.json();
    
    // Prüfe ob User bereits existiert
    let user = await getUserByEmail(discordUser.email);
    
    if (!user) {
      // Neuer User - erstelle Profil
      user = {
        id: `discord_${discordUser.id}`,
        username: discordUser.username,
        email: discordUser.email,
        avatar: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : undefined,
        provider: 'discord',
        isAdmin: isAdminUser(discordUser.username, discordUser.email),
        createdAt: new Date().toISOString()
      };
      
      await saveUser(user);
    } else {
      // Bestehender User - aktualisiere Admin-Status
      user.isAdmin = isAdminUser(user.username, user.email);
      await saveUser(user);
    }
    
    // Session erstellen (365 Tage = 1 Jahr)
    const sessionId = await createSession(user.id, 365);
    
    // Cookie setzen
    cookies.set('session_id', sessionId, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 // 1 Jahr
    });
    
    return redirect('/dashboard');
  } catch (error) {
    console.error('Discord OAuth error:', error);
    return redirect('/login?error=oauth_failed');
  }
};
