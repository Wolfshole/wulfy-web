// API-Route: Passwort-Reset anfordern
import type { APIRoute } from 'astro';
import { createPasswordResetToken, getUserByEmail } from '../../../lib/kv';
import { sendPasswordResetEmail } from '../../../lib/email';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { email } = data;

    if (!email) {
      return new Response(JSON.stringify({ error: 'E-Mail ist erforderlich' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // User finden
    const user = await getUserByEmail(email);
    
    // Aus Sicherheitsgründen immer Erfolg zurückgeben (auch wenn User nicht existiert)
    // So kann man nicht herausfinden, welche E-Mails registriert sind
    if (!user) {
      return new Response(JSON.stringify({ 
        message: 'Falls ein Account mit dieser E-Mail existiert, wurde eine E-Mail zum Zurücksetzen gesendet.' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Nur für lokale Accounts (nicht OAuth)
    if (user.provider !== 'local') {
      return new Response(JSON.stringify({ 
        error: `Dieser Account verwendet ${user.provider} zum Einloggen. Bitte logge dich über ${user.provider} ein.` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Token erstellen
    const token = await createPasswordResetToken(email);
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Fehler beim Erstellen des Reset-Tokens' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // E-Mail senden
    const success = await sendPasswordResetEmail(user.email, user.username, token);

    if (!success) {
      // Für Entwicklung: Gib eine hilfreiche Nachricht
      console.error('E-Mail-Versand fehlgeschlagen. Prüfe ob RESEND_API_KEY konfiguriert ist.');
      return new Response(JSON.stringify({ 
        error: 'E-Mail-Dienst ist nicht konfiguriert. Bitte kontaktiere den Administrator.',
        dev_info: import.meta.env.DEV ? 'Resend API-Key fehlt in .env' : undefined
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Falls ein Account mit dieser E-Mail existiert, wurde eine E-Mail zum Zurücksetzen gesendet.',
      email: user.email
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Passwort-Reset-Fehler:', error);
    
    // Detaillierte Fehlermeldung in Entwicklung
    if (import.meta.env.DEV) {
      return new Response(JSON.stringify({ 
        error: 'Interner Serverfehler',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        hint: 'Vercel KV ist möglicherweise nicht konfiguriert. Für lokale Entwicklung benötigst du KV_REST_API_URL und KV_REST_API_TOKEN in der .env'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Interner Serverfehler' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
