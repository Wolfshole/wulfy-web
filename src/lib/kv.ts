// Datenspeicherung: Upstash Redis (Produktion) oder In-Memory (lokal)

export interface User {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  password?: string;
  avatar?: string;
  provider: 'discord' | 'google' | 'apple' | 'twitch' | 'local';
  isAdmin: boolean;
  createdAt: string;
}

export interface Session {
  userId: string;
  expiresAt: number;
}

// ─── In-Memory Store (lokal / Fallback) ─────────────────────────────────────
const memStore = new Map<string, { value: string; expiresAt?: number }>();

const mem = {
  get: (key: string): string | null => {
    const entry = memStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      memStore.delete(key);
      return null;
    }
    return entry.value;
  },
  set: (key: string, value: string, ttlSeconds?: number) => {
    memStore.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  },
  del: (key: string) => { memStore.delete(key); },
  keys: (prefix: string): string[] =>
    [...memStore.keys()].filter(k => k.startsWith(prefix)),
};

// ─── Upstash Redis (Produktion) ──────────────────────────────────────────────
let redis: any = null;

async function getRedis() {
  if (redis) return redis;

  const url   = process.env.wulfyweb_KV_REST_API_URL   || import.meta.env.wulfyweb_KV_REST_API_URL;
  const token = process.env.wulfyweb_KV_REST_API_TOKEN || import.meta.env.wulfyweb_KV_REST_API_TOKEN;

  if (url && token) {
    try {
      const { Redis } = await import('@upstash/redis');
      redis = new Redis({ url, token });
      console.log('✅ Upstash Redis verbunden');
      return redis;
    } catch {
      console.warn('⚠️ Upstash Redis nicht verfügbar – nutze In-Memory-Store');
    }
  } else {
    console.warn('⚠️ wulfyweb_KV_REST_API_URL nicht gesetzt – nutze In-Memory-Store (lokal)');
  }

  // Fallback: In-Memory
  redis = {
    get:    async (key: string)                            => mem.get(key),
    set:    async (key: string, value: string, opts?: any) => mem.set(key, value, opts?.ex),
    del:    async (key: string)                            => mem.del(key),
    keys:   async (pattern: string)                        => mem.keys(pattern.replace('*', '')),
  };
  return redis;
}

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────
async function kvGet(key: string): Promise<string | null> {
  const store = await getRedis();
  const val = await store.get(key);
  return val ? (typeof val === 'string' ? val : JSON.stringify(val)) : null;
}

async function kvSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const store = await getRedis();
  if (ttlSeconds) {
    await store.set(key, value, { ex: ttlSeconds });
  } else {
    await store.set(key, value);
  }
}

async function kvDel(key: string): Promise<void> {
  const store = await getRedis();
  await store.del(key);
}

async function kvKeys(prefix: string): Promise<string[]> {
  const store = await getRedis();
  return await store.keys(`${prefix}*`);
}

// ─── User-Funktionen ─────────────────────────────────────────────────────────
export async function saveUser(user: User): Promise<void> {
  await kvSet(`user:${user.id}`, JSON.stringify(user));
  if (user.email)    await kvSet(`email:${user.email}`, user.id);
  if (user.username) await kvSet(`username:${user.username.toLowerCase()}`, user.id);
}

export async function getUser(userId: string): Promise<User | null> {
  const data = await kvGet(`user:${userId}`);
  return data ? JSON.parse(data) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const userId = await kvGet(`email:${email}`);
  if (!userId) return null;
  return await getUser(userId);
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const userId = await kvGet(`username:${username.toLowerCase()}`);
  if (!userId) return null;
  return await getUser(userId);
}

export async function getAllUsers(): Promise<User[]> {
  const keys = await kvKeys('user:');
  const users: User[] = [];
  for (const key of keys) {
    const data = await kvGet(key);
    if (data) users.push(JSON.parse(data));
  }
  return users;
}

export async function deleteUser(userId: string): Promise<void> {
  const user = await getUser(userId);
  if (user?.email)    await kvDel(`email:${user.email}`);
  if (user?.username) await kvDel(`username:${user.username.toLowerCase()}`);
  await kvDel(`user:${userId}`);
}

// ─── Session-Funktionen ──────────────────────────────────────────────────────
export async function createSession(
  userId: string,
  expiresInDays: number = 365,
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const ttl       = expiresInDays * 24 * 60 * 60;
  const session: Session = { userId, expiresAt };
  await kvSet(`session:${sessionId}`, JSON.stringify(session), ttl);
  return sessionId;
}

export async function validateSession(sessionId: string): Promise<User | null> {
  const data = await kvGet(`session:${sessionId}`);
  if (!data) return null;

  const session: Session = JSON.parse(data);
  if (session.expiresAt < Date.now()) {
    await kvDel(`session:${sessionId}`);
    return null;
  }

  return await getUser(session.userId);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await kvDel(`session:${sessionId}`);
}

// ─── Admin-Funktionen ────────────────────────────────────────────────────────
const ADMIN_USERNAMES = ['Wulfy', 'UEBlackWulfGHG', 'ueblackwulf', 'ueblackwolf'];
const ADMIN_EMAILS    = ['wulfghg@gmail.com', 'e94111993@gmail.com'];

export function isAdminUser(username: string, email?: string): boolean {
  return (
    ADMIN_USERNAMES.some(a => a.toLowerCase() === username.toLowerCase()) ||
    Boolean(email && ADMIN_EMAILS.some(a => a.toLowerCase() === email.toLowerCase()))
  );
}

export async function setAdmin(userId: string, isAdmin: boolean = true): Promise<void> {
  const user = await getUser(userId);
  if (user) {
    user.isAdmin = isAdmin;
    await saveUser(user);
  }
}

// ─── E-Mail-Verifikation ─────────────────────────────────────────────────────
export async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  await kvSet(`email-verify:${token}`, userId, 24 * 60 * 60);
  return token;
}

export async function verifyEmailToken(token: string): Promise<User | null> {
  const userId = await kvGet(`email-verify:${token}`);
  if (!userId) return null;

  const user = await getUser(userId);
  if (!user) return null;

  user.emailVerified = true;
  await saveUser(user);
  await kvDel(`email-verify:${token}`);
  return user;
}

export async function markEmailVerified(userId: string): Promise<void> {
  const user = await getUser(userId);
  if (user) {
    user.emailVerified = true;
    await saveUser(user);
  }
}

// ─── Passwort-Reset ──────────────────────────────────────────────────────────
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const token = crypto.randomUUID();
  await kvSet(`password-reset:${token}`, user.id, 60 * 60);
  return token;
}

export async function validatePasswordResetToken(token: string): Promise<string | null> {
  return await kvGet(`password-reset:${token}`);
}

export async function resetPassword(token: string, newPasswordHash: string): Promise<User | null> {
  const userId = await validatePasswordResetToken(token);
  if (!userId) return null;

  const user = await getUser(userId);
  if (!user) return null;

  user.password = newPasswordHash;
  await saveUser(user);
  await kvDel(`password-reset:${token}`);
  return user;
}