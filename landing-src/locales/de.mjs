// Landing-page translations for "de". One key per string; build.mjs
// validates parity against en.mjs at build time.
//
// Keys ending in `_html` are injected as raw HTML so translations can
// keep inline tags like <em>. Everything else is HTML-escaped.

export const de = {
  title: "Arroxy — Kostenloser 4K YouTube + 2000 Seiten Downloader, kein Login erforderlich",
  description:
    "Kostenloser, MIT-lizenzierter Desktop-Downloader für YouTube und 2000+ unterstützte Seiten auf Windows, macOS und Linux. Videos in bis zu 4K HDR mit 60 fps herunterladen. Keine Werbung, kein Bloat, kein Upselling.",
  og_title: "Arroxy — Kostenloser 4K YouTube + 2000 Seiten Downloader, kein Login erforderlich",
  og_description:
    "Kostenloser 4K Downloader für YouTube und 2000+ Seiten. Keine Werbung, kein Bloat, kein Upselling. MIT-lizenziert. Windows · macOS · Linux.",

  nav_features: "Funktionen",
  nav_screenshots: "Screenshots",
  nav_install: "Installation",
  nav_blog: "Blog",
  nav_home: "Home",
  nav_download: "Download",

  hero_eyebrow: "Open Source · MIT · Aktive Entwicklung",
  hero_h1_a: "Kostenloser 4K YouTube (+ 2000 Seiten) Downloader.",
  hero_h1_b: "Keine Werbung, kein Bloat, kein Upselling.",
  hero_tagline:
    "Arroxy ist ein kostenloser, MIT-lizenzierter Desktop-Downloader für YouTube und 2000+ unterstützte Seiten auf Windows, macOS und Linux. Videos in bis zu 4K HDR mit 60 fps. Keine Werbung, kein Bloat, kein Upselling — einfach eine URL einfügen und loslegen.",
  hero_trust: "Jede Zeile auf GitHub prüfen.",
  pill_no_tracking: "Kein Tracking",
  pill_no_account: "Keine Werbung",
  pill_open_source: "Open Source (MIT)",
  cta_download_os: "Für dein Betriebssystem herunterladen",
  cta_view_github: "Auf GitHub ansehen",
  release_label: "Neueste Version:",
  release_loading: "wird geladen…",

  cta_download_windows: "Für Windows herunterladen",
  cta_download_windows_portable: "Portable .exe (ohne Installation)",
  cta_download_mac_arm: "Für macOS herunterladen (Apple Silicon)",
  cta_download_mac_intel: "Intel-Mac? x64 DMG laden",
  cta_download_linux_appimage: "Für Linux herunterladen (.AppImage)",
  cta_download_linux_flatpak: "Flatpak-Paket →",
  cta_other_platforms: "Andere Plattformen / Alle Downloads",
  cta_os_windows: "Windows",
  cta_os_mac: "macOS",
  cta_os_linux: "Linux",
  cta_installer_label: "Installer",
  cta_portable_label: "Portable",
  cta_arm_label: "Apple Silicon",
  cta_intel_label: "Intel",
  mobile_notice: "Arroxy ist eine Desktop-App für Windows, macOS und Linux.",
  mobile_notice_sub: "Öffne diese Seite auf deinem Computer, um herunterzuladen.",
  mobile_copy_link: "Link kopieren",
  first_launch_label: "Hilfe beim ersten Start",
  first_launch_windows_html:
    "Windows SmartScreen kann beim ersten Start <em>\"Windows protected your PC\"</em> oder <em>\"Unknown publisher\"</em> anzeigen — Arroxy ist kostenlos und Open Source, und die Windows-Builds sind nicht mit einem kostenpflichtigen Zertifikat signiert. Das gilt sowohl für <code>Arroxy-Setup-*.exe</code> als auch für <code>Arroxy-Portable-*.exe</code> und bedeutet <strong>nicht</strong>, dass Arroxy unsicher ist. Klicke auf <strong>More info</strong> und dann auf <strong>Run anyway</strong>. Lade Arroxy nur von der offiziellen GitHub Releases-Seite herunter — der Quellcode ist öffentlich, also kannst du ihn selbst prüfen oder kompilieren.",
  first_launch_mac_html:
    "macOS zeigt beim ersten Start eine Warnung zu einem <em>nicht identifizierten Entwickler</em> — Arroxy ist noch nicht signiert. <strong>Rechtsklick auf das App-Symbol → Öffnen</strong>, dann im Dialog auf <strong>Öffnen</strong> klicken. Nur einmalig.",
  first_launch_linux_html:
    "<strong>AppImage:</strong> Rechtsklick auf die Datei → <strong>Eigenschaften → Als Programm ausführen erlauben</strong>, oder im Terminal <code>chmod +x Arroxy-*.AppImage</code> ausführen. Wenn der Start scheitert, installiere <code>libfuse2</code> (Ubuntu/Debian), <code>fuse-libs</code> (Fedora) oder <code>fuse2</code> (Arch).<br><br><strong>Flatpak:</strong> <code>flatpak install --user Arroxy-*.flatpak</code>, dann aus dem App-Menü starten oder <code>flatpak run io.github.antonio_orionus.Arroxy</code> ausführen.",

  features_eyebrow: "Was es kann",
  features_h2: "Alles, was du erwartest — ganz ohne Reibung.",
  features_sub: "URL einfügen, Qualität wählen, Download klicken. Mehr nicht.",
  f1_h: "Bis zu 4K UHD",
  f1_p: "2160p, 1440p, 1080p, 720p — jede Auflösung, die YouTube und andere unterstützte Seiten anbieten, plus reine Audio-Konvertierung in MP3, M4A/AAC, Opus und WAV.",
  f2_h: "60 fps & HDR erhalten",
  f2_p: "High-Framerate- und HDR-Streams kommen genau so durch, wie YouTube sie kodiert — ohne Qualitätsverlust.",
  f3_h: "Auch Playlists",
  f3_p: "Füge eine Playlist-URL ein, lade die ganze Liste herunter oder markiere nur die Videos, die du willst, bevor Arroxy sie in die Warteschlange legt.",
  f4_h: "Auto-Updates",
  f4_p: "Arroxy hält yt-dlp aktuell und liefert ffmpeg in der App mit — liefert wöchentlich Fixes, wenn sich YouTube und andere Seiten ändern.",
  f5_h: "21 Sprachen",
  f5_p: "English, Español, Deutsch, Français, 日本語, 中文, Русский, Українська, हिन्दी, Afaan Oromoo, Kiswahili, O'zbekcha, Tiếng Việt, አማርኛ, العربية, اردو, پښتو, বাংলা, မြန်မာဘာသာ, Ελληνικά, Српски — erkennt deine automatisch.",
  f6_h: "Plattformübergreifend",
  f6_p: "Native Builds für Windows, macOS und Linux — Installer, Portable, DMG oder AppImage.",
  f7_h: "Untertitel, wie du willst",
  f7_p: "Manuelle oder automatisch generierte Untertitel in SRT, VTT oder ASS — neben dem Video gespeichert, in eine portable .mkv eingebettet oder in einen Subtitles/-Ordner sortiert.",
  f8_h: "SponsorBlock integriert",
  f8_p: "Überspringe oder markiere Sponsor-Segmente, Intros, Outros, Eigenwerbung und mehr — schneide sie mit FFmpeg heraus oder füge einfach Kapitel hinzu. Deine Wahl, pro Kategorie.",
  f9_h: "Automatisches Ausfüllen aus Zwischenablage",
  f9_p: "Kopiere einen beliebigen unterstützten Link irgendwo und Arroxy erkennt ihn im Moment, in dem du zurückwechselst — ein Bestätigungsdialog hält dich in Kontrolle. In den Erweiterten Einstellungen ein- oder ausschalten.",
  f10_h: "URLs automatisch bereinigen",
  f10_p: "Tracking-Parameter (si, pp, feature, utm_*, fbclid, gclid und mehr) werden automatisch aus eingefügten Links entfernt, und youtube.com/redirect-Wrapper werden aufgelöst — das URL-Feld zeigt immer den kanonischen Link.",
  f11_h: "In den Tray minimieren",
  f11_p: "Das Schließen des Fensters versteckt Arroxy im System-Tray. Downloads laufen im Hintergrund weiter — klicke auf das Tray-Symbol, um das Fenster zurückzubringen, oder beende die App über das Tray-Menü.",
  f12_h: "Eingebettete Metadaten & Cover",
  f12_p: "Titel, Upload-Datum, Künstler, Beschreibung, Cover-Art und Kapitelmarkierungen direkt in die Datei geschrieben — keine Sidecar-Dateien, kein manuelles Taggen.",

  shots_eyebrow: "In Aktion sehen",
  shots_h2: "Gebaut für Klarheit, nicht für Chaos.",
  shot1_alt: "URL einfügen",
  shot2_alt: "Qualität wählen",
  shot3_alt: "Speicherort wählen",
  shot4_alt: "Parallele Downloads",
  shot5_alt: "Untertitel-Schritt — Sprachen, Format und Speichermodus wählen",
  og_image_alt: "Arroxy App-Icon — Desktop-App zum Herunterladen von YouTube und 2000+ anderen Seiten in 4K.",

  privacy_eyebrow: "Privatsphäre",
  privacy_h2_html: "Was Arroxy <em>nicht</em> tut.",
  privacy_sub:
    "100% lokale Verarbeitung. Keine Werbung, kein Upselling, keine Drittanbieter-Server — Dateien gehen direkt von yt-dlp auf deine Festplatte.",
  p1_h: "Kein Login erforderlich",
  p1_p: "Der Standardmodus funktioniert ohne Google-Konto oder Login. In den Erweiterten Einstellungen steht optionale Cookie-Unterstützung für alters- oder mitgliedschaftsbeschränkte Inhalte zur Verfügung — standardmäßig deaktiviert.",
  p2_h: "Nur lokale Dateien",
  p2_p: "Dateien gehen direkt von yt-dlp in den Ordner, den du auswählst. Nichts wird über einen Remote-Server geleitet.",
  p3_h: "Anonyme Telemetrie",
  p3_p: "Anonyme Telemetrie über OpenPanel — eine zufällige ID pro Installation hilft, Starts, Versionen, Betriebssysteme und Abstürze zu zählen; keine URLs, Titel, Dateipfade, Kontodaten, Fingerprinting oder personenbezogenen Daten. Deine Downloads, dein Verlauf und deine Dateien verlassen nie dein Gerät.",
  p4_h: "Keine Werbung, kein Upselling",
  p4_p: "MIT-lizenziert. Keine Premium-Stufe, keine Funktionsbarrieren, keine Bannerwerbung, keine Dark Patterns. Die gesamte Pipeline läuft lokal über yt-dlp + ffmpeg.",

  install_eyebrow: "Installation",
  install_h2: "Wähle deinen Kanal.",
  install_sub:
    "Direkter Download oder ein gängiger Paketmanager — alle aktualisieren sich automatisch mit jedem Release.",
  badge_windows: "Windows",
  badge_macos: "macOS",
  badge_linux: "Linux",
  badge_all: "Alle",
  winget_desc: "Empfohlen für Windows 10/11. Aktualisiert sich mit dem System.",
  scoop_desc: "Portable Installation via Scoop-Bucket. Keine Admin-Rechte nötig.",
  brew_desc: "Cask hinzufügen, mit einem Befehl installieren. Universal Binary (Intel + Apple Silicon).",
  flatpak_h: "Flatpak",
  flatpak_desc: "Sandboxed Installation. Lade das .flatpak-Bundle aus den Releases und installier es mit einem Befehl. Kein Flathub-Setup nötig.",
  direct_h: "Direkter Download",
  direct_desc: "NSIS-Installer, portable .exe, .dmg, .AppImage oder .flatpak — direkt von GitHub Releases.",
  direct_btn: "Releases öffnen →",
  copy_label: "Kopieren",
  copied_label: "Kopiert!",

  footer_made_by: "MIT-Lizenz · Mit Sorgfalt gemacht von",
  footer_github: "GitHub",
  footer_issues: "Issues",
  footer_releases: "Releases",
  footer_languages_label: "Sprache:",

  faq_eyebrow: "FAQ",
  faq_h2: "Häufig gestellte Fragen",
  faq_q1: "Welche Videoqualitäten kann ich herunterladen?",
  faq_a1:
    "Alles, was YouTube und andere unterstützte Seiten anbieten — 4K UHD (2160p), 1440p QHD, 1080p Full HD, 720p, 480p, 360p und Audio-only. Streams mit hoher Bildrate (60 fps, 120 fps) und HDR-Inhalte bleiben unverändert erhalten. Arroxy zeigt jedes verfügbare Format, inklusive MP3-, M4A/AAC-, Opus- und WAV-Konvertierung für reine Audio-Downloads.",
  faq_q2: "Ist es wirklich kostenlos?",
  faq_a2:
    "Ja. MIT-Lizenz. Keine Premium-Stufe, keine versteckten Funktionsbarrieren.",
  faq_q3: "In welchen Sprachen ist Arroxy verfügbar?",
  faq_a3:
    "Einundzwanzig, direkt out of the box: English, Español (Spanisch), Deutsch, Français (Französisch), 日本語 (Japanisch), 中文 (Chinesisch), Русский (Russisch), Українська (Ukrainisch), हिन्दी (Hindi), Afaan Oromoo, Kiswahili, O'zbekcha (Usbekisch), Tiếng Việt (Vietnamesisch), አማርኛ (Amharisch), العربية (Arabisch), اردو (Urdu), پښتو (Paschto), বাংলা (Bengalisch), မြန်မာဘာသာ (Birmanisch), Ελληνικά (Griechisch) und Српски (Serbisch). Arroxy erkennt deine Betriebssystem-Sprache beim ersten Start und du kannst jederzeit über die Sprachauswahl in der Symbolleiste wechseln. Übersetzungen liegen als einfache TypeScript-Objekte in src/shared/i18n/locales/ — öffne einen PR auf GitHub, um beizutragen.",
  faq_q4: "Muss ich etwas installieren?",
  faq_a4:
    "Nein. yt-dlp wird beim ersten Start automatisch heruntergeladen und auf deinem Rechner gecacht; ffmpeg und ffprobe werden mit der App geliefert. Danach ist keine weitere Einrichtung nötig.",
  faq_q5: "Funktioniert es weiter, wenn YouTube etwas ändert?",
  faq_a5:
    "Ja — und Arroxy hat zwei Resilienzschichten. Erstens: yt-dlp ist eines der am aktivsten gepflegten Open-Source-Tools überhaupt — es wird innerhalb von Stunden nach Änderungen an unterstützten Seiten, einschließlich YouTube, aktualisiert. Zweitens: Arroxy verlässt sich überhaupt nicht auf Cookies oder dein Google-Konto, also gibt's keine Session, die abläuft, und keine Anmeldedaten, die rotiert werden müssen. Diese Kombination macht es deutlich stabiler als Tools, die auf exportierte Browser-Cookies angewiesen sind.",
  faq_q6: "Kann ich Playlists herunterladen?",
  faq_a6:
    "Ja. Füge eine Playlist-URL ein, wähle alle Videos oder nur die aus, die du willst, und Arroxy stellt sie als einen Batch in die Warteschlange. Ganze Kanäle im Batch werden noch nicht unterstützt.",
  faq_q7: "Braucht es mein YouTube-Konto oder Cookies?",
  faq_a7:
    "Standardmäßig nein — Arroxy funktioniert ohne Konto, Login oder Cookie-Export. In den Erweiterten Einstellungen steht optionale Cookie-Unterstützung (Datei oder Browser-Import) für Inhalte zur Verfügung, die eine Authentifizierung erfordern, z. B. altersbeschränkte oder Mitglieder-only-Videos. Standardmäßig deaktiviert. Wenn du sie aktivierst, warnt yt-dlps eigene Dokumentation, dass Cookie-basierte Automatisierung ein Google-Konto markieren kann — ein Wegwerf-Konto ist die sicherere Wahl.",
  faq_q8:
    'macOS sagt „die App ist beschädigt" oder „kann nicht geöffnet werden" — was tun?',
  faq_a8:
    "Das ist macOS Gatekeeper, der eine unsignierte App blockiert — nicht echte Beschädigung. Eine Schritt-für-Schritt-Anleitung zum Erststart unter macOS findest du im README.",
  faq_q9: "Ist das legal?",
  faq_a9:
    "Das Herunterladen von Videos zur persönlichen Nutzung ist in den meisten Rechtsordnungen allgemein akzeptiert. Du bist verantwortlich, die YouTube-AGB und deine lokalen Gesetze einzuhalten.",

  f13_h: "YouTube + 2000 Seiten",
  f13_p: "Neben YouTube lädt Arroxy von 2000+ Seiten, die yt-dlp unterstützt — Vimeo, Twitch, Twitter/X, TikTok, SoundCloud, Bandcamp, Bilibili, BBC iPlayer, archive.org und viele mehr. Nur Audio und Untertitel funktionieren überall, nicht nur auf YouTube.",

  mid_cta_h2: "Gefällt dir, was du siehst?",
  mid_cta_sub: "Kostenlos herunterladen. Kein Konto, keine Werbung, keine Bedingungen.",
  end_cta_h2: "Für immer kostenlos. Open Source. Kein Haken.",
  end_cta_sub: "Schließ dich Tausenden an, die mit Arroxy herunterladen. Ein Klick — und es läuft einfach.",

  blog_eyebrow: "Blog",
  blog_index_h1: "Arroxy Blog",
  blog_index_tagline: "Vergleiche, Tiefenanalysen und Release-Notizen vom Arroxy-Team.",
  blog_read_more: "Lesen →",
  blog_published_prefix: "Veröffentlicht",
  blog_updated_prefix: "Aktualisiert",
  blog_by_author: "von",
  blog_back_to_index: "← Zurück zum Blog",
  blog_lang_note: "Dieser Artikel ist derzeit nur auf Englisch verfügbar.",
};
