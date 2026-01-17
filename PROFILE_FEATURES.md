# Wulfy Web - Neue Profil-Features

## Implementierte Features

### 1. Dynamische Navigation basierend auf Login-Status

Die Navigation passt sich automatisch an den Login-Status des Benutzers an:

- **Nicht eingeloggt**: Zeigt "Anmelden" und "Registrieren" Buttons
- **Eingeloggt**: Zeigt "Profil" und "Abmelden" Buttons

### 2. Profilseite mit Profilbild-Upload

Die neue Profilseite (`/profile`) bietet folgende Funktionen:

- **Profilbild hochladen**: Benutzer können ein Profilbild hochladen (max. 5 MB)
- **Profilbild-Vorschau**: Das Bild wird in einem runden Container angezeigt
- **Platzhalter mit Initialen**: Falls kein Bild hochgeladen wurde, werden die Initialen des Benutzernamens angezeigt
- **Profilbild entfernen**: Option zum Entfernen des hochgeladenen Bildes
- **Benutzerinformationen**: Anzeige von Benutzername, E-Mail und Registrierungsdatum

### 3. Dashboard-Integration

Das Dashboard wurde erweitert:

- Zeigt eine Profilbild-Vorschau in der Profil-Karte
- "Profil bearbeiten" Button für schnellen Zugriff auf die Profilseite
- "Profil"-Link in der Navigation

## Technische Details

### Dateien

#### Neue Dateien:
- `src/pages/profile.astro` - Profilseite
- `src/scripts/profile.js` - Profil-Logik und Bildupload
- `src/scripts/navigation.js` - Dynamische Navigation

#### Geänderte Dateien:
- Alle Hauptseiten (index, about, projects, faq, etc.) - Navigation-Script hinzugefügt
- `src/pages/dashboard.astro` - Profilbild-Vorschau und Profil-Link
- `src/scripts/dashboard.js` - Profilbild-Anzeige
- `src/styles/dashboard.css` - Styles für Profilbild-Vorschau
- `src/styles/index.css` - Button-Styles erweitert

### Datenspeicherung

- Profilbilder werden als Base64-Strings im LocalStorage gespeichert
- Die Daten werden sowohl im `currentUser` als auch in `registeredUsers` aktualisiert
- Maximale Bildgröße: 5 MB

### Navigation-Logik

Das `navigation.js` Script:
1. Prüft beim Laden der Seite den Login-Status
2. Entfernt/fügt Buttons basierend auf dem Status hinzu
3. Funktioniert auf allen Seiten der Website

## Nutzung

### Als Benutzer:

1. **Einloggen/Registrieren**
   - Klicke auf "Anmelden" oder "Registrieren" in der Navigation
   - Nach erfolgreichem Login ändern sich die Buttons automatisch

2. **Profilbild hochladen**
   - Klicke auf "Profil" in der Navigation
   - Klicke auf "📷 Bild auswählen"
   - Wähle ein Bild (max. 5 MB)
   - Das Bild wird automatisch hochgeladen und gespeichert

3. **Profilbild entfernen**
   - Gehe zur Profilseite
   - Klicke auf "🗑️ Bild entfernen"
   - Bestätige die Aktion

4. **Abmelden**
   - Klicke auf "Abmelden" in der Navigation
   - Die Buttons ändern sich zurück zu "Anmelden" und "Registrieren"

## Browser-Kompatibilität

- ✅ Chrome/Edge (aktuelle Versionen)
- ✅ Firefox (aktuelle Versionen)
- ✅ Safari (aktuelle Versionen)
- ✅ Unterstützt Night Mode

## Sicherheitshinweise

⚠️ **Wichtig**: Diese Implementierung verwendet LocalStorage und speichert Passwörter im Klartext. Dies ist nur für Entwicklungs-/Demo-Zwecke geeignet!

Für eine Produktionsumgebung sollten folgende Punkte beachtet werden:
- Backend-API für Authentifizierung
- Passwort-Hashing (z.B. bcrypt)
- Sichere Session-Verwaltung
- Server-seitiger Bild-Upload und -Speicherung
- Bildvalidierung und -optimierung
- HTTPS-Verbindung

## Zukünftige Erweiterungen

- [ ] Profil bearbeiten (Benutzername, E-Mail ändern)
- [ ] Bild-Crop-Funktion
- [ ] Mehrere Bilder/Galerie
- [ ] Passwort ändern
- [ ] 2-Faktor-Authentifizierung
- [ ] Backend-Integration
