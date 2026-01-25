// Discord OAuth Callback
import type { APIRoute } from 'astro';

// Admin-Benutzernamen (sollte mit auth.js übereinstimmen)
const adminUsernames = ['Wulfy', 'UEBlackWulfGHG', 'ueblackwulf', 'ueblackwolf'];

function isAdminUser(username: string, email?: string): boolean {
  return adminUsernames.some(admin => 
    admin.toLowerCase() === username.toLowerCase()
  );
}

export const GET: APIRoute = async ({ request, redirect, cookies }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  
  // OAuth Error handling
  if (error) {
    console.error('Discord OAuth error:', error);
    return redirect('/login?error=oauth_denied');
  }
  
  if (!code) {
    return redirect('/login?error=oauth_no_code');
  }
  
  // Prüfe Environment Variables
  const clientId = import.meta.env.DISCORD_CLIENT_ID;
  const clientSecret = import.meta.env.DISCORD_CLIENT_SECRET;
  const redirectUri = import.meta.env.DISCORD_REDIRECT_URI;
  
  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Discord OAuth not configured - missing environment variables');
    return redirect('/login?error=oauth_not_configured');
  }

  try {
    // Token austauschen
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Discord token exchange failed:', errorData);
      return redirect('/login?error=oauth_token_failed');
    }
    
    const tokens = await tokenResponse.json();
    
    if (!tokens.access_token) {
      console.error('No access token received from Discord');
      return redirect('/login?error=oauth_no_token');
    }
    
    // Benutzerdaten abrufen
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });
    
    if (!userResponse.ok) {
      console.error('Failed to fetch user data from Discord');
      return redirect('/login?error=oauth_user_failed');
    }
    
    const discordUser = await userResponse.json();
    
    if (!discordUser.id || !discordUser.username) {
      console.error('Invalid user data from Discord:', discordUser);
      return redirect('/login?error=oauth_invalid_user');
    }
    
    // User-Objekt erstellen
    const isAdmin = isAdminUser(discordUser.username, discordUser.email);
    const user = {
      id: `discord_${discordUser.id}`,
      username: discordUser.username,
      email: discordUser.email || `${discordUser.username}@discord.local`,
      avatar: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : undefined,
      provider: 'discord' as const,
      isAdmin: isAdmin,
      createdAt: new Date().toISOString()
    };
    
    // Versuche KV zu verwenden, fallback zu Cookie-basierter Session
    try {
      // Vercel KV (wenn verfügbar)
      const { saveUser, createSession } = await import('../../../../lib/kv');
      
      await saveUser(user);
      const sessionId = await createSession(user.id, 365);
      
      cookies.set('session_id', sessionId, {
        path: '/',
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365 // 1 Jahr
      });
      
    } catch (kvError) {
      // Fallback: Benutzer in Cookie speichern (für lokale Entwicklung)
      console.warn('KV not available, using cookie fallback:', kvError);
      
      cookies.set('discord_user', JSON.stringify(user), {
        path: '/',
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365 // 1 Jahr
      });
    }
    
    // Erfolgreich - weiterleiten
    if (isAdmin) {
      return redirect('/dashboard?welcome=discord');
    } else {
      return redirect('/?welcome=discord');
    }
    
  } catch (error) {
    console.error('Discord OAuth error:', error);
    return redirect('/login?error=oauth_failed');
  }
};
