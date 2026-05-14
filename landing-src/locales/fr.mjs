// Landing-page translations for "fr". One key per string; build.mjs
// validates parity against en.mjs at build time.
//
// Keys ending in `_html` are injected as raw HTML so translations can
// keep inline tags like <em>. Everything else is HTML-escaped.

export const fr = {
  title: "Arroxy — Téléchargeur 4K YouTube + 2000 sites gratuit, sans connexion requise",
  description:
    "Téléchargeur de bureau gratuit sous licence MIT pour YouTube et plus de 2000 sites supportés sur Windows, macOS et Linux. Téléchargez des vidéos jusqu'en 4K HDR à 60 fps. Pas de pub, pas de superflu, pas d'upsell.",
  og_title: "Arroxy — Téléchargeur 4K YouTube + 2000 sites gratuit, sans connexion requise",
  og_description:
    "Téléchargeur 4K gratuit pour YouTube et plus de 2000 sites. Pas de pub, pas de superflu, pas d'upsell. Licence MIT. Windows · macOS · Linux.",

  nav_features: "Fonctionnalités",
  nav_screenshots: "Captures",
  nav_install: "Installer",
  nav_blog: "Blog",
  nav_home: "Home",
  nav_download: "Télécharger",

  hero_eyebrow: "Open Source · MIT · En développement actif",
  hero_h1_a: "Téléchargeur 4K YouTube (+ 2000 sites) gratuit.",
  hero_h1_b: "Pas de pub, pas de superflu, pas d'upsell.",
  hero_tagline:
    "Arroxy est un téléchargeur de bureau gratuit sous licence MIT pour YouTube et plus de 2000 sites supportés, sur Windows, macOS et Linux. Télécharge des vidéos jusqu'en 4K HDR à 60 fps. Pas de pub, pas de superflu, pas d'upsell — colle juste une URL et c'est parti.",
  pill_no_tracking: "Sans pistage",
  pill_no_account: "Pas de pub",
  pill_open_source: "Open source (MIT)",
  hero_trust: "Auditez chaque ligne sur GitHub.",
  cta_download_os: "Télécharger pour votre OS",
  cta_view_github: "Voir sur GitHub",
  release_label: "Dernière version :",
  release_loading: "chargement…",

  cta_download_windows: "Télécharger pour Windows",
  cta_download_windows_portable: ".exe portable (sans installation)",
  cta_download_mac_arm: "Télécharger pour macOS (Apple Silicon)",
  cta_download_mac_intel: "Mac Intel ? Obtenir le DMG x64",
  cta_download_linux_appimage: "Télécharger pour Linux (.AppImage)",
  cta_download_linux_flatpak: "Bundle Flatpak →",
  cta_other_platforms: "Autres plateformes / Tous les téléchargements",
  cta_os_windows: "Windows",
  cta_os_mac: "macOS",
  cta_os_linux: "Linux",
  cta_installer_label: "Installeur",
  cta_portable_label: "Portable",
  cta_arm_label: "Apple Silicon",
  cta_intel_label: "Intel",
  mobile_notice: "Arroxy est une application de bureau pour Windows, macOS et Linux.",
  mobile_notice_sub: "Ouvrez cette page sur votre ordinateur pour télécharger.",
  mobile_copy_link: "Copier le lien",
  first_launch_label: "Aide au premier lancement",
  first_launch_windows_html:
    "Windows SmartScreen peut afficher <em>\"Windows protected your PC\"</em> ou <em>\"Unknown publisher\"</em> au premier lancement — Arroxy est gratuit et open source, et les builds Windows ne sont pas signés avec un certificat payant. Cela s'applique à la fois à <code>Arroxy-Setup-*.exe</code> et à <code>Arroxy-Portable-*.exe</code> et ne signifie <strong>pas</strong> qu'Arroxy est dangereux. Clique sur <strong>More info</strong>, puis sur <strong>Run anyway</strong>. Ne télécharge Arroxy que depuis la page officielle GitHub Releases — le code source est public, tu peux donc l'inspecter ou le compiler toi-même.",
  first_launch_mac_html:
    "macOS affiche un avertissement <em>développeur non identifié</em> au premier lancement — Arroxy n'est pas encore signée. <strong>Clic droit sur l'icône → Ouvrir</strong>, puis cliquez sur <strong>Ouvrir</strong> dans la boîte de dialogue. Une seule fois.",
  first_launch_linux_html:
    "<strong>AppImage :</strong> clic droit sur le fichier → <strong>Propriétés → Autoriser l'exécution comme programme</strong>, ou exécutez <code>chmod +x Arroxy-*.AppImage</code> dans un terminal. Si le lancement échoue, installez <code>libfuse2</code> (Ubuntu/Debian), <code>fuse-libs</code> (Fedora) ou <code>fuse2</code> (Arch).<br><br><strong>Flatpak :</strong> <code>flatpak install --user Arroxy-*.flatpak</code>, puis lancez depuis le menu des applications ou exécutez <code>flatpak run io.github.antonio_orionus.Arroxy</code>.",

  features_eyebrow: "Ce qu'il fait",
  features_h2: "Tout ce que vous attendez, sans la moindre friction.",
  features_sub: "Collez une URL, choisissez une qualité, cliquez sur télécharger. C'est tout.",
  f1_h: "Jusqu'à 4K UHD",
  f1_p: "2160p, 1440p, 1080p, 720p — toutes les résolutions que YouTube et les autres sites supportés proposent, plus la conversion audio seule en MP3, M4A/AAC, Opus et WAV.",
  f2_h: "60 fps et HDR préservés",
  f2_p: "Les flux haute fréquence d'images et HDR passent exactement comme YouTube les encode — sans perte de qualité.",
  f3_h: "Playlists incluses",
  f3_p: "Colle l'URL d'une playlist, télécharge toute la liste ou coche seulement les vidéos que tu veux avant qu'Arroxy les mette en file.",
  f4_h: "Mises à jour automatiques",
  f4_p: "Arroxy garde yt-dlp à jour et embarque ffmpeg dans l’app — publie des correctifs chaque semaine à mesure que YouTube et les autres sites évoluent.",
  f5_h: "21 langues",
  f5_p: "English, Español, Deutsch, Français, 日本語, 中文, Русский, Українська, हिन्दी, Afaan Oromoo, Kiswahili, O'zbekcha, Tiếng Việt, አማርኛ, العربية, اردو, پښتو, বাংলা, မြန်မာဘာသာ, Ελληνικά, Српски — détecte la vôtre automatiquement.",
  f6_h: "Multiplateforme",
  f6_p: "Builds natifs pour Windows, macOS et Linux — installeur, portable, DMG ou AppImage.",
  f7_h: "Sous-titres comme tu veux",
  f7_p: "Sous-titres manuels ou auto-générés en SRT, VTT ou ASS — à côté de la vidéo, intégrés dans un .mkv portable, ou rangés dans un dossier Subtitles/.",
  f8_h: "SponsorBlock intégré",
  f8_p: "Passe ou marque les segments sponsors, intros, outros, autopromos et plus — coupe-les avec FFmpeg ou ajoute simplement des chapitres. Ton choix, par catégorie.",
  f9_h: "Auto-remplissage presse-papiers",
  f9_p: "Copiez n'importe quel lien supporté n'importe où et Arroxy le détecte au moment où vous revenez — une invite de confirmation garde le contrôle. Activez ou désactivez dans Paramètres avancés.",
  f10_h: "Nettoyage auto des URLs",
  f10_p: "Les paramètres de tracking (si, pp, feature, utm_*, fbclid, gclid et plus) sont automatiquement retirés des liens collés, et les enveloppes youtube.com/redirect sont déballées — le champ URL affiche toujours le lien canonique.",
  f11_h: "Se réduit dans le tray",
  f11_p: "Fermer la fenêtre loge Arroxy dans la barre système. Les téléchargements continuent en arrière-plan — cliquez sur l'icône pour rouvrir la fenêtre, ou quittez depuis le menu de la barre.",
  f12_h: "Métadonnées & pochette intégrées",
  f12_p: "Titre, date de mise en ligne, artiste, description, pochette et marqueurs de chapitres écrits directement dans le fichier — sans fichiers annexes ni balisage manuel.",

  shots_eyebrow: "Voyez-le en action",
  shots_h2: "Conçu pour la clarté, pas l'encombrement.",
  shot1_alt: "Coller une URL",
  shot2_alt: "Choisir la qualité",
  shot3_alt: "Choisir où enregistrer",
  shot4_alt: "Téléchargements parallèles",
  shot5_alt: "Étape sous-titres — choisir langues, format et mode d'enregistrement",
  og_image_alt: "Icône de l'app Arroxy — application bureau pour télécharger YouTube et plus de 2000 autres sites en 4K.",

  privacy_eyebrow: "Confidentialité",
  privacy_h2_html: "Ce qu'Arroxy <em>ne fait pas</em>.",
  privacy_sub:
    "Traitement 100 % local. Pas de pub, pas d'upsell, pas de serveurs tiers — les fichiers vont directement de yt-dlp vers ton disque.",
  p1_h: "Pas de connexion requise",
  p1_p: "Le mode par défaut fonctionne sans compte Google ni connexion. Le support optionnel des cookies est disponible dans les Paramètres avancés pour les contenus à restriction d'âge ou réservés aux membres — désactivé par défaut.",
  p2_h: "Fichiers locaux uniquement",
  p2_p: "Les fichiers vont directement de yt-dlp vers le dossier que tu choisis. Rien ne passe par un serveur distant.",
  p3_h: "Télémétrie anonyme",
  p3_p: "Télémétrie anonyme via OpenPanel — un identifiant aléatoire par installation aide à compter les lancements, versions, OS et crashs ; pas d’URLs, titres, chemins de fichiers, infos de compte, fingerprinting ni données personnelles. Tes téléchargements, historique et fichiers ne quittent jamais ta machine.",
  p4_h: "Pas de pub, pas d'upsell",
  p4_p: "Licence MIT. Pas de niveau premium, pas de fonctions verrouillées, pas de bannières publicitaires, pas de dark patterns. Tout le pipeline tourne en local via yt-dlp + ffmpeg.",

  install_eyebrow: "Installer",
  install_h2: "Choisissez votre canal.",
  install_sub:
    "Téléchargement direct ou tout gestionnaire de paquets majeur — tous mis à jour automatiquement à chaque release.",
  badge_windows: "Windows",
  badge_macos: "macOS",
  badge_linux: "Linux",
  badge_all: "Tous",
  winget_desc: "Recommandé pour Windows 10/11. Se met à jour avec le système.",
  scoop_desc: "Installation portable via le bucket Scoop. Aucun droit admin requis.",
  brew_desc: "Tap le cask, installation en une commande. Binaire universel (Intel + Apple Silicon).",
  flatpak_h: "Flatpak",
  flatpak_desc: "Installation en sandbox. Télécharge le bundle .flatpak depuis les Releases, installe-le en une commande. Pas de configuration Flathub nécessaire.",
  direct_h: "Téléchargement direct",
  direct_desc: "Installeur NSIS, .exe portable, .dmg, .AppImage ou .flatpak — directement depuis GitHub Releases.",
  direct_btn: "Ouvrir les Releases →",
  copy_label: "Copier",
  copied_label: "Copié !",

  footer_made_by: "Licence MIT · Fait avec soin par",
  footer_github: "GitHub",
  footer_issues: "Issues",
  footer_releases: "Releases",
  footer_languages_label: "Langue :",

  faq_eyebrow: "FAQ",
  faq_h2: "Questions fréquentes",
  faq_q1: "Quelles qualités de vidéo puis-je télécharger ?",
  faq_a1:
    "Tout ce que YouTube et les autres sites supportés proposent — 4K UHD (2160p), 1440p QHD, 1080p Full HD, 720p, 480p, 360p et audio seul. Les flux haut framerate (60 fps, 120 fps) et le HDR sont préservés tels quels. Arroxy te montre tous les formats disponibles, y compris la conversion en MP3, M4A/AAC, Opus et WAV pour les téléchargements audio seuls.",
  faq_q2: "C'est vraiment gratuit ?",
  faq_a2:
    "Oui. Licence MIT. Pas de version premium, pas de fonctions verrouillées.",
  faq_q3: "Dans quelles langues Arroxy est-il disponible ?",
  faq_a3:
    "Vingt-et-une, prêtes à l'emploi : English, Español (espagnol), Deutsch (allemand), Français, 日本語 (japonais), 中文 (chinois), Русский (russe), Українська (ukrainien), हिन्दी (hindi), Afaan Oromoo, Kiswahili, O'zbekcha (ouzbek), Tiếng Việt (vietnamien), አማርኛ (amharique), العربية (arabe), اردو (ourdou), پښتو (pachto), বাংলা (bengali), မြန်မာဘာသာ (birman), Ελληνικά (grec) et Српски (serbe). Arroxy détecte la langue de ton système d'exploitation au premier lancement et tu peux changer à tout moment depuis le sélecteur de langue dans la barre d'outils. Les traductions sont de simples objets TypeScript dans src/shared/i18n/locales/ — ouvre une PR sur GitHub pour contribuer.",
  faq_q4: "Faut-il installer quelque chose ?",
  faq_a4:
    "Non. yt-dlp est téléchargé automatiquement au premier lancement et mis en cache sur ta machine ; ffmpeg et ffprobe sont inclus dans l’app. Après ça, aucune configuration supplémentaire.",
  faq_q5:
    "Est-ce que ça continuera de marcher si YouTube change quelque chose ?",
  faq_a5:
    "Oui — et Arroxy a deux couches de résilience. Premièrement, yt-dlp est l'un des outils open source les plus activement maintenus — il est mis à jour dans les heures qui suivent les changements sur les sites supportés, YouTube inclus. Deuxièmement, Arroxy ne dépend pas du tout des cookies ni de ton compte Google, donc aucune session n'expire et aucun identifiant à renouveler. Cette combinaison le rend bien plus stable que les outils dépendant de cookies de navigateur exportés.",
  faq_q6: "Puis-je télécharger des playlists ?",
  faq_a6:
    "Oui. Colle l'URL d'une playlist, sélectionne toutes les vidéos ou seulement celles que tu veux, et Arroxy les met en file comme un seul lot. Les téléchargements par lot de chaînes entières ne sont pas encore pris en charge.",
  faq_q7: "A-t-il besoin de mon compte YouTube ou de cookies ?",
  faq_a7:
    "Par défaut, non — Arroxy fonctionne sans compte, connexion ni export de cookies. Le support optionnel des cookies est disponible dans les Paramètres avancés (fichier ou import depuis navigateur) pour les contenus nécessitant une authentification, comme les vidéos à restriction d'âge ou réservées aux membres. Désactivé par défaut. Si tu l'actives, la doc de yt-dlp prévient que l'automatisation par cookies peut signaler un compte Google — un compte jetable est le choix le plus sûr.",
  faq_q8:
    'macOS dit « l\'application est endommagée » ou « ne peut pas être ouverte » — que faire ?',
  faq_a8:
    "C'est Gatekeeper de macOS qui bloque une app non signée — pas un vrai dommage. Le README contient la marche à suivre pour le premier lancement sur macOS.",
  faq_q9: "C'est légal ?",
  faq_a9:
    "Télécharger des vidéos pour un usage personnel est généralement accepté dans la plupart des juridictions. Tu es responsable de respecter les Conditions d'Utilisation de YouTube et les lois de ton pays.",

  f13_h: "YouTube + 2000 sites",
  f13_p: "Au-delà de YouTube, Arroxy télécharge depuis plus de 2000 sites supportés par yt-dlp — Vimeo, Twitch, Twitter/X, TikTok, SoundCloud, Bandcamp, Bilibili, BBC iPlayer, archive.org et bien plus encore. L'audio seul et les sous-titres fonctionnent partout, pas seulement sur YouTube.",

  mid_cta_h2: "Ça te plaît ?",
  mid_cta_sub: "Télécharge gratuitement. Sans compte, sans pub, sans engagement.",
  end_cta_h2: "Gratuit pour toujours. Open source. Sans arnaque.",
  end_cta_sub: "Rejoins des milliers de personnes qui téléchargent avec Arroxy. Un clic, et ça marche.",

  blog_eyebrow: "Blog",
  blog_index_h1: "Arroxy Blog",
  blog_index_tagline: "Comparatifs, analyses approfondies et notes de version de l'équipe Arroxy.",
  blog_read_more: "Lire →",
  blog_published_prefix: "Publié",
  blog_updated_prefix: "Mis à jour",
  blog_by_author: "par",
  blog_back_to_index: "← Retour au blog",
  blog_lang_note: "Cet article n'est actuellement disponible qu'en anglais.",
};
