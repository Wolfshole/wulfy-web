// Profile Page Script

// Hilfsfunktion für LocalStorage
const AuthStorage = {
  getUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  },
  
  setUser(userData) {
    localStorage.setItem('currentUser', JSON.stringify(userData));
  },
  
  isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
  },
  
  clearUser() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
  },
  
  // Profilbild speichern
  setProfilePicture(base64Image) {
    const user = this.getUser();
    if (user) {
      user.profilePicture = base64Image;
      this.setUser(user);
      
      // Auch in der Liste der registrierten Benutzer aktualisieren
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.username === user.username);
      if (userIndex !== -1) {
        users[userIndex].profilePicture = base64Image;
        localStorage.setItem('registeredUsers', JSON.stringify(users));
      }
    }
  },
  
  // Profilbild entfernen
  removeProfilePicture() {
    const user = this.getUser();
    if (user) {
      delete user.profilePicture;
      this.setUser(user);
      
      // Auch in der Liste der registrierten Benutzer aktualisieren
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.username === user.username);
      if (userIndex !== -1) {
        delete users[userIndex].profilePicture;
        localStorage.setItem('registeredUsers', JSON.stringify(users));
      }
    }
  },
  
  getUsers() {
    const users = localStorage.getItem('registeredUsers');
    return users ? JSON.parse(users) : [];
  }
};

// Nachricht anzeigen
function showMessage(message, isError = false) {
  const messageElement = document.getElementById('message');
  if (messageElement) {
    messageElement.textContent = message;
    messageElement.className = `message ${isError ? 'error' : 'success'}`;
    messageElement.style.display = 'block';
    
    setTimeout(() => {
      messageElement.style.display = 'none';
    }, 5000);
  }
}

// Initiale Buchstaben aus Benutzername extrahieren
function getInitials(username) {
  if (!username) return '?';
  const parts = username.split(/[\s_-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.substring(0, 2).toUpperCase();
}

// Profilbild anzeigen
function displayProfilePicture() {
  const user = AuthStorage.getUser();
  const container = document.getElementById('profile-picture-container');
  const removeBtn = document.getElementById('remove-picture-btn');
  
  if (!container) return;
  
  if (user && user.profilePicture) {
    // Bild vorhanden
    container.innerHTML = `<img src="${user.profilePicture}" alt="Profilbild" class="profile-picture">`;
    if (removeBtn) removeBtn.style.display = 'block';
  } else {
    // Kein Bild - Platzhalter mit Initialen anzeigen
    const initials = getInitials(user ? user.username : '?');
    container.innerHTML = `<div class="profile-picture-placeholder">${initials}</div>`;
    if (removeBtn) removeBtn.style.display = 'none';
  }
}

// Profilinformationen laden
function loadProfileInfo() {
  const user = AuthStorage.getUser();
  
  if (!user) {
    // Nicht eingeloggt - zur Login-Seite umleiten
    window.location.href = '/login';
    return;
  }
  
  // Benutzerdaten anzeigen
  const usernameEl = document.getElementById('profile-username');
  const emailEl = document.getElementById('profile-email');
  const registeredEl = document.getElementById('profile-registered');
  
  if (usernameEl) usernameEl.textContent = user.username;
  if (emailEl) emailEl.textContent = user.email;
  
  if (registeredEl && user.registeredDate) {
    const date = new Date(user.registeredDate);
    registeredEl.textContent = date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Admin-Status anzeigen, wenn Benutzer Admin ist
  if (user.isAdmin) {
    const adminStatusContainer = document.getElementById('admin-status-container');
    if (adminStatusContainer) {
      adminStatusContainer.style.display = 'flex';
    }
  }
  
  // Profilbild anzeigen
  displayProfilePicture();
}

// Bild-Upload Handler
const fileInput = document.getElementById('profile-picture-input');
if (fileInput) {
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Dateityp prüfen
    if (!file.type.startsWith('image/')) {
      showMessage('Bitte wähle eine Bilddatei aus!', true);
      fileInput.value = '';
      return;
    }
    
    // Bild als Base64 lesen
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Image = event.target.result;
      AuthStorage.setProfilePicture(base64Image);
      displayProfilePicture();
      showMessage('Profilbild erfolgreich aktualisiert! ✅');
      fileInput.value = '';
    };
    
    reader.onerror = () => {
      showMessage('Fehler beim Hochladen des Bildes!', true);
      fileInput.value = '';
    };
    
    reader.readAsDataURL(file);
  });
}

// Bild entfernen Handler
const removeBtn = document.getElementById('remove-picture-btn');
if (removeBtn) {
  removeBtn.addEventListener('click', () => {
    if (confirm('Möchtest du dein Profilbild wirklich entfernen?')) {
      AuthStorage.removeProfilePicture();
      displayProfilePicture();
      showMessage('Profilbild wurde entfernt.');
    }
  });
}

// Logout Handler
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    if (confirm('Möchtest du dich wirklich abmelden?')) {
      AuthStorage.clearUser();
      window.location.href = '/';
    }
  });
}

// Seite initialisieren
document.addEventListener('DOMContentLoaded', () => {
  loadProfileInfo();
});
