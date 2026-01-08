// Google OAuth Callback
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, redirect, cookies }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (!code) {
    return redirect('/login?error=oauth_failed');
  }
  
  try {
    // Token austauschen
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: import.meta.env.GOOGLE_CLIENT_ID,
        client_secret: import.meta.env.GOOGLE_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${url.origin}/api/auth/callback/google`
      })
    });
    
    const tokens = await tokenResponse.json();
    
    // Benutzerdaten abrufen
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });
    
    const googleUser = await userResponse.json();
    
    // Benutzer in Session speichern
    const userData = {
      id: googleUser.id,
      username: googleUser.name,
      email: googleUser.email,
      avatar: googleUser.picture,
      provider: 'google',
      isAdmin: false
    };
    
    cookies.set('user_session', JSON.stringify(userData), {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    });
    
    return redirect('/dashboard');
  } catch (error) {
    console.error('Google OAuth error:', error);
    return redirect('/login?error=oauth_failed');
  }
};
