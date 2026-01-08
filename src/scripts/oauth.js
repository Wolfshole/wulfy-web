// OAuth Handler

const OAuthConfig = {
  discord: {
    authUrl: 'https://discord.com/api/oauth2/authorize',
    clientId: import.meta.env.PUBLIC_DISCORD_CLIENT_ID || 'YOUR_DISCORD_CLIENT_ID',
    scope: 'identify email',
    redirectUri: `${window.location.origin}/api/auth/callback/discord`
  },
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: import.meta.env.PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    scope: 'openid email profile',
    redirectUri: `${window.location.origin}/api/auth/callback/google`
  },
  apple: {
    authUrl: 'https://appleid.apple.com/auth/authorize',
    clientId: import.meta.env.PUBLIC_APPLE_CLIENT_ID || 'YOUR_APPLE_CLIENT_ID',
    scope: 'name email',
    redirectUri: `${window.location.origin}/api/auth/callback/apple`
  },
  twitch: {
    authUrl: 'https://id.twitch.tv/oauth2/authorize',
    clientId: import.meta.env.PUBLIC_TWITCH_CLIENT_ID || 'YOUR_TWITCH_CLIENT_ID',
    scope: 'user:read:email',
    redirectUri: `${window.location.origin}/api/auth/callback/twitch`
  }
};

// Generiere einen zufälligen State-Parameter für OAuth-Sicherheit
function generateState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// OAuth Login starten
function initiateOAuth(provider) {
  const config = OAuthConfig[provider];
  
  if (!config) {
    console.error(`Unknown OAuth provider: ${provider}`);
    return;
  }
  
  // State generieren und speichern
  const state = generateState();
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('oauth_provider', provider);
  
  // OAuth-URL erstellen
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope,
    state: state
  });
  
  // Für Apple zusätzliche Parameter
  if (provider === 'apple') {
    params.append('response_mode', 'form_post');
  }
  
  // Weiterleitung zum OAuth-Provider
  window.location.href = `${config.authUrl}?${params.toString()}`;
}

// OAuth-Buttons Event Listener
document.addEventListener('DOMContentLoaded', () => {
  const oauthButtons = document.querySelectorAll('.oauth-btn');
  
  oauthButtons.forEach(button => {
    button.addEventListener('click', () => {
      const provider = button.getAttribute('data-provider');
      initiateOAuth(provider);
    });
  });
});
