// API-Route: Login
import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { getUserByEmail, getUserByUsername, createSession, saveUser, type User } from '../../../lib/kv';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const data = await request.json();
    const { email, password, migrateFromLocalStorage } = data;

    console.log('🔐 Login-Versuch:', { email });

    // Validierung
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'E-Mail/Username und Passwort sind erforderlich' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // User aus Datenbank holen (versuche Email, dann Username)
    let user = await getUserByEmail(email);
    if (!user) {
      user = await getUserByUsername(email); // email-Parameter kann auch Username sein
    }
    
    let wasMigrated = false;
    
    // Falls User nicht in Redis existiert, aber LocalStorage-Daten mitgeschickt wurden
    if (!user && migrateFromLocalStorage) {
      console.log('📦 Migriere User aus LocalStorage:', email);
      
      // Prüfe ob Passwort übereinstimmt (LocalStorage speichert Klartext!)
      if (migrateFromLocalStorage.password !== password) {
        return new Response(JSON.stringify({ error: 'Ungültige Anmeldedaten' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Erstelle User aus LocalStorage-Daten mit gehashtem Passwort
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser: User = {
        id: crypto.randomUUID(),
        username: migrateFromLocalStorage.username,
        email: migrateFromLocalStorage.email,
        emailVerified: false,
        password: hashedPassword,
        provider: 'local',
        isAdmin: migrateFromLocalStorage.isAdmin || false,
        createdAt: migrateFromLocalStorage.registeredDate || new Date().toISOString()
      };
      
      await saveUser(newUser);
      user = newUser;
      wasMigrated = true;
      console.log('✅ User aus LocalStorage migriert:', user.username);
    }
    
    if (!user) {
      console.log('❌ User nicht gefunden:', email);
      return new Response(JSON.stringify({ 
        error: 'Ungültige Anmeldedaten',
        needsMigration: true // Signal an Frontend: LocalStorage-Daten mitsenden
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prüfe ob lokaler Account (kein OAuth)
    if (user.provider !== 'local') {
      return new Response(JSON.stringify({ 
        error: `Dieser Account nutzt ${user.provider}-Login. Bitte melde dich mit ${user.provider} an.` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prüfe ob Passwort existiert
    if (!user.password) {
      console.log('❌ Kein Passwort gesetzt für:', email);
      return new Response(JSON.stringify({ 
        error: 'Dieser Account hat kein Passwort. Bitte setze zuerst ein Passwort über "Passwort vergessen".' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Passwort prüfen (außer bei gerade migrierten Usern)
    if (!wasMigrated) {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        console.log('❌ Falsches Passwort für:', email);
        return new Response(JSON.stringify({ error: 'Ungültige Anmeldedaten' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

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

    console.log('✅ Login erfolgreich:', user.username);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Login erfolgreich',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        emailVerified: user.emailVerified
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Login-Fehler:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Interner Serverfehler',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
