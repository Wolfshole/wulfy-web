import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ redirect }) => {
  const clientId    = import.meta.env.DISCORD_CLIENT_ID;
  const redirectUri = import.meta.env.DISCORD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return redirect('/login?error=oauth_not_configured');
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'identify email',
  });

  return redirect(`https://discord.com/api/oauth2/authorize?${params}`);
};