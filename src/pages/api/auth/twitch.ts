import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ redirect }) => {
  const clientId    = import.meta.env.TWITCH_CLIENT_ID;
  const redirectUri = import.meta.env.PUBLIC_TWITCH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return redirect('/login?error=oauth_not_configured');
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'user:read:email',
  });

  return redirect(`https://id.twitch.tv/oauth2/authorize?${params}`);
};
