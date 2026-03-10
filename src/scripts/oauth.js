// OAuth Handler
// Leitet direkt zu den Astro API-Routen weiter – kein import.meta.env im Browser nötig!

document.addEventListener('DOMContentLoaded', () => {
  const oauthButtons = document.querySelectorAll('.oauth-btn');

  oauthButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const provider = button.getAttribute('data-provider');

      const routes = {
        discord: '/api/auth/discord',
        google:  '/api/auth/google',
        twitch:  '/api/auth/twitch',
      };

      const route = routes[provider];
      if (route) {
        window.location.href = route;
      } else {
        console.error(`Unbekannter OAuth-Provider: ${provider}`);
      }
    });
  });
});