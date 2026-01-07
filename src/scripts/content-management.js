// Content-Verwaltung
function initContentManagement() {
  // Tab-Wechsel
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Alle Tabs deaktivieren
      tabButtons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      
      // Aktiven Tab aktivieren
      btn.classList.add('active');
      const tabId = 'tab-' + btn.dataset.tab;
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Inhalte laden
  loadFAQs();
  loadProjects();
  loadAnnouncements();
}

// FAQ laden
function loadFAQs() {
  const faqs = AdminStorage.getContent('faq');
  const list = document.getElementById('faq-list');
  
  if (!list) return;
  
  if (faqs.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Keine FAQ-Einträge vorhanden.</p>';
    return;
  }
  
  list.innerHTML = faqs.map(faq => {
    return `
      <div class="content-item">
        <div class="content-item-header">
          <h4 class="content-item-title">${faq.question}</h4>
          <div class="content-item-actions">
            <button class="btn-icon" onclick="editContent('faq', '${faq.id}')" title="Bearbeiten">✏️</button>
            <button class="btn-icon delete" onclick="deleteContent('faq', '${faq.id}')" title="Löschen">🗑️</button>
          </div>
        </div>
        <p class="content-item-body">${faq.answer}</p>
        <div class="content-item-meta">
          <span>Erstellt: ${new Date(faq.createdAt).toLocaleDateString('de-DE')}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Projekte laden
function loadProjects() {
  const projects = AdminStorage.getContent('project');
  const list = document.getElementById('projects-list');
  
  if (!list) return;
  
  if (projects.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Keine Projekte vorhanden.</p>';
    return;
  }
  
  list.innerHTML = projects.map(project => {
    const linkHtml = project.url ? `<a href="${project.url}" class="content-item-link" target="_blank">🔗 Link</a>` : '';
    return `
      <div class="content-item">
        <div class="content-item-header">
          <h4 class="content-item-title">${project.title}</h4>
          <div class="content-item-actions">
            <button class="btn-icon" onclick="editContent('project', '${project.id}')" title="Bearbeiten">✏️</button>
            <button class="btn-icon delete" onclick="deleteContent('project', '${project.id}')" title="Löschen">🗑️</button>
          </div>
        </div>
        <p class="content-item-body">${project.description}</p>
        <div class="content-item-meta">
          ${linkHtml}
          <span>Erstellt: ${new Date(project.createdAt).toLocaleDateString('de-DE')}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Ankündigungen laden
function loadAnnouncements() {
  const announcements = AdminStorage.getContent('announcement');
  const list = document.getElementById('announcements-list');
  
  if (!list) return;
  
  if (announcements.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Keine Ankündigungen vorhanden.</p>';
    return;
  }
  
  list.innerHTML = announcements.map(announcement => {
    return `
      <div class="content-item">
        <div class="content-item-header">
          <h4 class="content-item-title">${announcement.title}</h4>
          <div class="content-item-actions">
            <button class="btn-icon" onclick="editContent('announcement', '${announcement.id}')" title="Bearbeiten">✏️</button>
            <button class="btn-icon delete" onclick="deleteContent('announcement', '${announcement.id}')" title="Löschen">🗑️</button>
          </div>
        </div>
        <p class="content-item-body">${announcement.text}</p>
        <div class="content-item-meta">
          <span>Erstellt: ${new Date(announcement.createdAt).toLocaleDateString('de-DE')}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Modal öffnen zum Hinzufügen
function openAddModal(type) {
  const modal = document.getElementById('content-modal');
  const form = document.getElementById('content-form');
  const title = document.getElementById('modal-title');
  const typeInput = document.getElementById('content-type');
  const idInput = document.getElementById('content-id');
  const formFields = document.getElementById('form-fields');
  
  // Reset
  form.reset();
  typeInput.value = type;
  idInput.value = '';
  
  // Titel setzen
  const titles = {
    faq: 'FAQ hinzufügen',
    project: 'Projekt hinzufügen',
    announcement: 'Ankündigung hinzufügen'
  };
  title.textContent = titles[type];
  
  // Formularfelder basierend auf Typ
  const fields = {
    faq: `
      <div class="form-group">
        <label for="question">Frage *</label>
        <input type="text" id="question" name="question" required>
      </div>
      <div class="form-group">
        <label for="answer">Antwort *</label>
        <textarea id="answer" name="answer" required></textarea>
      </div>
    `,
    project: `
      <div class="form-group">
        <label for="title">Projekttitel *</label>
        <input type="text" id="title" name="title" required>
      </div>
      <div class="form-group">
        <label for="description">Beschreibung *</label>
        <textarea id="description" name="description" required></textarea>
      </div>
      <div class="form-group">
        <label for="url">Link (optional)</label>
        <input type="url" id="url" name="url">
      </div>
    `,
    announcement: `
      <div class="form-group">
        <label for="title">Titel *</label>
        <input type="text" id="title" name="title" required>
      </div>
      <div class="form-group">
        <label for="text">Text *</label>
        <textarea id="text" name="text" required></textarea>
      </div>
    `
  };
  
  formFields.innerHTML = fields[type];
  modal.classList.add('active');
}

// Content bearbeiten
function editContent(type, id) {
  const items = AdminStorage.getContent(type);
  const item = items.find(i => i.id === id);
  
  if (!item) return;
  
  const modal = document.getElementById('content-modal');
  const title = document.getElementById('modal-title');
  const typeInput = document.getElementById('content-type');
  const idInput = document.getElementById('content-id');
  
  // Typ und ID setzen
  typeInput.value = type;
  idInput.value = id;
  
  // Titel setzen
  const titles = {
    faq: 'FAQ bearbeiten',
    project: 'Projekt bearbeiten',
    announcement: 'Ankündigung bearbeiten'
  };
  title.textContent = titles[type];
  
  // Modal öffnen
  openAddModal(type);
  
  // Felder ausfüllen
  setTimeout(() => {
    if (type === 'faq') {
      document.getElementById('question').value = item.question || '';
      document.getElementById('answer').value = item.answer || '';
    } else if (type === 'project') {
      document.getElementById('title').value = item.title || '';
      document.getElementById('description').value = item.description || '';
      document.getElementById('url').value = item.url || '';
    } else if (type === 'announcement') {
      document.getElementById('title').value = item.title || '';
      document.getElementById('text').value = item.text || '';
    }
  }, 100);
}

// Content löschen
function deleteContent(type, id) {
  const confirmMessages = {
    faq: 'FAQ-Eintrag',
    project: 'Projekt',
    announcement: 'Ankündigung'
  };
  
  if (confirm(`Möchtest du diesen ${confirmMessages[type]} wirklich löschen?`)) {
    AdminStorage.deleteContent(type, id);
    AdminStorage.addActivity(`${confirmMessages[type]} gelöscht`);
    
    // Liste neu laden
    if (type === 'faq') loadFAQs();
    else if (type === 'project') loadProjects();
    else if (type === 'announcement') loadAnnouncements();
    
    showMessage(`${confirmMessages[type]} erfolgreich gelöscht!`, false);
  }
}

// Modal schließen
function closeModal() {
  const modal = document.getElementById('content-modal');
  modal.classList.remove('active');
}

// Formular absenden
document.addEventListener('DOMContentLoaded', () => {
  const contentForm = document.getElementById('content-form');
  if (contentForm) {
    contentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const type = document.getElementById('content-type').value;
      const id = document.getElementById('content-id').value;
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      if (id) {
        // Bearbeiten
        AdminStorage.updateContent(type, id, data);
        AdminStorage.addActivity(`${type} aktualisiert`);
        showMessage('Erfolgreich aktualisiert!', false);
      } else {
        // Neu hinzufügen
        AdminStorage.addContent(type, data);
        AdminStorage.addActivity(`Neuer ${type} hinzugefügt`);
        showMessage('Erfolgreich hinzugefügt!', false);
      }
      
      // Liste neu laden
      if (type === 'faq') loadFAQs();
      else if (type === 'project') loadProjects();
      else if (type === 'announcement') loadAnnouncements();
      
      closeModal();
      loadActivities();
    });
  }
  
  // Modal schließen bei Klick außerhalb
  const modal = document.getElementById('content-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'content-modal') {
        closeModal();
      }
    });
  }
});

// Funktionen global verfügbar machen
window.openAddModal = openAddModal;
window.editContent = editContent;
window.deleteContent = deleteContent;
window.closeModal = closeModal;
