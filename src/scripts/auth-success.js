// Auth Success Script - Setzt localStorage und leitet weiter

// Lese User-Daten aus URL-Parameter
const urlParams = new URLSearchParams(window.location.search);
const userData = urlParams.get('user');
const redirectTo = urlParams.get('redirect') || '/';

if (userData) {
  try {
    const user = JSON.parse(decodeURIComponent(userData));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = redirectTo;
  } catch (e) {
    console.error('Fehler beim Parsen der User-Daten:', e);
    window.location.href = '/login?error=auth_failed';
  }
} else {
  window.location.href = '/login?error=no_user_data';
}
