// Redis/Upstash für User-Daten mit In-Memory-Fallback
import Redis from "ioredis";
import InMemoryStore from "./in-memory-store";
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Lade .env und .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env') });
config({ path: resolve(__dirname, '../../.env.local'), override: true });

// Store-Initialisierung
let storePromise: Promise<Redis | InMemoryStore> | null = null;

async function initStore() {
  console.log("🔍 Debug - process.env.REDIS_URL:", process.env.REDIS_URL ? "GEFUNDEN" : "NICHT GEFUNDEN");
  console.log("🔍 Debug - ALL ENV VARS:", Object.keys(process.env).filter(k => k.includes('REDIS')));
  
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn("⚠️  REDIS_URL nicht gefunden - nutze In-Memory-Store");
    console.warn("📝 Daten gehen bei Server-Neustart verloren!");
    return new InMemoryStore();
  }

  try {
    console.log("🔍 Verbinde mit Redis...");
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      retryStrategy(times) {
        if (times > 3) {
          console.warn("❌ Redis-Verbindung nach 3 Versuchen fehlgeschlagen");
          return null; // Stop retrying
        }
        const delay = Math.min(times * 200, 2000);
        console.log(`🔄 Retry ${times}/3 in ${delay}ms...`);
        return delay;
      }
    });

    // Warte auf Verbindung
    await redis.ping();
    console.log("✅ Redis verbunden (Daten bleiben erhalten)");
    return redis;
  } catch (error) {
    console.warn("⚠️  Redis-Verbindung fehlgeschlagen - nutze In-Memory-Store");
    console.warn("📝 Daten gehen bei Server-Neustart verloren!");
    console.error(
      "Redis Error:",
      error instanceof Error ? error.message : error,
    );
    return new InMemoryStore();
  }
}

function getStore(): Promise<Redis | InMemoryStore> {
  if (!storePromise) {
    storePromise = initStore();
  }
  return storePromise;
}

export interface User {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  password?: string; // Nur für 'local' Provider
  avatar?: string;
  provider: "discord" | "google" | "apple" | "twitch" | "local";
  isAdmin: boolean;
  createdAt: string;
}

export interface Session {
  userId: string;
  expiresAt: number;
}

// User speichern
export async function saveUser(user: User): Promise<void> {
  const client = await getStore();
  await client.set(`user:${user.id}`, JSON.stringify(user));

  // Email-Index für schnelle Suche
  if (user.email) {
    await client.set(`email:${user.email}`, user.id);
  }
  
  // Username-Index für schnelle Suche
  if (user.username) {
    await client.set(`username:${user.username.toLowerCase()}`, user.id);
  }
}

// User abrufen
export async function getUser(userId: string): Promise<User | null> {
  const client = await getStore();
  const data = await client.get(`user:${userId}`);
  return data ? JSON.parse(data as string) : null;
}

// User per Email finden
export async function getUserByEmail(email: string): Promise<User | null> {
  const client = await getStore();
  const userId = await client.get(`email:${email}`);
  if (!userId) return null;
  return await getUser(userId as string);
}

// User per Username finden
export async function getUserByUsername(username: string): Promise<User | null> {
  const client = await getStore();
  const userId = await client.get(`username:${username.toLowerCase()}`);
  if (!userId) return null;
  return await getUser(userId as string);
}

// Session erstellen
// Standard: 365 Tage (1 Jahr) - User bleibt lange eingeloggt
export async function createSession(
  userId: string,
  expiresInDays: number = 365,
): Promise<string> {
  const client = await getStore();
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;

  const session: Session = {
    userId,
    expiresAt,
  };

  const ttl = expiresInDays * 24 * 60 * 60; // TTL in Sekunden
  await client.set(`session:${sessionId}`, JSON.stringify(session), "EX", ttl);

  return sessionId;
}

// Session validieren
export async function validateSession(sessionId: string): Promise<User | null> {
  const client = await getStore();
  const data = await client.get(`session:${sessionId}`);

  if (!data) return null;

  const session: Session = JSON.parse(data as string);

  // Prüfe ob abgelaufen
  if (session.expiresAt < Date.now()) {
    await client.del(`session:${sessionId}`);
    return null;
  }

  return await getUser(session.userId);
}

// Session löschen (Logout)
export async function deleteSession(sessionId: string): Promise<void> {
  const client = await getStore();
  await client.del(`session:${sessionId}`);
}

// User löschen
export async function deleteUser(userId: string): Promise<void> {
  const client = await getStore();
  const user = await getUser(userId);

  if (user?.email) {
    await client.del(`email:${user.email}`);
  }

  await client.del(`user:${userId}`);
}

// Admin-Check: Bestimmte Usernames oder Emails sind automatisch Admins
const ADMIN_USERNAMES = [
  "Wulfy",
  "UEBlackWulfGHG",
  "ueblackwulf",
  "ueblackwolf",
];
const ADMIN_EMAILS = ["wulfghg@gmail.com", "e94111993@gmail.com"];

export function isAdminUser(username: string, email?: string): boolean {
  return (
    ADMIN_USERNAMES.some(
      (admin) => admin.toLowerCase() === username.toLowerCase(),
    ) ||
    Boolean(
      email &&
      ADMIN_EMAILS.some(
        (adminEmail) => adminEmail.toLowerCase() === email.toLowerCase(),
      ),
    )
  );
}

// User zu Admin machen
export async function setAdmin(
  userId: string,
  isAdmin: boolean = true,
): Promise<void> {
  const user = await getUser(userId);
  if (user) {
    user.isAdmin = isAdmin;
    await saveUser(user);
  }
}

// E-Mail-Verifikationstoken erstellen
export async function createEmailVerificationToken(
  userId: string,
): Promise<string> {
  const client = await getStore();
  const token = crypto.randomUUID();
  const ttl = 24 * 60 * 60; // 24 Stunden
  await client.set(`email-verify:${token}`, userId, "EX", ttl);
  return token;
}

// E-Mail-Verifikationstoken validieren
export async function verifyEmailToken(token: string): Promise<User | null> {
  const client = await getStore();
  const userId = (await client.get(`email-verify:${token}`)) as string | null;
  if (!userId) return null;

  const user = await getUser(userId);
  if (!user) return null;

  // E-Mail als verifiziert markieren
  user.emailVerified = true;
  await saveUser(user);

  // Token löschen
  await client.del(`email-verify:${token}`);

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
export async function createPasswordResetToken(
  email: string,
): Promise<string | null> {
  const client = await getStore();
  const user = await getUserByEmail(email);
  if (!user) return null;

  const token = crypto.randomUUID();
  const ttl = 60 * 60; // 1 Stunde
  await client.set(`password-reset:${token}`, user.id, "EX", ttl);

  return token;
}

// Passwort-Reset-Token validieren
export async function validatePasswordResetToken(
  token: string,
): Promise<string | null> {
  const client = await getStore();
  const userId = (await client.get(`password-reset:${token}`)) as string | null;
  return userId;
}

// Passwort zurücksetzen
export async function resetPassword(
  token: string,
  newPasswordHash: string,
): Promise<User | null> {
  const client = await getStore();
  const userId = await validatePasswordResetToken(token);
  if (!userId) return null;

  const user = await getUser(userId);
  if (!user) return null;

  // Passwort aktualisieren
  user.password = newPasswordHash;
  await saveUser(user);

  // Token löschen
  await client.del(`password-reset:${token}`);

  return user;
}

// Store sofort initialisieren beim Modul-Import
getStore();
