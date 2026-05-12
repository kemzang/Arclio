// Landing-page translations for "es". One key per string; build.mjs
// validates parity against en.mjs at build time.
//
// Keys ending in `_html` are injected as raw HTML so translations can
// keep inline tags like <em>. Everything else is HTML-escaped.

export const es = {
  title: "Arroxy — Descargador 4K de YouTube + 2000 sitios gratuito, sin inicio de sesión",
  description:
    "Descargador de escritorio gratuito con licencia MIT para YouTube y más de 2000 sitios compatibles en Windows, macOS y Linux. Descarga videos en hasta 4K HDR a 60 fps. Sin anuncios, sin bloatware, sin ventas adicionales.",
  og_title: "Arroxy — Descargador 4K de YouTube + 2000 sitios gratuito, sin inicio de sesión",
  og_description:
    "Descargador 4K gratuito para YouTube y más de 2000 sitios. Sin anuncios, sin bloatware, sin ventas adicionales. Licencia MIT. Windows · macOS · Linux.",

  nav_features: "Funciones",
  nav_screenshots: "Capturas",
  nav_install: "Instalar",
  nav_blog: "Blog",
  nav_download: "Descargar",

  hero_eyebrow: "Open Source · MIT · Desarrollo activo",
  hero_h1_a: "Descargador 4K de YouTube (+ 2000 sitios) gratuito.",
  hero_h1_b: "Sin anuncios, sin bloatware, sin ventas adicionales.",
  hero_tagline:
    "Arroxy es un descargador de escritorio gratuito con licencia MIT para YouTube y más de 2000 sitios compatibles en Windows, macOS y Linux. Descarga videos en hasta 4K HDR a 60 fps. Sin anuncios, sin bloatware, sin ventas adicionales — solo pega una URL y listo.",
  hero_trust: "Audita cada línea en GitHub.",
  pill_no_account: "Sin anuncios",
  pill_no_tracking: "Sin rastreo",
  pill_open_source: "Código abierto (MIT)",
  cta_download_os: "Descargar para tu SO",
  cta_view_github: "Ver en GitHub",
  release_label: "Última versión:",
  release_loading: "cargando…",

  cta_download_windows: "Descargar para Windows",
  cta_download_windows_portable: "Portátil .exe (sin instalación)",
  cta_download_mac_arm: "Descargar para macOS (Apple Silicon)",
  cta_download_mac_intel: "¿Mac con Intel? Obtener DMG x64",
  cta_download_linux_appimage: "Descargar para Linux (.AppImage)",
  cta_download_linux_flatpak: "Paquete Flatpak →",
  cta_other_platforms: "Otras plataformas / Todas las descargas",
  cta_os_windows: "Windows",
  cta_os_mac: "macOS",
  cta_os_linux: "Linux",
  cta_installer_label: "Instalador",
  cta_portable_label: "Portátil",
  cta_arm_label: "Apple Silicon",
  cta_intel_label: "Intel",
  mobile_notice: "Arroxy es una app de escritorio para Windows, macOS y Linux.",
  mobile_notice_sub: "Visita esta página desde tu computadora para descargar.",
  mobile_copy_link: "Copiar enlace de la página",
  first_launch_label: "Ayuda en el primer arranque",
  first_launch_windows_html:
    "Windows SmartScreen puede mostrar <em>\"Windows protected your PC\"</em> o <em>\"Unknown publisher\"</em> en el primer arranque — Arroxy es gratuito y de código abierto, y las compilaciones de Windows no están firmadas con un certificado de pago. Esto aplica tanto a <code>Arroxy-Setup-*.exe</code> como a <code>Arroxy-Portable-*.exe</code> y <strong>no</strong> significa que Arroxy sea inseguro. Haz clic en <strong>More info</strong> y luego en <strong>Run anyway</strong>. Descarga Arroxy solo desde la página oficial de GitHub Releases — el código fuente es público, así que puedes inspeccionarlo o compilarlo tú mismo.",
  first_launch_mac_html:
    "macOS muestra un aviso de <em>desarrollador no identificado</em> en el primer arranque — Arroxy aún no está firmada. <strong>Clic derecho en el icono → Abrir</strong>, luego pulsa <strong>Abrir</strong> en el diálogo. Solo la primera vez.",
  first_launch_linux_html:
    "<strong>AppImage:</strong> clic derecho en el archivo → <strong>Propiedades → Permitir ejecutar como programa</strong>, o ejecuta <code>chmod +x Arroxy-*.AppImage</code> en una terminal. Si aún no inicia, instala <code>libfuse2</code> (Ubuntu/Debian), <code>fuse-libs</code> (Fedora) o <code>fuse2</code> (Arch).<br><br><strong>Flatpak:</strong> <code>flatpak install --user Arroxy-*.flatpak</code>, luego ábrelo desde el menú de aplicaciones o ejecuta <code>flatpak run io.github.antonio_orionus.Arroxy</code>.",

  features_eyebrow: "Qué hace",
  features_h2: "Todo lo que esperas, sin fricción.",
  features_sub: "Pega una URL, elige la calidad, haz clic en descargar. Así de simple.",
  f1_h: "Hasta 4K UHD",
  f1_p: "2160p, 1440p, 1080p, 720p — todas las resoluciones que ofrecen YouTube y otros sitios compatibles, más conversión de solo audio a MP3, M4A/AAC, Opus y WAV.",
  f2_h: "60 fps y HDR preservados",
  f2_p: "Las transmisiones de alta tasa de fotogramas y HDR llegan tal como las codifica YouTube — sin pérdida de calidad.",
  f3_h: "También playlists",
  f3_p: "Pega la URL de una playlist, descarga la lista completa o marca solo los videos que quieras antes de que Arroxy los ponga en cola.",
  f4_h: "Actualizaciones automáticas",
  f4_p: "Arroxy mantiene yt-dlp al día y trae ffmpeg incluido en la app — publica correcciones semanalmente a medida que YouTube y otros sitios evolucionan.",
  f5_h: "21 idiomas",
  f5_p: "English, Español, Deutsch, Français, 日本語, 中文, Русский, Українська, हिन्दी, Afaan Oromoo, Kiswahili, O'zbekcha, Tiếng Việt, አማርኛ, العربية, اردو, پښتو, বাংলা, မြန်မာဘာသာ, Ελληνικά, Српски — detecta el tuyo automáticamente.",
  f6_h: "Multiplataforma",
  f6_p: "Compilaciones nativas para Windows, macOS y Linux — instalador, portátil, DMG o AppImage.",
  f7_h: "Subtítulos a tu manera",
  f7_p: "Subtítulos manuales o automáticos en SRT, VTT o ASS — junto al video, integrados en un .mkv portátil, o en una subcarpeta Subtitles/.",
  f8_h: "SponsorBlock integrado",
  f8_p: "Omite o marca segmentos de patrocinadores, intros, outros, autopromociones y más — recórtalos con FFmpeg o simplemente añade capítulos. Tú decides, por categoría.",
  f9_h: "Autocompletar desde portapapeles",
  f9_p: "Copia cualquier enlace compatible en cualquier lugar y Arroxy lo detecta en el momento en que vuelves — un diálogo de confirmación mantiene el control. Actívalo o desactívalo en Configuración avanzada.",
  f10_h: "Limpieza automática de URLs",
  f10_p: "Los parámetros de seguimiento (si, pp, feature, utm_*, fbclid, gclid y más) se eliminan automáticamente de los enlaces pegados, y los envoltorios youtube.com/redirect se desempaquetan — el campo de URL siempre muestra el enlace canónico.",
  f11_h: "Se oculta en la bandeja",
  f11_p: "Cerrar la ventana lleva Arroxy a la bandeja del sistema. Las descargas siguen ejecutándose en segundo plano — haz clic en el icono para volver a la ventana, o sal desde el menú de la bandeja.",
  f12_h: "Metadatos y portada integrados",
  f12_p: "Título, fecha de subida, artista, descripción, portada y marcadores de capítulo escritos directamente en el archivo — sin archivos auxiliares ni etiquetado manual.",

  shots_eyebrow: "Velo en acción",
  shots_h2: "Diseñado para la claridad, no para el desorden.",
  shot1_alt: "Pega una URL",
  shot2_alt: "Elige tu calidad",
  shot3_alt: "Elige dónde guardar",
  shot4_alt: "Descargas en paralelo",
  shot5_alt: "Paso de subtítulos — elige idiomas, formato y modo de guardado",
  og_image_alt: "Icono de la app Arroxy — app de escritorio para descargar videos de YouTube y más de 2000 sitios en 4K.",

  privacy_eyebrow: "Privacidad",
  privacy_h2_html: "Lo que Arroxy <em>no</em> hace.",
  privacy_sub:
    "Procesamiento 100% local. Sin anuncios, sin ventas adicionales, sin servidores de terceros — los archivos van directamente de yt-dlp a tu disco.",
  p1_h: "Sin inicio de sesión requerido",
  p1_p: "El modo predeterminado funciona sin ninguna cuenta de Google ni inicio de sesión. El soporte opcional de cookies está disponible en Configuración avanzada para contenido con restricción de edad o solo para miembros — desactivado por defecto.",
  p2_h: "Solo archivos locales",
  p2_p: "Los archivos van directamente de yt-dlp a la carpeta que elijas. Nada pasa por un servidor remoto.",
  p3_h: "Telemetría anónima",
  p3_p: "Telemetría anónima vía OpenPanel — un ID aleatorio por instalación ayuda a contar arranques, versiones, OS y fallos; sin URLs, títulos, rutas de archivo, datos de cuenta, fingerprinting ni datos personales. Tus descargas, historial y archivos nunca salen de tu máquina.",
  p4_h: "Sin anuncios, sin ventas adicionales",
  p4_p: "Licencia MIT. Sin nivel premium, sin funciones bloqueadas, sin banners publicitarios, sin patrones oscuros. Todo el proceso se ejecuta localmente con yt-dlp + ffmpeg.",

  install_eyebrow: "Instalar",
  install_h2: "Elige tu canal.",
  install_sub:
    "Descarga directa o cualquier gestor de paquetes — todos se actualizan automáticamente con cada versión.",
  badge_windows: "Windows",
  badge_macos: "macOS",
  badge_linux: "Linux",
  badge_all: "Todo",
  winget_desc: "Recomendado para Windows 10/11. Se actualiza con el sistema.",
  scoop_desc: "Instalación portátil vía Scoop bucket. No requiere permisos de administrador.",
  brew_desc: "Añade el tap, instala con un comando. Binario universal (Intel + Apple Silicon).",
  flatpak_h: "Flatpak",
  flatpak_desc: "Instalación con sandbox. Descarga el bundle .flatpak desde Releases e instálalo con un comando. Sin configurar Flathub.",
  direct_h: "Descarga directa",
  direct_desc: "Instalador NSIS, .exe portátil, .dmg, .AppImage o .flatpak — directo desde GitHub Releases.",
  direct_btn: "Abrir Releases →",
  copy_label: "Copiar",
  copied_label: "¡Copiado!",

  footer_made_by: "Licencia MIT · Hecho con cariño por",
  footer_github: "GitHub",
  footer_issues: "Issues",
  footer_releases: "Releases",
  footer_languages_label: "Idioma:",

  faq_eyebrow: "FAQ",
  faq_h2: "Preguntas frecuentes",
  faq_q1: "¿Qué calidades de video puedo descargar?",
  faq_a1:
    "Todo lo que ofrecen YouTube y otros sitios compatibles — 4K UHD (2160p), 1440p QHD, 1080p Full HD, 720p, 480p, 360p y solo audio. Las transmisiones de alta tasa de cuadros (60 fps, 120 fps) y el contenido HDR se conservan tal cual. Arroxy te muestra todos los formatos disponibles, incluida la conversión a MP3, M4A/AAC, Opus y WAV para descargas de solo audio.",
  faq_q2: "¿De verdad es gratis?",
  faq_a2: "Sí. Licencia MIT. Sin nivel premium, sin funciones bloqueadas.",
  faq_q3: "¿En qué idiomas está disponible Arroxy?",
  faq_a3:
    "Veintiuno, listos para usar: English, Español, Deutsch (alemán), Français (francés), 日本語 (japonés), 中文 (chino), Русский (ruso), Українська (ucraniano), हिन्दी (hindi), Afaan Oromoo, Kiswahili, O'zbekcha (uzbeko), Tiếng Việt (vietnamita), አማርኛ (amhárico), العربية (árabe), اردو (urdu), پښتو (pastún), বাংলা (bengalí), မြန်မာဘာသာ (birmano), Ελληνικά (griego) y Српски (serbio). Arroxy detecta el idioma de tu sistema operativo en el primer arranque y puedes cambiarlo en cualquier momento desde el selector de idioma en la barra de herramientas. Las traducciones viven como objetos TypeScript planos en src/shared/i18n/locales/ — abre un PR en GitHub para contribuir.",
  faq_q4: "¿Necesito instalar algo?",
  faq_a4:
    "No. yt-dlp se descarga automáticamente en el primer arranque y se guarda en caché en tu máquina; ffmpeg y ffprobe vienen incluidos con la app. Después de eso, no se necesita configuración adicional.",
  faq_q5: "¿Seguirá funcionando si YouTube cambia algo?",
  faq_a5:
    "Sí — y Arroxy tiene dos capas de resiliencia. Primero, yt-dlp es una de las herramientas open-source más mantenidas activamente — se actualiza en horas tras cualquier cambio en los sitios compatibles, incluido YouTube. Segundo, Arroxy no depende de cookies ni de tu cuenta de Google, así que no hay sesión que caduque ni credenciales que rotar. Esa combinación lo hace mucho más estable que las herramientas que dependen de cookies exportadas del navegador.",
  faq_q6: "¿Puedo descargar listas de reproducción?",
  faq_a6:
    "Sí. Pega la URL de una playlist, selecciona todos los videos o solo los que quieras, y Arroxy los pone en cola como un solo lote. Las descargas por lotes de canales completos todavía no están disponibles.",
  faq_q7: "¿Necesita mi cuenta de YouTube o cookies?",
  faq_a7:
    "Por defecto, no — Arroxy funciona sin cuenta, inicio de sesión ni exportación de cookies. El soporte opcional de cookies está disponible en Configuración avanzada (archivo o importación desde navegador) para contenido que requiere autenticación, como videos con restricción de edad o solo para miembros. Está desactivado por defecto. Si lo activas, la propia documentación de yt-dlp advierte que la automatización basada en cookies puede marcar una cuenta de Google, por lo que una cuenta desechable es la opción más segura.",
  faq_q8:
    'macOS dice "la aplicación está dañada" o "no se puede abrir" — ¿qué hago?',
  faq_a8:
    "Es Gatekeeper de macOS bloqueando una app sin firmar — no es un daño real. El README tiene instrucciones paso a paso para el primer arranque en macOS.",
  faq_q9: "¿Es legal?",
  faq_a9:
    "Descargar videos para uso personal generalmente se acepta en la mayoría de jurisdicciones. Eres responsable de cumplir con los Términos de Servicio de YouTube y las leyes de tu país.",

  f13_h: "YouTube + 2000 sitios",
  f13_p: "Más allá de YouTube, Arroxy descarga de más de 2000 sitios que soporta yt-dlp — Vimeo, Twitch, Twitter/X, TikTok, SoundCloud, Bandcamp, Bilibili, BBC iPlayer, archive.org y muchos más. El audio solo y los subtítulos funcionan en todas partes, no solo en YouTube.",

  mid_cta_h2: "¿Te convence lo que ves?",
  mid_cta_sub: "Descarga gratis. Sin cuenta, sin anuncios, sin compromisos.",
  end_cta_h2: "Gratis para siempre. Código abierto. Sin trampa.",
  end_cta_sub: "Únete a miles que descargan con Arroxy. Un clic y funciona sin más.",
};
