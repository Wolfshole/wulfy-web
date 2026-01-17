# Admin-System Dokumentation

## 🔐 Admin-Zugriff

Das Dashboard ist jetzt **nur für Administratoren** zugänglich.

## Admin-Benutzernamen

Die folgenden Benutzernamen haben automatisch Admin-Rechte:

- **Wulfy**
- **UEBlackWulfGHG**  
- **ueblackwulf**

> **Hinweis:** Die Prüfung ist case-insensitive (Groß-/Kleinschreibung wird ignoriert)

## Admin-Funktionen

### Automatische Erkennung
- Bei der **Registrierung** oder beim **Login** wird automatisch geprüft, ob der Benutzername in der Admin-Liste ist
- Admin-Status wird im LocalStorage gespeichert

### Dashboard-Zugriff
- Nur Admins sehen den **📊 Dashboard**-Link in der Navigation
- Nicht-Admins werden beim direkten Aufruf von `/dashboard` zur Startseite umgeleitet
- Entsprechende Fehlermeldung: "Zugriff verweigert! Nur Admins haben Zugriff auf das Dashboard."

### Sichtbare Unterschiede

**Als Admin:**
- Navigation zeigt: Dashboard | Profil | Abmelden
- Dashboard-Link in orange/gold Farbe
- Profil zeigt "👑 Administrator" Status
- Voller Zugriff auf alle Funktionen

**Als normaler Benutzer:**
- Navigation zeigt: Profil | Abmelden
- Kein Dashboard-Link sichtbar
- Profil zeigt nur Standardinformationen
- Zugriff auf Profil und alle öffentlichen Seiten

## Weitere Admins hinzufügen

Um weitere Admin-Benutzernamen hinzuzufügen, bearbeite die Datei:

**`src/scripts/auth.js`** - Zeile mit `adminUsernames`:

```javascript
adminUsernames: ['Wulfy', 'UEBlackWulfGHG', 'ueblackwulf', 'NeuerAdmin'],
```

## Technische Details

### Dateien mit Admin-Logik:

1. **`src/scripts/auth.js`**
   - `isAdmin()` - Prüft ob aktueller Benutzer Admin ist
   - `checkIfAdmin(username)` - Prüft ob Benutzername in Admin-Liste
   - Admin-Status wird bei Login/Registrierung gesetzt

2. **`src/scripts/navigation.js`**
   - Dashboard-Link wird nur für Admins angezeigt
   - Dynamische Navigation basierend auf Admin-Status

3. **`src/scripts/dashboard.js`**
   - Prüft beim Laden ob Benutzer Admin ist
   - Leitet Nicht-Admins zur Startseite um

4. **`src/scripts/profile.js`**
   - Zeigt Admin-Status im Profil an

## Sicherheitshinweise

⚠️ **Wichtig für Produktionsumgebung:**

Dieses System ist für **Entwicklung/Demo** geeignet. Für eine echte Produktionsumgebung sollten folgende Punkte beachtet werden:

- Backend-basierte Authentifizierung
- Server-seitige Admin-Prüfung
- JWT oder Session-basierte Auth
- Verschlüsselte Datenspeicherung
- Role-Based Access Control (RBAC)
- Audit Logs für Admin-Aktionen

## Testen

### Als Admin testen:
1. Registriere einen Account mit Benutzername "Wulfy"
2. Nach dem Login erscheint der Dashboard-Link
3. Profil zeigt "👑 Administrator" Status

### Als normaler Benutzer testen:
1. Registriere einen Account mit einem anderen Namen
2. Nach dem Login erscheint KEIN Dashboard-Link
3. Direkter Aufruf von `/dashboard` wird blockiert
