// Vercel KV Helper für User-Daten
import { kv } from '@vercel/kv';

export interface User {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  password?: string; // Nur für 'local' Provider
  avatar?: string;
  provider: 'discord' | 'google' | 'apple' | 'twitch' | 'local';
  isAdmin: boolean;
  createdAt: string;
}

export interface Session {
  userId: string;
  expiresAt: number;
}

// User speichern
export async function saveUser(user: User): Promise<void> {
  await kv.set(`user:${user.id}`, user);
  
  // Email-Index für schnelle Suche
  if (user.email) {
    await kv.set(`email:${user.email}`, user.id);
  }
}

// User abrufen
export async function getUser(userId: string): Promise<User | null> {
  return await kv.get(`user:${userId}`);
}

// User per Email finden
export async function getUserByEmail(email: string): Promise<User | null> {
  const userId = await kv.get<string>(`email:${email}`);
  if (!userId) return null;
  return await getUser(userId);
}

// Session erstellen
// Standard: 365 Tage (1 Jahr) - User bleibt lange eingeloggt
export async function createSession(userId: string, expiresInDays: number = 365): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + (expiresInDays * 24 * 60 * 60 * 1000);
  
  const session: Session = {
    userId,
    expiresAt
  };
  
  await kv.set(`session:${sessionId}`, session, {
    ex: expiresInDays * 24 * 60 * 60 // TTL in Sekunden
  });
  
  return sessionId;
}

// Session validieren
export async function validateSession(sessionId: string): Promise<User | null> {
  const session = await kv.get<Session>(`session:${sessionId}`);
  
  if (!session) return null;
  
  // Prüfe ob abgelaufen
  if (session.expiresAt < Date.now()) {
    await kv.del(`session:${sessionId}`);
    return null;
  }
  
  return await getUser(session.userId);
}

// Session löschen (Logout)
export async function deleteSession(sessionId: string): Promise<void> {
  await kv.del(`session:${sessionId}`);
}

// User löschen
export async function deleteUser(userId: string): Promise<void> {
  const user = await getUser(userId);
  
  if (user?.email) {
    await kv.del(`email:${user.email}`);
  }
  
  await kv.del(`user:${userId}`);
}

// Admin-Check: Bestimmte Usernames oder Emails sind automatisch Admins
const ADMIN_USERNAMES = ['Wulfy', 'UEBlackWulfGHG', 'ueblackwulf', 'ueblackwolf'];
const ADMIN_EMAILS = ['wulfghg@gmail.com', 'e94111993@gmail.com'];

export function isAdminUser(username: string, email?: string): boolean {
  return ADMIN_USERNAMES.some(admin => admin.toLowerCase() === username.toLowerCase()) ||
         Boolean(email && ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === email.toLowerCase()));
}

// User zu Admin machen
export async function setAdmin(userId: string, isAdmin: boolean = true): Promise<void> {
  const user = await getUser(userId);
  if (user) {
    user.isAdmin = isAdmin;
    await saveUser(user);
  }
}

// E-Mail-Verifikationstoken erstellen
export async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  await kv.set(`email-verify:${token}`, userId, {
    ex: 24 * 60 * 60 // 24 Stunden gültig
  });
  return token;
}

// E-Mail-Verifikationstoken validieren
export async function verifyEmailToken(token: string): Promise<User | null> {
  const userId = await kv.get<string>(`email-verify:${token}`);
  if (!userId) return null;
  
  const user = await getUser(userId);
  if (!user) return null;
  
  // E-Mail als verifiziert markieren
  user.emailVerified = true;
  await saveUser(user);
  
  // Token löschen
  await kv.del(`email-verify:${token}`);
  
  return user;
}

// E-Mail als verifiziert markieren
export async function markEmailVerified(userId: string): Promise<void> {
  const user = await getUser(userId);
  if (user) {
    user.emailVerified = true;
    await saveUser(user);
  }
}

// Passwort-Reset-Token erstellen
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  
  const token = crypto.randomUUID();
  await kv.set(`password-reset:${token}`, user.id, {
    ex: 60 * 60 // 1 Stunde gültig
  });
  
  return token;
}

// Passwort-Reset-Token validieren
export async function validatePasswordResetToken(token: string): Promise<string | null> {
  const userId = await kv.get<string>(`password-reset:${token}`);
  return userId;
}

// Passwort zurücksetzen
export async function resetPassword(token: string, newPasswordHash: string): Promise<User | null> {
  const userId = await validatePasswordResetToken(token);
  if (!userId) return null;
  
  const user = await getUser(userId);
  if (!user) return null;
  
  // Passwort aktualisieren
  user.password = newPasswordHash;
  await saveUser(user);
  
  // Token löschen
  await kv.del(`password-reset:${token}`);
  
  return user;
}
