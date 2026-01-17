// Apple OAuth Callback
import type { APIRoute } from 'astro';
import { saveUser, getUserByEmail, createSession } from '../../../../lib/kv';

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  const formData = await request.formData();
  const code = formData.get('code');
  const state = formData.get('state');
  
  if (!code) {
    return redirect('/login?error=oauth_failed');
  }
  
  try {
    const url = new URL(request.url);
    
    // Token austauschen
    const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: import.meta.env.APPLE_CLIENT_ID,
        client_secret: import.meta.env.APPLE_CLIENT_SECRET, // JWT generieren
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: `${url.origin}/api/auth/callback/apple`
      })
    });
    
    const tokens = await tokenResponse.json();
    
    // Apple gibt Benutzerdaten im ID Token zurück
    const idToken = tokens.id_token;
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    
    let user = await getUserByEmail(payload.email);
    
    if (!user) {
      user = {
        id: `apple_${payload.sub}`,
        username: payload.email?.split('@')[0] || 'Apple User',
        email: payload.email,
        avatar: undefined,
        provider: 'apple',
        isAdmin: false,
        createdAt: new Date().toISOString()
      };
      await saveUser(user);
    }
    
    const sessionId = await createSession(user.id, 365);
    cookies.set('session_id', sessionId, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 // 1 Jahr
    });
    
    return redirect('/dashboard');
  } catch (error) {
    console.error('Apple OAuth error:', error);
    return redirect('/login?error=oauth_failed');
  }
};

// Apple verwendet POST statt GET
export const GET: APIRoute = async ({ redirect }) => {
  return redirect('/login?error=oauth_failed');
};
