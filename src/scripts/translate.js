// Übersetzungen für die Webseite
const translations = {
    'de': {
        'nav-home': 'Startseite',
        'nav-about': 'Über mich',
        'nav-projects': 'Projekte', 
        'nav-failed': 'Gescheiterte und neu angefangende Projekte',
        'nav-login': 'Anmelden',
        'nav-register': 'Registrieren',
        'welcome-title': 'Willkommen auf meiner Webseite',
        'welcome-intro': 'Dies ist die offizielle Webseite von UEBlackWulfGHG.\nOder auch bekannt als Wulfy.\noder bessergesagt Euch meiner Community.',
        'welcome-description': 'Hier werdet ihr meine Projekte, Updates und vieles mehr finden.\nIch werde versuchen, die Seite regelmäßig zu aktualisieren und immer auf dem Laufenden zu halten.',
        'footer-contact': 'Kontakt',
        'footer-email': 'Oder auch per Email: wulfghg@gmail.com',
        'footer-discord': 'Zum Discord Server:',
        'footer-server': 'Server'
    },
    'en': {
        'nav-home': 'Home',
        'nav-about': 'About Me',
        'nav-projects': 'Projects',
        'nav-failed': 'Failed and Newly Started Projects',
        'nav-login': 'Login',
        'nav-register': 'Register',
        'welcome-title': 'Welcome to my Website',
        'welcome-intro': 'This is the official website of UEBlackWulfGHG.\nAlso known as Wulfy.\nor better said to you, my community.',
        'welcome-description': 'Here you will find my projects, updates and much more.\nI will try to update the site regularly and keep it up to date.',
        'footer-contact': 'Contact',
        'footer-email': 'Or also by email: wulfghg@gmail.com',
        'footer-discord': 'To Discord Server:',
        'footer-server': 'Server'
    }
};

let currentLanguage = 'de';

// Übersetzung der Seite
function translatePage(language) {
    if (!translations[language]) return;
    
    currentLanguage = language;
    const elements = document.querySelectorAll('[data-translate]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[language][key]) {
            // Für mehrzeilige Texte die \n durch <br> ersetzen
            const translation = translations[language][key].replace(/\n/g, '<br>');
            element.innerHTML = translation;
        }
    });
    
    // Button-Text aktualisieren
    const translateBtn = document.getElementById('translateBtn');
    if (translateBtn) {
        translateBtn.textContent = language === 'de' ? '🌐 EN' : '🌐 DE';
    }
    
    // Sprache im LocalStorage speichern
    localStorage.setItem('language', language);
}

// Event-Listener für den Übersetzungsbutton
document.addEventListener('DOMContentLoaded', function() {
    const translateBtn = document.getElementById('translateBtn');
    
    if (translateBtn) {
        // Gespeicherte Sprache laden
        const savedLanguage = localStorage.getItem('language') || 'de';
        if (savedLanguage !== 'de') {
            translatePage(savedLanguage);
        }
        
        translateBtn.addEventListener('click', function() {
            const newLanguage = currentLanguage === 'de' ? 'en' : 'de';
            translatePage(newLanguage);
        });
    }
});