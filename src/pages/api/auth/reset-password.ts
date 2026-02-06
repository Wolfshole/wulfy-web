// API-Route: Neues Passwort setzen
import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { resetPassword, validatePasswordResetToken, getUser } from '../../../lib/kv';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { token, password } = data;

    if (!token || !password) {
      return new Response(JSON.stringify({ error: 'Token und Passwort sind erforderlich' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Passwort-Validierung
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Passwort muss mindestens 8 Zeichen lang sein' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Token validieren
    const userId = await validatePasswordResetToken(token);
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Ungültiger oder abgelaufener Token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Passwort hashen
    const passwordHash = await bcrypt.hash(password, 10);

    // Passwort zurücksetzen
    const user = await resetPassword(token, passwordHash);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Fehler beim Zurücksetzen des Passworts' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Passwort erfolgreich zurückgesetzt. Du kannst dich jetzt einloggen.',
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Passwort-Reset-Fehler:', error);
    return new Response(JSON.stringify({ error: 'Interner Serverfehler' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
