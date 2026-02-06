// API-Route: Registrierung
import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { saveUser, getUserByEmail, createSession, isAdminUser, createEmailVerificationToken, type User } from '../../../lib/kv';
import { sendVerificationEmail } from '../../../lib/email';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const data = await request.json();
    const { username, email, password } = data;

    console.log('📝 Registrierung gestartet:', { username, email });

    // Validierung
    if (!username || !email || !password) {
      return new Response(JSON.stringify({ error: 'Alle Felder sind erforderlich' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (username.length < 3) {
      return new Response(JSON.stringify({ error: 'Benutzername muss mindestens 3 Zeichen lang sein' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Passwort muss mindestens 8 Zeichen lang sein' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prüfe ob E-Mail bereits existiert
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      console.log('❌ E-Mail bereits registriert:', email);
      return new Response(JSON.stringify({ error: 'E-Mail-Adresse ist bereits registriert' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // User erstellen
    const user: User = {
      id: crypto.randomUUID(),
      username,
      email,
      emailVerified: false, // Muss erst verifiziert werden
      password: hashedPassword,
      provider: 'local',
      isAdmin: isAdminUser(username, email),
      createdAt: new Date().toISOString()
    };

    // User speichern
    await saveUser(user);
    console.log('✅ User gespeichert:', user.id);

    // Session erstellen
    const sessionId = await createSession(user.id);
    
    // Session-Cookie setzen
    cookies.set('session_id', sessionId, {
      path: '/',
      httpOnly: true,
      secure: false, // Im Dev-Mode false
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 // 1 Jahr
    });

    console.log('✅ Session erstellt:', sessionId);

    // Verifikations-E-Mail senden (fire and forget - soll Registrierung nicht blockieren)
    try {
      const verificationToken = await createEmailVerificationToken(user.id);
      await sendVerificationEmail(user.email, user.username, verificationToken);
      console.log('📧 Verifikations-E-Mail gesendet an:', user.email);
    } catch (emailError) {
      console.warn('⚠️ Verifikations-E-Mail konnte nicht gesendet werden:', emailError);
      // Registrierung läuft trotzdem weiter
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Registrierung erfolgreich',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Registrierungs-Fehler:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Interner Serverfehler',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
