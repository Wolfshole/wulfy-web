// Wartungsmodus Middleware
export async function onRequest(context, next) {
  const { url } = context;
  
  // Prüfe ob Wartungsmodus aktiv ist (über Vercel Environment Variable)
  const isMaintenanceMode = import.meta.env.MAINTENANCE_MODE === 'true';
  
  // Admin-Bereiche und API-Routen immer erlauben
  const allowedPaths = [
    '/dashboard',
    '/profile',
    '/login',
    '/register',
    '/api/'
  ];
  
  const isAllowedPath = allowedPaths.some(path => url.pathname.startsWith(path));
  
  // Wenn Wartungsmodus aktiv und Pfad nicht erlaubt, zeige Wartungsseite
  if (isMaintenanceMode && !isAllowedPath) {
    return new Response(
      `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🚧 Wartungsmodus</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 2rem;
    }
    
    .container {
      text-align: center;
      max-width: 600px;
      animation: fadeIn 0.5s ease-in;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .icon {
      font-size: 8rem;
      margin-bottom: 2rem;
      animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }
    
    p {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      opacity: 0.9;
      line-height: 1.6;
    }
    
    .info {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .info p {
      margin: 0;
      font-size: 1rem;
    }
    
    @media (max-width: 768px) {
      .icon { font-size: 5rem; }
      h1 { font-size: 2rem; }
      p { font-size: 1rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🚧</div>
    <h1>Wartungsmodus</h1>
    <p>Wir führen gerade wichtige Wartungsarbeiten durch, um die Seite für dich zu verbessern.</p>
    <p>Wir sind bald wieder für dich da!</p>
    
    <div class="info">
      <p>Bei Fragen kontaktiere uns gerne.</p>
    </div>
  </div>
</body>
</html>`,
      {
        status: 503,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Retry-After': '3600'
        }
      }
    );
  }
  
  // Normale Anfrage fortsetzen
  return next();
}
