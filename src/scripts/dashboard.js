// Dashboard JavaScript

// Auth-Check bei Seitenaufruf
document.addEventListener('DOMContentLoaded', () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  // Wenn nicht eingeloggt, zum Login umleiten
  if (!isLoggedIn) {
    window.location.href = '/login';
    return;
  }
  
  // Benutzerdaten laden und anzeigen
  loadUserData();
  
  // Logout-Button Event
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
});

// Benutzerdaten laden
function loadUserData() {
  const currentUserData = localStorage.getItem('currentUser');
  
  if (!currentUserData) {
    window.location.href = '/login';
    return;
  }
  
  const user = JSON.parse(currentUserData);
  
  // Benutzername im Header anzeigen
  const userNameElement = document.getElementById('user-name');
  if (userNameElement) {
    userNameElement.textContent = user.username;
  }
  
  // Profil-Informationen anzeigen
  const profileUsername = document.getElementById('profile-username');
  if (profileUsername) {
    profileUsername.textContent = user.username;
  }
  
  const profileEmail = document.getElementById('profile-email');
  if (profileEmail) {
    profileEmail.textContent = user.email;
  }
  
  const profileRegistered = document.getElementById('profile-registered');
  if (profileRegistered && user.registeredDate) {
    const date = new Date(user.registeredDate);
    const formattedDate = date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    profileRegistered.textContent = formattedDate;
  }
}

// Logout-Funktion
function handleLogout() {
  // Bestätigung
  if (confirm('Möchtest du dich wirklich abmelden?')) {
    // Session-Daten löschen
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    
    // Zum Login umleiten
    window.location.href = '/login';
  }
}

// Session-Check alle 30 Sekunden
setInterval(() => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (!isLoggedIn) {
    window.location.href = '/login';
  }
}, 30000);
