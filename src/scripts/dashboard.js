// Dashboard JavaScript - Admin Dashboard

// Admin-Storage Hilfsfunktionen
const AdminStorage = {
  getSettings() {
    const settings = localStorage.getItem('adminSettings');
    return settings ? JSON.parse(settings) : {
      allowRegistration: true,
      maintenanceMode: false,
      defaultDarkMode: false
    };
  },
  
  saveSettings(settings) {
    localStorage.setItem('adminSettings', JSON.stringify(settings));
  },
  
  getUsers() {
    const users = localStorage.getItem('registeredUsers');
    return users ? JSON.parse(users) : [];
  },
  
  saveUsers(users) {
    localStorage.setItem('registeredUsers', JSON.stringify(users));
  },
  
  deleteUser(username) {
    const users = this.getUsers();
    const filteredUsers = users.filter(u => u.username !== username);
    this.saveUsers(filteredUsers);
  },
  
  toggleUserAdmin(username) {
    const users = this.getUsers();
    const user = users.find(u => u.username === username);
    if (user) {
      user.isAdmin = !user.isAdmin;
      this.saveUsers(users);
    }
  },
  
  updateUser(username, updates) {
    const users = this.getUsers();
    const user = users.find(u => u.username === username);
    if (user) {
      if (updates.email) user.email = updates.email;
      if (updates.password) user.password = updates.password;
      if (updates.hasOwnProperty('isAdmin')) user.isAdmin = updates.isAdmin;
      this.saveUsers(users);
      
      // Wenn der aktuell eingeloggte Nutzer bearbeitet wird, LocalStorage aktualisieren
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.username === username) {
        currentUser.email = user.email;
        if (updates.password) currentUser.password = user.password;
        if (updates.hasOwnProperty('isAdmin')) currentUser.isAdmin = user.isAdmin;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }
      return true;
    }
    return false;
  },
  
  addActivity(text) {
    const activities = this.getActivities();
    activities.unshift({
      text: text,
      timestamp: new Date().toISOString()
    });
    // Nur die letzten 20 Aktivitäten behalten
    if (activities.length > 20) {
      activities.pop();
    }
    localStorage.setItem('activities', JSON.stringify(activities));
  },
  
  getActivities() {
    const activities = localStorage.getItem('activities');
    return activities ? JSON.parse(activities) : [];
  },
  
  // Content Management
  getContent(type) {
    const content = localStorage.getItem(`content_${type}`);
    return content ? JSON.parse(content) : [];
  },
  
  saveContent(type, items) {
    localStorage.setItem(`content_${type}`, JSON.stringify(items));
  },
  
  addContent(type, item) {
    const items = this.getContent(type);
    item.id = Date.now().toString();
    item.createdAt = new Date().toISOString();
    items.unshift(item);
    this.saveContent(type, items);
    return item.id;
  },
  
  updateContent(type, id, updatedItem) {
    const items = this.getContent(type);
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updatedItem, updatedAt: new Date().toISOString() };
      this.saveContent(type, items);
    }
  },
  
  deleteContent(type, id) {
    const items = this.getContent(type);
    const filtered = items.filter(i => i.id !== id);
    this.saveContent(type, filtered);
  }
};

// Auth-Check bei Seitenaufruf
document.addEventListener('DOMContentLoaded', () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  // Wenn nicht eingeloggt, zum Login umleiten
  if (!isLoggedIn) {
    alert('Du musst angemeldet sein, um das Dashboard zu sehen!');
    window.location.href = '/login';
    return;
  }
  
  // Admin-Check
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser || !currentUser.isAdmin) {
    alert('Zugriff verweigert! Nur Admins haben Zugriff auf das Dashboard.');
    window.location.href = '/';
    return;
  }
  
  // Dashboard initialisieren
  initDashboard(currentUser);
  
  // Event Listeners
  setupEventListeners();
  
  // Content-Verwaltung initialisieren
  initContentManagement();
});

