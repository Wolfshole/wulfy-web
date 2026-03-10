// Startet den Google OAuth Login
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ redirect }) => {
  const clientId    = import.meta.env.GOOGLE_CLIENT_ID;
  const redirectUri = import.meta.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return redirect('/login?error=oauth_not_configured');
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'offline',
  });

  return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};