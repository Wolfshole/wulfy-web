// Vercel KV Helper für User-Daten
import { kv } from '@vercel/kv';

export interface User {
  id: string;
  username: string;
  email: string;
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
export async function createSession(userId: string, expiresInDays: number = 30): Promise<string> {
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
