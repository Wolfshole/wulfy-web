// API-Route: E-Mail-Verifikation senden
import type { APIRoute } from 'astro';
import { validateSession, createEmailVerificationToken } from '../../../lib/kv';
import { sendVerificationEmail } from '../../../lib/email';

export const POST: APIRoute = async ({ cookies, request }) => {
  // Hole Session
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Nicht eingeloggt' }), {
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

  // Prüfe ob bereits verifiziert
  if (user.emailVerified) {
    return new Response(JSON.stringify({ message: 'E-Mail bereits bestätigt' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Token erstellen
  const token = await createEmailVerificationToken(user.id);

  // E-Mail senden
  const success = await sendVerificationEmail(user.email, user.username, token);

  if (!success) {
    return new Response(JSON.stringify({ 
      error: 'E-Mail-Dienst ist nicht konfiguriert. Bitte kontaktiere den Administrator.',
      dev_info: import.meta.env.DEV ? 'Resend API-Key fehlt in .env' : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ 
    message: 'Verifikations-E-Mail wurde gesendet',
    email: user.email 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
