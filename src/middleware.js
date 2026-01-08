// Wartungsmodus Middleware
// Setze MAINTENANCE_MODE auf 'false' um die Seite wieder freizugeben
const MAINTENANCE_MODE = true;

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
    '/api/'
  ];
  
  const isAllowedPath = allowedPaths.some(path => url.pathname.startsWith(path));
  
  // Wenn Wartungsmodus aktiv und Pfad nicht erlaubt, redirect zur Wartungsseite
  if (isMaintenanceMode && !isAllowedPath) {
    return redirect('/maintenance');
  }
  
  // Normale Anfrage fortsetzen
  return next();
}

