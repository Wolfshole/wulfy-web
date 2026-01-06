// Navigation Management - Dynamische Anpassung basierend auf Login-Status

// Hilfsfunktion für LocalStorage
const NavAuth = {
  isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
  },
  
  getUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  },
  
  isAdmin() {
    const user = this.getUser();
    return user ? user.isAdmin === true : false;
  }
};

// Navigation aktualisieren basierend auf Login-Status
function updateNavigation() {
  const isLoggedIn = NavAuth.isLoggedIn();
  const user = NavAuth.getUser();
  
  // Login/Register Buttons finden
  const anmeldenBtn = document.getElementById('anmelden');
  const registrierenBtn = document.getElementById('registrieren');
  
  if (isLoggedIn && user) {
    // Benutzer ist eingeloggt - Buttons zu Profil-Link ändern
    if (anmeldenBtn && registrierenBtn) {
      const nav = anmeldenBtn.closest('ul');
      
      if (nav) {
        // Alte Buttons entfernen
        const anmeldenLi = anmeldenBtn.closest('li');
        const registrierenLi = registrierenBtn.closest('li');
        
        if (anmeldenLi) anmeldenLi.remove();
        if (registrierenLi) registrierenLi.remove();
        
        // Dashboard-Link nur für Admins hinzufügen
        if (user.isAdmin && !document.getElementById('dashboard-nav-btn')) {
          const dashboardLi = document.createElement('li');
          const dashboardLink = document.createElement('a');
          dashboardLink.href = '/dashboard';
          dashboardLink.id = 'dashboard-nav-btn';
          dashboardLink.textContent = '📊 Dashboard';
          dashboardLi.appendChild(dashboardLink);
          nav.appendChild(dashboardLi);
        }
        
        // Profil-Button hinzufügen (falls noch nicht vorhanden)
        if (!document.getElementById('profile-nav-btn')) {
          const profileLi = document.createElement('li');
          const profileLink = document.createElement('a');
          profileLink.href = '/profile';
          profileLink.id = 'profile-nav-btn';
          profileLink.className = 'btn-login';
          profileLink.innerHTML = '👤 Profil';
          profileLi.appendChild(profileLink);
          
          // Logout-Button hinzufügen (falls noch nicht vorhanden)
          if (!document.getElementById('logout-nav-btn')) {
            const logoutLi = document.createElement('li');
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'logout-nav-btn';
            logoutBtn.className = 'btn-register';
            logoutBtn.textContent = 'Abmelden';
            logoutBtn.addEventListener('click', handleLogout);
            logoutLi.appendChild(logoutBtn);
            
            nav.appendChild(profileLi);
            nav.appendChild(logoutLi);
          } else {
            nav.appendChild(profileLi);
          }
        }
      }
    }
  } else {
    // Benutzer ist nicht eingeloggt - Dashboard/Profil/Logout entfernen, Login/Register zeigen
    const dashboardBtn = document.getElementById('dashboard-nav-btn');
    const profileBtn = document.getElementById('profile-nav-btn');
    const logoutBtn = document.getElementById('logout-nav-btn');
    
    if (dashboardBtn) {
      const dashboardLi = dashboardBtn.closest('li');
      if (dashboardLi) dashboardLi.remove();
    }
    
    if (profileBtn) {
      const profileLi = profileBtn.closest('li');
      if (profileLi) profileLi.remove();
    }
    
    if (logoutBtn) {
      const logoutLi = logoutBtn.closest('li');
      if (logoutLi) logoutLi.remove();
    }
  }
}

// Logout Handler
function handleLogout() {
  if (confirm('Möchtest du dich wirklich abmelden?')) {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/';
  }
}

// Beim Laden der Seite Navigation aktualisieren
document.addEventListener('DOMContentLoaded', () => {
  updateNavigation();
});

// Export für andere Scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { updateNavigation, NavAuth };
}