// Dashboard initialisieren
function initDashboard(user) {
  // Benutzername anzeigen
  const userNameElement = document.getElementById('user-name');
  if (userNameElement) {
    userNameElement.textContent = user.username;
  }
  
  // Statistiken laden
  loadStatistics();
  
  // Benutzerliste laden
  loadUsersList();
  
  // Einstellungen laden
  loadSettings();
  
  // Aktivitäten laden
  loadActivities();
  
  // Aktivität loggen
  AdminStorage.addActivity(`Dashboard aufgerufen von ${user.username}`);
}

// Statistiken laden
function loadStatistics() {
  const users = AdminStorage.getUsers();
  const admins = users.filter(u => u.isAdmin);
  
  document.getElementById('total-users').textContent = users.length;
  document.getElementById('total-admins').textContent = admins.length;
  
  const today = new Date();
  document.getElementById('current-date').textContent = today.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Benutzerliste laden
function loadUsersList(searchTerm = '') {
  const users = AdminStorage.getUsers();
  const usersList = document.getElementById('users-list');
  
  if (!usersList) return;
  
  // Filtern nach Suchbegriff
  const filteredUsers = searchTerm 
    ? users.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;
  
  if (filteredUsers.length === 0) {
    usersList.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Keine Benutzer gefunden.</p>';
    return;
  }
  
  usersList.innerHTML = filteredUsers.map(user => {
    const initials = getInitials(user.username);
    const avatarHtml = user.profilePicture 
      ? `<img src="${user.profilePicture}" class="user-avatar" alt="${user.username}">`
      : `<div class="user-avatar-placeholder">${initials}</div>`;
    
    const adminBadge = user.isAdmin ? '<span class="admin-badge">👑 ADMIN</span>' : '';
    
    const registeredDate = new Date(user.registeredDate).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    return `
      <div class="user-item" data-username="${user.username}">
        <div class="user-info-item">
          ${avatarHtml}
          <div class="user-details">
            <h4>${user.username} ${adminBadge}</h4>
            <p>${user.email} • Seit ${registeredDate}</p>
          </div>
        </div>
        <div class="user-actions">
          <button class="btn-icon" onclick="editUser('${user.username.replace(/'/g, "\\'")}');" title="Benutzer bearbeiten">
            ✏️
          </button>
          <button class="btn-icon toggle-admin" onclick="toggleUserAdmin('${user.username.replace(/'/g, "\\'")}');" title="Admin-Status ändern">
            👑
          </button>
          <button class="btn-icon delete" onclick="deleteUser('${user.username.replace(/'/g, "\\'")}');" title="Benutzer löschen">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // Swipe-to-delete Funktionalität hinzufügen
  initSwipeToDelete();
}

// Swipe-to-delete initialisieren
function initSwipeToDelete() {
  const userItems = document.querySelectorAll('.user-item');
  
  userItems.forEach(item => {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let isSwiped = false;
    
    const onStart = (e) => {
      isDragging = true;
      startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
      currentX = startX;
      item.style.transition = 'none';
    };
    
    const onMove = (e) => {
      if (!isDragging) return;
      
      currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
      const diff = currentX - startX;
      
      // Nur nach links wischen erlauben (negative Werte)
      if (diff < 0) {
        const translateX = Math.max(diff, -100);
        item.style.transform = `translateX(${translateX}px)`;
      }
    };
    
    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      
      const diff = currentX - startX;
      item.style.transition = 'transform 0.3s ease';
      
      // Wenn mehr als 60px nach links gewischt wurde
      if (diff < -60) {
        item.style.transform = 'translateX(-100px)';
        isSwiped = true;
      } else {
        item.style.transform = 'translateX(0)';
        isSwiped = false;
      }
    };
    
    // Mouse Events
    item.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    
    // Touch Events
    item.addEventListener('touchstart', onStart, { passive: true });
    item.addEventListener('touchmove', onMove, { passive: true });
    item.addEventListener('touchend', onEnd);
    
    // Click außerhalb schließt geöffnete Items
    document.addEventListener('click', (e) => {
      if (!item.contains(e.target) && isSwiped) {
        item.style.transform = 'translateX(0)';
        isSwiped = false;
      }
    });
  });
  
  // Delete Button Event Listeners
  const deleteButtons = document.querySelectorAll('.delete-confirm-btn');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const username = btn.getAttribute('data-username');
      deleteUser(username);
    });
  });
}

// Initialen extrahieren
function getInitials(username) {
  if (!username) return '?';
  const parts = username.split(/[\s_-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.substring(0, 2).toUpperCase();
}

// Benutzer löschen
function deleteUser(username) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  if (username === currentUser.username) {
    alert('Du kannst dich nicht selbst löschen!');
    return;
  }
  
  if (confirm(`Möchtest du den Benutzer "${username}" wirklich löschen?`)) {
    AdminStorage.deleteUser(username);
    AdminStorage.addActivity(`Benutzer ${username} wurde gelöscht`);
    loadUsersList();
    loadStatistics();
    showMessage('Benutzer erfolgreich gelöscht!', false);
  }
}

// Admin-Status umschalten
function toggleUserAdmin(username) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  if (username === currentUser.username) {
    alert('Du kannst deinen eigenen Admin-Status nicht ändern!');
    return;
  }
  
  const users = AdminStorage.getUsers();
  const user = users.find(u => u.username === username);
  
  if (user) {
    const newStatus = !user.isAdmin;
    const action = newStatus ? 'Admin-Rechte erteilt' : 'Admin-Rechte entzogen';
    
    if (confirm(`Möchtest du ${username} wirklich ${newStatus ? 'zum Admin machen' : 'als Admin entfernen'}?`)) {
      AdminStorage.toggleUserAdmin(username);
      AdminStorage.addActivity(`${username}: ${action}`);
      loadUsersList();
      loadStatistics();
      showMessage(`${action} für ${username}!`, false);
    }
  }
}

// Benutzer bearbeiten
function editUser(username) {
  const users = AdminStorage.getUsers();
  const user = users.find(u => u.username === username);
  
  if (!user) return;
  
  // Modal öffnen
  const modal = document.getElementById('user-modal');
  document.getElementById('edit-username').value = username;
  document.getElementById('edit-email').value = user.email;
  document.getElementById('edit-password').value = '';
  document.getElementById('edit-is-admin').checked = user.isAdmin || false;
  
  // Eigenen Admin-Status sperren
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (username === currentUser.username) {
    document.getElementById('edit-is-admin').disabled = true;
  } else {
    document.getElementById('edit-is-admin').disabled = false;
  }
  
  modal.classList.add('active');
}

// User Modal schließen
function closeUserModal() {
  const modal = document.getElementById('user-modal');
  modal.classList.remove('active');
}

// Funktionen global verfügbar machen
window.editUser = editUser;
window.closeUserModal = closeUserModal;
window.deleteUser = deleteUser;
window.toggleUserAdmin = toggleUserAdmin;

// Einstellungen laden
function loadSettings() {
  const settings = AdminStorage.getSettings();
  
  document.getElementById('allow-registration').checked = settings.allowRegistration;
  document.getElementById('maintenance-mode').checked = settings.maintenanceMode;
  document.getElementById('default-dark-mode').checked = settings.defaultDarkMode;
}

// Einstellungen speichern
function saveSettings() {
  const settings = {
    allowRegistration: document.getElementById('allow-registration').checked,
    maintenanceMode: document.getElementById('maintenance-mode').checked,
    defaultDarkMode: document.getElementById('default-dark-mode').checked
  };
  
  AdminStorage.saveSettings(settings);
  AdminStorage.addActivity('System-Einstellungen aktualisiert');
  showSettingsMessage('Einstellungen erfolgreich gespeichert! ✅', false);
}

// Aktivitäten laden
function loadActivities() {
  const activities = AdminStorage.getActivities();
  const activityLog = document.getElementById('activity-log');
  
  if (!activityLog) return;
  
  if (activities.length === 0) {
    activityLog.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Keine Aktivitäten vorhanden.</p>';
    return;
  }
  
  activityLog.innerHTML = activities.map(activity => {
    const date = new Date(activity.timestamp);
    const timeString = date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
      <div class="activity-item">
        <div class="activity-time">${timeString}</div>
        <div class="activity-text">${activity.text}</div>
      </div>
    `;
  }).join('');
}

// Nachricht anzeigen
function showMessage(message, isError = false) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${isError ? 'error' : 'success'}`;
  messageEl.textContent = message;
  messageEl.style.position = 'fixed';
  messageEl.style.top = '20px';
  messageEl.style.right = '20px';
  messageEl.style.zIndex = '10000';
  messageEl.style.minWidth = '300px';
  messageEl.style.animation = 'slideInRight 0.3s ease';
  
  document.body.appendChild(messageEl);
  
  setTimeout(() => {
    messageEl.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => messageEl.remove(), 300);
  }, 3000);
}

// Einstellungs-Nachricht
function showSettingsMessage(message, isError = false) {
  const messageEl = document.getElementById('settings-message');
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.className = `message ${isError ? 'error' : 'success'}`;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 5000);
  }
}

// Event Listeners
function setupEventListeners() {
  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Möchtest du dich wirklich abmelden?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/';
      }
    });
  }
  
  // Benutzer aktualisieren
  const refreshBtn = document.getElementById('refresh-users-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadUsersList();
      showMessage('Benutzerliste aktualisiert!', false);
    });
  }
  
  // Benutzersuche
  const searchInput = document.getElementById('user-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      loadUsersList(e.target.value);
    });
  }
  
  // Einstellungen speichern
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveSettings);
  }
  
  // Schnellaktionen
  document.getElementById('clear-cache-btn')?.addEventListener('click', () => {
    if (confirm('Cache wirklich leeren? Dies kann nicht rückgängig gemacht werden.')) {
      // Nur bestimmte Cache-Daten löschen, nicht Login-Daten
      localStorage.removeItem('activities');
      AdminStorage.addActivity('Cache geleert');
      loadActivities();
      showMessage('Cache erfolgreich geleert!', false);
    }
  });
  
  document.getElementById('export-users-btn')?.addEventListener('click', () => {
    const users = AdminStorage.getUsers();
    const data = JSON.stringify(users, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${Date.now()}.json`;
    a.click();
    AdminStorage.addActivity('Benutzerdaten exportiert');
    showMessage('Benutzerdaten erfolgreich exportiert!', false);
  });
  
  document.getElementById('backup-data-btn')?.addEventListener('click', () => {
    const backup = {
      users: AdminStorage.getUsers(),
      settings: AdminStorage.getSettings(),
      activities: AdminStorage.getActivities(),
      timestamp: new Date().toISOString()
    };
    const data = JSON.stringify(backup, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${Date.now()}.json`;
    a.click();
    AdminStorage.addActivity('System-Backup erstellt');
    showMessage('Backup erfolgreich erstellt!', false);
  });
  
  document.getElementById('view-logs-btn')?.addEventListener('click', () => {
    loadActivities();
    showMessage('Logs aktualisiert!', false);
  });
  
  // User Edit Form Submit
  document.getElementById('user-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('edit-username').value;
    const email = document.getElementById('edit-email').value;
    const password = document.getElementById('edit-password').value;
    const isAdmin = document.getElementById('edit-is-admin').checked;
    
    const updates = { email, isAdmin };
    if (password) {
      updates.password = password;
    }
    
    if (AdminStorage.updateUser(username, updates)) {
      AdminStorage.addActivity(`Benutzer ${username} aktualisiert`);
      loadUsersList();
      closeUserModal();
      showMessage('Benutzer erfolgreich aktualisiert!', false);
    } else {
      alert('Fehler beim Aktualisieren des Benutzers');
    }
  });
  
  // User Modal schließen bei Klick außerhalb
  document.getElementById('user-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'user-modal') {
      closeUserModal();
    }
  });
  
  // Tab-Switching für Content-Verwaltung
  initContentTabs();
}

// Tab-Switching initialisieren
function initContentTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // Alle Tabs und Buttons deaktivieren
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
      // Ausgewählten Tab und Button aktivieren
      button.classList.add('active');
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });
}

// CSS für Animationen hinzufügen
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
