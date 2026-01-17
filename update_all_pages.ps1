# PowerShell-Skript zur automatischen Aktualisierung aller Seiten mit Übersetzungslogik

Write-Host "🌐 Aktualisiere alle Seiten mit Übersetzungslogik..." -ForegroundColor Green

# Liste aller zu aktualisierenden Seiten
$pages = @(
    "projects.astro",
    "failed_and_newly_started_projects.astro", 
    "faq.astro",
    "login.astro",
    "register.astro",
    "profile.astro",
    "dashboard.astro"
)

foreach ($page in $pages) {
    $filepath = "E:\wulfy-web\src\pages\$page"
    
    if (Test-Path $filepath) {
        Write-Host "📝 Aktualisiere: $page" -ForegroundColor Yellow
        
        # Lese den Dateiinhalt
        $content = Get-Content $filepath -Raw
        
        # Backup erstellen
        Copy-Item $filepath "$filepath.backup"
        
        # CSS-Import hinzufügen (wenn nicht vorhanden)
        if ($content -notmatch 'translate\.css') {
            $content = $content -replace '(import.*responsive-utilities\.css.*";)', "`$1`nimport `"../styles/translate.css`";"
        }
        
        # Navigation aktualisieren
        $newNav = @'
                        <li><a href="/" data-translate="nav-home">Startseite</a></li>
                        <li><a href="/about" data-translate="nav-about">Über mich</a></li>
                        <li><a href="/projects" data-translate="nav-projects">Projekte</a></li>
                        <li><a href="/failed_and_newly_started_projects" data-translate="nav-failed">Gescheiterte und neu angefangende Projekte</a></li>
                        <li><a href="/faq" data-translate="nav-faq">FAQ</a></li>
                        <li><button id="nightModeBtn">Night Mode</button></li>
                        <li><button id="translateBtn">🌐 EN</button></li>
                        <li><button id="abmelden" class="btn-login" data-translate="nav-logout">Abmelden</button></li>
                        <li><button id="registrieren" class="btn-register" data-translate="nav-register">Registrieren</button></li>
'@
        
        # Ersetze die alte Navigation
        $content = $content -replace '(\s*<li><a href="/">.*?</li>\s*<li><a href="/about">.*?</li>\s*<li><a href="/projects">.*?</li>\s*<li><a href="/failed_and_newly_started_projects">.*?</li>\s*<li><a href="/faq">.*?</li>\s*<li><button.*?registrieren.*?</li>)', $newNav, 'Singleline'
        
        # Footer korrigieren (foodder -> footer)
        $newFooter = @'
        <footer>
	    <div class="footer-container">
		<div class="footer-column">
			<h4 data-translate="footer-contact">Kontakt</h4>
			<p>Discord: ueblackwulf</p>
			<p data-translate="footer-email">Oder auch per Email: wulfghg@gmail.com</p>
		</div>
		<div class="footer-column">
			<h4 data-translate="footer-discord">Zum Discord Server:</h4>
			<ul>
				<li><a href="https://discord.gg/gy4HYACX9g" data-translate="footer-server">Server</a></li>
			</ul>
		</div>
	    </div>
	    <div class="footer-bottom">
		<p class="copyright">&copy; 2026 UEBlackWulfGHG all rights reserved.</p>
	    </div>
	</footer>
'@
        
        # Ersetze Footer
        $content = $content -replace '<foodder>.*?</foodder>', $newFooter, 'Singleline'
        
        # Script-Import hinzufügen
        if ($content -notmatch 'translate\.js') {
            $content = $content -replace '(\s*<script src="\.\./scripts/navigation\.js"></script>)', "`$1`n        <script src=`"../scripts/translate.js`"></script>"
        }
        
        # Speichere die aktualisierte Datei
        Set-Content $filepath $content -Encoding UTF8
        
        Write-Host "✅ $page erfolgreich aktualisiert!" -ForegroundColor Green
    } else {
        Write-Host "❌ $page nicht gefunden!" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Alle Seiten wurden erfolgreich aktualisiert!" -ForegroundColor Green
Write-Host "💡 Jetzt können Sie die Übersetzung auf allen Seiten verwenden!" -ForegroundColor Cyan