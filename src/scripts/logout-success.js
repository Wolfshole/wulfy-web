// Logout Success Script - Löscht localStorage und leitet weiter

localStorage.removeItem('isLoggedIn');
localStorage.removeItem('currentUser');
window.location.href = '/';
