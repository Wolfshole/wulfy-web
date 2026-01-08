// Discord OAuth Callback
export async function GET({ request, redirect, cookies }) {
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
    
    // Benutzer in Session speichern
    const userData = {
      id: discordUser.id,
      username: discordUser.username,
      email: discordUser.email,
      avatar: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : null,
      provider: 'discord',
      isAdmin: false
    };
    
    // Cookie setzen (oder später in Datenbank speichern)
    cookies.set('user_session', JSON.stringify(userData), {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 Tage
    });
    
    return redirect('/dashboard');
  } catch (error) {
    console.error('Discord OAuth error:', error);
    return redirect('/login?error=oauth_failed');
  }
}
