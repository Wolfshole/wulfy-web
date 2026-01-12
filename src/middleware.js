// Wartungsmodus Middleware
// Setze MAINTENANCE_MODE auf 'false' um die Seite wieder freizugeben
const MAINTENANCE_MODE = false;

export async function onRequest(context, next) {
  const { url, redirect, cookies } = context;
  
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
  
  // Wenn Wartungsmodus aktiv
  if (isMaintenanceMode && !isAllowedPath) {
    // Prüfe ob User Admin ist
    const sessionId = cookies.get('session_id')?.value;
    
    if (sessionId) {
      try {
        // Importiere KV-Funktion dynamisch
        const { validateSession } = await import('./lib/kv.ts');
        const user = await validateSession(sessionId);
        
        // Wenn Admin, erlaube Zugriff
        if (user?.isAdmin) {
          return next();
        }
      } catch (error) {
        console.error('Session validation error:', error);
      }
    }
    
    // Nicht-Admins zur Wartungsseite
    return redirect('/maintenance');
  }
  
  // Normale Anfrage fortsetzen
  return next();
}


