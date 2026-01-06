// Auth JavaScript - Login und Registrierung

// Hilfsfunktion für LocalStorage
const AuthStorage = {
  setUser(userData) {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
  },
  
  getUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  },
  
  clearUser() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
  },
  
  isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
  },
  
  getUsers() {
    const users = localStorage.getItem('registeredUsers');
    return users ? JSON.parse(users) : [];
  },
  
  addUser(user) {
    const users = this.getUsers();
    users.push(user);
    localStorage.setItem('registeredUsers', JSON.stringify(users));
  },
  
  findUser(username, password) {
    const users = this.getUsers();
    return users.find(u => 
      (u.username === username || u.email === username) && u.password === password
    );
  },
  
  userExists(username, email) {
    const users = this.getUsers();
    return users.some(u => u.username === username || u.email === email);
  },
  
  isAdmin() {
    const user = this.getUser();
    return user ? user.isAdmin === true : false;
  },
  
  // Admin-Benutzerliste (diese Benutzernamen haben Admin-Rechte)
  adminUsernames: ['Wulfy', 'UEBlackWulfGHG', 'ueblackwulf', 'ueblackwolf'],
  
  checkIfAdmin(username) {
    return this.adminUsernames.some(admin => 
      admin.toLowerCase() === username.toLowerCase()
    );
  }
};

// Nachricht anzeigen
function showMessage(elementId, message, isError = false) {
  const messageElement = document.getElementById(elementId);
  if (messageElement) {
    messageElement.textContent = message;
    messageElement.style.display = 'block';
    
    // Nachricht nach 5 Sekunden ausblenden
    setTimeout(() => {
      messageElement.style.display = 'none';
    }, 5000);
  }
}

// Login-Formular
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    // Validierung
    if (!username || !password) {
      showMessage('error-message', 'Bitte alle Felder ausfüllen!', true);
      return;
    }
    
    // Benutzer suchen
    const user = AuthStorage.findUser(username, password);
    
    if (user) {
      // Login erfolgreich - Admin-Status prüfen und aktualisieren
      const isAdmin = AuthStorage.checkIfAdmin(user.username);
      
      // Admin-Status im gespeicherten Benutzer aktualisieren, falls nicht vorhanden
      if (isAdmin && !user.isAdmin) {
        const users = AuthStorage.getUsers();
        const userIndex = users.findIndex(u => u.username === user.username);
        if (userIndex !== -1) {
          users[userIndex].isAdmin = true;
          localStorage.setItem('registeredUsers', JSON.stringify(users));
        }
      }
      
      const userData = {
        username: user.username,
        email: user.email,
        registeredDate: user.registeredDate,
        rememberMe: remember,
        isAdmin: isAdmin,
        profilePicture: user.profilePicture // Profilbild beibehalten
      };
      
      AuthStorage.setUser(userData);
      showMessage('success-message', 'Login erfolgreich! Weiterleitung...');
      
      // Weiterleitung nach 1 Sekunde
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } else {
      showMessage('error-message', 'Benutzername oder Passwort falsch!', true);
    }
  });
}

// Registrierungs-Formular
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const termsAccepted = document.getElementById('terms').checked;
    
    // Validierung
    if (!username || !email || !password || !confirmPassword) {
      showMessage('error-message', 'Bitte alle Felder ausfüllen!', true);
      return;
    }
    
    if (username.length < 3) {
      showMessage('error-message', 'Benutzername muss mindestens 3 Zeichen lang sein!', true);
      return;
    }
    
    if (password.length < 8) {
      showMessage('error-message', 'Passwort muss mindestens 8 Zeichen lang sein!', true);
      return;
    }
    
    if (password !== confirmPassword) {
      showMessage('error-message', 'Passwörter stimmen nicht überein!', true);
      return;
    }
    
    if (!termsAccepted) {
      showMessage('error-message', 'Bitte akzeptiere die Nutzungsbedingungen!', true);
      return;
    }
    
    // E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('error-message', 'Bitte gib eine gültige E-Mail-Adresse ein!', true);
      return;
    }
    
    // Prüfen ob Benutzer bereits existiert
    if (AuthStorage.userExists(username, email)) {
      showMessage('error-message', 'Benutzername oder E-Mail bereits vergeben!', true);
      return;
    }
    
    // Neuen Benutzer erstellen
    const isAdmin = AuthStorage.checkIfAdmin(username);
    const newUser = {
      username: username,
      email: email,
      password: password, // In einer echten Anwendung: NIEMALS Passwort im Klartext speichern!
      registeredDate: new Date().toISOString(),
      isAdmin: isAdmin
    };
    
    AuthStorage.addUser(newUser);
    showMessage('success-message', 'Registrierung erfolgreich! Weiterleitung zum Login...');
    
    // Weiterleitung nach 2 Sekunden
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  });
}

// Anmelden-Button auf der Hauptseite
const anmeldenBtn = document.getElementById('anmelden');
if (anmeldenBtn) {
  anmeldenBtn.addEventListener('click', () => {
    // Prüfen ob bereits angemeldet
    if (AuthStorage.isLoggedIn()) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/login';
    }
  });
}

// Registrieren-Button auf der Hauptseite
const registrierenBtn = document.getElementById('registrieren');
if (registrierenBtn) {
  registrierenBtn.addEventListener('click', () => {
    window.location.href = '/register';
  });
}

// Auto-Login-Check beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
  // Wenn auf einer Auth-Seite und bereits eingeloggt, zum Dashboard
  const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
  if (isAuthPage && AuthStorage.isLoggedIn()) {
    window.location.href = '/dashboard';
  }
});
