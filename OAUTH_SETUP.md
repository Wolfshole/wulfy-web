# 🔐 OAuth-Authentifizierung Setup

Deine Webseite unterstützt jetzt OAuth-Login mit Discord, Google, Apple und Twitch!

## 📋 Setup-Schritte

### 1. OAuth-Apps erstellen

#### Discord
1. Gehe zu https://discord.com/developers/applications
2. Erstelle eine neue Application
3. Gehe zu OAuth2 → General
4. Füge Redirect URL hinzu: `https://deine-domain.com/api/auth/callback/discord`
5. Kopiere Client ID und Client Secret

#### Google
1. Gehe zu https://console.cloud.google.com/
2. Erstelle ein neues Projekt
3. Aktiviere Google+ API
4. Gehe zu APIs & Services → Credentials
5. Erstelle OAuth 2.0 Client ID
6. Füge Redirect URL hinzu: `https://deine-domain.com/api/auth/callback/google`
7. Kopiere Client ID und Client Secret

#### Apple
1. Gehe zu https://developer.apple.com/account/resources/identifiers/list/serviceId
2. Erstelle eine neue Service ID
3. Konfiguriere Sign in with Apple
4. Füge Domain und Redirect URL hinzu
5. Erstelle ein Private Key für JWT

#### Twitch
1. Gehe zu https://dev.twitch.tv/console/apps
2. Erstelle eine neue Application
3. Füge OAuth Redirect URL hinzu: `https://deine-domain.com/api/auth/callback/twitch`
4. Kopiere Client ID und Client Secret

### 2. Environment Variables konfigurieren

Erstelle eine `.env` Datei (siehe `.env.example`):

```bash
cp .env.example .env
```

Fülle alle OAuth-Credentials aus.

### 3. Vercel Environment Variables

Gehe zu deinem Vercel Dashboard → Settings → Environment Variables und füge alle hinzu:

- `PUBLIC_DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `PUBLIC_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- etc.

### 4. Datenbank einrichten (Optional)

Für persistente Speicherung wähle eine Option:

#### Option A: Vercel KV (Empfohlen)
```bash
vercel link
vercel env pull
```

#### Option B: Supabase
1. Erstelle Projekt auf https://supabase.com
2. Erstelle Tabelle `users`:
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE,
  avatar TEXT,
  provider TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Option C: MongoDB
```bash
npm install mongodb
```

## 🚀 Deployment

```bash
git add .
git commit -m "OAuth-Authentifizierung hinzugefügt"
git push
```

## ✅ Testen

1. Gehe zu `/login`
2. Klicke auf einen OAuth-Button
3. Autorisiere die App
4. Du wirst zum Dashboard weitergeleitet

## 🔒 Sicherheit

- Client Secrets **NIE** in Git committen!
- Verwende `.env` nur lokal
- Alle Secrets in Vercel Environment Variables
- Aktiviere HTTPS in Produktion
