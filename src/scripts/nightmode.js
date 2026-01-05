// Nachtmodus Funktionalität
document.addEventListener('DOMContentLoaded', () => {
    const nightModeBtn = document.getElementById('nightModeBtn');
    const htmlElement = document.documentElement;

    // Gespeicherten Theme-Status laden
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        htmlElement.setAttribute('data-theme', 'dark');
        updateButtonText(nightModeBtn, true);
    }

    // Button Click Event
    nightModeBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        
        if (currentTheme === 'dark') {
            htmlElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            updateButtonText(nightModeBtn, false);
        } else {
            htmlElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            updateButtonText(nightModeBtn, true);
        }
    });
});

function updateButtonText(button, isDark) {
    button.textContent = isDark ? 'Light Mode' : 'Night Mode';
}
