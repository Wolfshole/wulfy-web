import type { APIRoute } from 'astro';
import { getAllUsers, validateSession } from '../../../lib/kv';

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

    // Alle Benutzer abrufen
    const users = await getAllUsers();

    // Passwörter aus Response entfernen
    const sanitizedUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      emailVerified: u.emailVerified,
      avatar: u.avatar,
      provider: u.provider,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt
    }));

    return new Response(JSON.stringify({ users: sanitizedUsers }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Fehler beim Laden der Benutzerliste:', error);
    return new Response(JSON.stringify({ error: 'Interner Serverfehler' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
