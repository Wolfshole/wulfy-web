import type { APIRoute } from 'astro';
import { getAllUsers, validateSession } from '../../lib/kv';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Session validieren
    const sessionId = cookies.get('session_id')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Nicht authentifiziert' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await validateSession(sessionId);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Ungültige Session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prüfen ob Admin
    if (!user.isAdmin) {
      return new Response(JSON.stringify({ error: 'Keine Berechtigung' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Statistiken berechnen
    const users = await getAllUsers();
    const totalUsers = users.length;
    const totalAdmins = users.filter(u => u.isAdmin).length;
    const verifiedUsers = users.filter(u => u.emailVerified).length;

    return new Response(JSON.stringify({
      totalUsers,
      totalAdmins,
      verifiedUsers,
      siteStatus: 'Online',
      currentDate: new Date().toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Fehler beim Laden der Statistiken:', error);
    return new Response(JSON.stringify({ error: 'Interner Serverfehler' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
