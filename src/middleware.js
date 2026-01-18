// Wartungsmodus Middleware
// Setze MAINTENANCE_MODE auf 'false' um die Seite wieder freizugeben
const MAINTENANCE_MODE = false;

export async function onRequest(context, next) {
  const { url, redirect } = context;
  
  // Prüfe ob Wartungsmodus aktiv ist
  const isMaintenanceMode = MAINTENANCE_MODE;
  
  // Admin-Bereiche und API-Routen immer erlauben
  const allowedPaths = [
    '/maintenance',
    '/dashboard',
    '/profile',
    '/login',
    '/register',
    '/api/',
    '/scripts/',
    '/styles/'
  ];
  
  const isAllowedPath = allowedPaths.some(path => url.pathname.startsWith(path));
  
  // Wenn Wartungsmodus aktiv und nicht auf erlaubtem Pfad
  if (isMaintenanceMode && !isAllowedPath) {
    // Nicht-Admins zur Wartungsseite (vereinfachte Logik für lokale Entwicklung)
    return redirect('/maintenance');
  }
  
  // Normale Anfrage fortsetzen
  return next();
}


