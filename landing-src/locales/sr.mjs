// Landing-page translations for "sr". One key per string; build.mjs
// validates parity against en.mjs at build time.
//
// Keys ending in `_html` are injected as raw HTML so translations can
// keep inline tags like <em>. Everything else is HTML-escaped.

export const sr = {
  title: "Arroxy — Бесплатни 4K преузимач за YouTube + 2000 сajтова, без пријаве",
  description:
    "Бесплатни десктоп преузимач за YouTube и 2000+ подржаних сaјтова под MIT лиценцом за Windows, macOS и Linux. Преузимајте видео снимке у до 4K HDR при 60 fps. Без реклама, без непотребног, без додатне продаје.",
  og_title: "Arroxy — Бесплатни 4K преузимач за YouTube + 2000 сajтова, без пријаве",
  og_description:
    "Бесплатни 4K преузимач за YouTube и 2000+ сaјтова. Без реклама, без непотребног, без додатне продаје. MIT лиценца. Windows · macOS · Linux.",

  nav_features: "Функције",
  nav_screenshots: "Снимци екрана",
  nav_install: "Инсталација",
  nav_blog: "Blog",
  nav_download: "Преузми",

  hero_eyebrow: "Open Source · MIT · Активни развој",
  hero_h1_a: "Бесплатни 4K преузимач за YouTube (+ 2000 сajтова).",
  hero_h1_b: "Без реклама, без непотребног, без додатне продаје.",
  hero_tagline:
    "Arroxy је бесплатни десктоп преузимач за YouTube и 2000+ подржаних сaјтова под MIT лиценцом за Windows, macOS и Linux. Преузима видео снимке у до 4K HDR при 60 fps. Без реклама, без непотребног, без додатне продаје — само налепите URL и кренути.",
  hero_trust: "Прегледајте сваку линију на GitHub-у.",
  pill_no_account: "Без реклама",
  pill_no_tracking: "Без праћења",
  pill_open_source: "Отворени код (MIT)",
  cta_download_os: "Преузми за ваш оперативни систем",
  cta_view_github: "Погледај на GitHub",
  release_label: "Последња верзија:",
  release_loading: "учитавање…",

  cta_download_windows: "Преузми за Windows",
  cta_download_windows_portable: "Портабилни .exe (без инсталације)",
  cta_download_mac_arm: "Преузми за macOS (Apple Silicon)",
  cta_download_mac_intel: "Intel Mac? Преузми x64 DMG",
  cta_download_linux_appimage: "Преузми за Linux (.AppImage)",
  cta_download_linux_flatpak: "Flatpak пакет →",
  cta_other_platforms: "Остале платформе / Сва преузимања",
  cta_os_windows: "Windows",
  cta_os_mac: "macOS",
  cta_os_linux: "Linux",
  cta_installer_label: "Инсталер",
  cta_portable_label: "Портабилна",
  cta_arm_label: "Apple Silicon",
  cta_intel_label: "Intel",
  mobile_notice: "Arroxy је десктоп апликација за Windows, macOS и Linux.",
  mobile_notice_sub: "Посетите ову страницу на рачунару да бисте преузели.",
  mobile_copy_link: "Копирај линк странице",
  first_launch_label: "Помоћ при првом покретању",
  first_launch_windows_html:
    "Windows SmartScreen може приказати <em>«Windows protected your PC»</em> или <em>«Unknown publisher»</em> при prvom покретању — Arroxy је бесплатан и отвореног кода, а Windows верзије нису потписане плаћеним сертификатом. Ово се односи на <code>Arroxy-Setup-*.exe</code> и <code>Arroxy-Portable-*.exe</code> и <strong>не</strong> значи да је Arroxy несигуран. Кликните <strong>More info</strong>, затим <strong>Run anyway</strong>. Преузимајте Arroxy искључиво са званичне GitHub Releases странице — изворни код је јаван, тако да га можете сами прегледати или компајлирати.",
  first_launch_mac_html:
    "macOS при првом покретању приказује упозорење о <em>непознатом програмеру</em> — Arroxy још увек није потписан. <strong>Десни клик на икону апликације → Отвори</strong>, затим кликните <strong>Отвори</strong> у дијалогу. Потребно само једном.",
  first_launch_linux_html:
    "<strong>AppImage:</strong> десни клик на датотеку → <strong>Својства → Дозволи извршавање као програм</strong>, или покрените <code>chmod +x Arroxy-*.AppImage</code> у терминалу. Ако покретање и даље не успе, инсталирајте <code>libfuse2</code> (Ubuntu/Debian), <code>fuse-libs</code> (Fedora) или <code>fuse2</code> (Arch).<br><br><strong>Flatpak:</strong> <code>flatpak install --user Arroxy-*.flatpak</code>, затим покрените из менија апликација или извршите <code>flatpak run io.github.antonio_orionus.Arroxy</code>.",

  features_eyebrow: "Шта ради",
  features_h2: "Све што очекујете, без непотребних сложености.",
  features_sub: "Налепите URL, одаберите квалитет, кликните преузми. То је све.",
  f1_h: "До 4K UHD",
  f1_p: "2160p, 1440p, 1080p, 720p — svaka rezolucija koju YouTube i drugi podržani sajтovi nude, plus konverzija samo zvuka u MP3, M4A/AAC, Opus i WAV.",
  f2_h: "60 fps и HDR без губитака",
  f2_p: "Потоци са великом брзином кадрова и HDR долазе тачно онако како их YouTube кодује — без губитка квалитета.",
  f3_h: "I plejliste",
  f3_p: "Nalepi URL plejliste, preuzmi celu listu ili označi samo video snimke koje želiš pre nego što ih Arroxy stavi u red.",
  f4_h: "Аутоматска ажурирања",
  f4_p: "Arroxy одржава yt-dlp ажурним, а ffmpeg стиже унутар апликације — испоручује исправке недељно у складу са изменама YouTube-а и других сajтова.",
  f5_h: "21 језик",
  f5_p: "English, Español, Deutsch, Français, 日本語, 中文, Русский, Українська, हिन्दी, Afaan Oromoo, Kiswahili, O'zbekcha, Tiếng Việt, አማርኛ, العربية, اردو, پښتو, বাংলা, မြန်မာဘာသာ, Ελληνικά, Српски — аутоматски препознаје ваш.",
  f6_h: "Вишеплатформски",
  f6_p: "Нативне верзије за Windows, macOS и Linux — инсталер, портабилна верзија, DMG или AppImage.",
  f7_h: "Титлови по вашој мери",
  f7_p: "Ручно или аутоматски генерисани титлови у SRT, VTT или ASS формату — сачувани поред видеа, уграђени у портабилни .mkv или смештени у фасциклу Subtitles/.",
  f8_h: "SponsorBlock уграђен",
  f8_p: "Прескочите или означите сегменте спонзора, уводе, одјаве, само-промоције и још много тога — исеците их преко FFmpeg-а или само додајте поглавља. Ваш избор, по категорији.",
  f9_h: "Аутоматско попуњавање из клипборда",
  f9_p: "Копирајте bilo koji podržani линк где год и Arroxy ће га открити чим се вратите — упит за потврду вас держи у контроли. Укључите или искључите у напредним подешавањима.",
  f10_h: "Аутоматско чишћење URL-ова",
  f10_p: "Параметри за праћење (si, pp, feature, utm_*, fbclid, gclid и остали) аутоматски се уклањају из налепљених линкова, а youtube.com/redirect омотачи се развијају — поље за URL увек приказује канонски линк.",
  f11_h: "Скривање у системску траку",
  f11_p: "Затварање прозора склања Arroxy у системску траку. Преузимања настављају да раде у позадини — кликните на икону у траци да вратите прозор, или изађите из менија траке.",
  f12_h: "Уграђени метаподаци и омот",
  f12_p: "Наслов, датум отпремања, аутор, опис, омот и маркери поглавља уписани директно у датотеку — без пратећих датотека, без ручног означавања.",

  shots_eyebrow: "Погледај у акцији",
  shots_h2: "Направљено за јасноћу, не за неред.",
  shot1_alt: "Налепите URL",
  shot2_alt: "Одаберите квалитет",
  shot3_alt: "Одаберите где да сачувате",
  shot4_alt: "Паралелна преузимања",
  shot5_alt: "Корак са титловима — одаберите језике, формат и начин чувања",
  og_image_alt: "Икона апликације Arroxy — десктоп апликација за преузимање YouTube и 2000+ сaјтова у 4K.",

  privacy_eyebrow: "Приватност",
  privacy_h2_html: "Шта Arroxy <em>не ради</em>.",
  privacy_sub:
    "100% локална обрада. Без реклама, без додатне продаје, без сервера трећих страна — фajлови иду директно са yt-dlp на ваш диск.",
  p1_h: "Пријава није потребна",
  p1_p: "Подразумевани режим ради без Google налога или пријаве. Опционална подршка за колачиће доступна је у напредним подешавањима за садржај са ограниченим приступом — подразумевано искључена.",
  p2_h: "Само локалне датотеке",
  p2_p: "Фajлови иду директно са yt-dlp у фасциклу коју одаберете. Ништа не пролази кроз удаљени сервер.",
  p3_h: "Анонимна телеметрија",
  p3_p: "Анонимна телеметрија преко OpenPanel-а — насумични ID по инсталацији помаже да се броје покретања, верзије, OS и рушења; без URL-ова, наслова, путања датотека, података о налогу, fingerprinting-а или личних података. Ваша преузимања, историја и датотеке никада не напуштају ваш уређај.",
  p4_h: "Без реклама, без додатне продаје",
  p4_p: "MIT лиценца. Без премијум нивоа, без ограничавања функција, без баннерних реклама, без тамних образаца. Цео процес ради локално преко yt-dlp + ffmpeg.",

  install_eyebrow: "Инсталација",
  install_h2: "Одаберите канал.",
  install_sub:
    "Директно преузимање или неки од популарних менаџера пакета — сви се аутоматски ажурирају са сваким издањем.",
  badge_windows: "Windows",
  badge_macos: "macOS",
  badge_linux: "Linux",
  badge_all: "Све",
  winget_desc: "Препоручено за Windows 10/11. Аутоматски се ажурира са системом.",
  scoop_desc: "Портабилна инсталација преко Scoop bucket-а. Нису потребна администраторска права.",
  brew_desc: "Додајте tap, инсталирајте једном командом. Универзална верзија (Intel + Apple Silicon).",
  flatpak_h: "Flatpak",
  flatpak_desc: "Инсталација у изолованом окружењу. Преузмите .flatpak пакет из Releases-а и инсталирајте jednom командом. Није потребно подешавање Flathub-а.",
  direct_h: "Директно преузимање",
  direct_desc: "NSIS инсталер, портабилни .exe, .dmg, .AppImage или .flatpak — директно са GitHub Releases.",
  direct_btn: "Отвори Releases →",
  copy_label: "Копирај",
  copied_label: "Копирано!",

  footer_made_by: "MIT лиценца · Направљено са пажњом:",
  footer_github: "GitHub",
  footer_issues: "Issues",
  footer_releases: "Releases",
  footer_languages_label: "Језик:",

  faq_eyebrow: "ЧПП",
  faq_h2: "Често постављана питања",
  faq_q1: "Које квалитете видеа могу да преузмем?",
  faq_a1:
    "Sve što YouTube i drugi podržani sajtovi nude — 4K UHD (2160p), 1440p QHD, 1080p Full HD, 720p, 480p, 360p i samo audio. Strimovi sa visokim brojem frejmova (60 fps, 120 fps) i HDR sadržaj ostaju netaknuti. Arroxy prikazuje svaki dostupni format, uključujući konverziju u MP3, M4A/AAC, Opus i WAV za preuzimanja samo zvuka.",
  faq_q2: "Да ли је заиста бесплатно?",
  faq_a2: "Да. MIT лиценца. Нема премијум нивоа, нема ограничених функција.",
  faq_q3: "На којим је језицима Arroxy доступан?",
  faq_a3:
    "Двадесет и један, одмах из кутије: English, Español (шпански), Deutsch (немачки), Français (француски), 日本語 (јапански), 中文 (кинески), Русский (руски), Українська (украјински), हिन्दी (хинди), Afaan Oromoo (оромо), Kiswahili (свахили), O'zbekcha (узбечки), Tiếng Việt (вијетнамски), አማርኛ (амхарски), العربية (арапски), اردو (урду), پښتو (пашто), বাংলা (бенгалски), မြန်မာဘာသာ (бурмански), Ελληνικά (грчки) и Српски. Arroxy аутоматски препознаје језик вашег оперативног система при prvom покретању и можете да пређете на други у сваком тренутку преко бирача језика у траци са алаткама. Преводи су обични TypeScript објекти у src/shared/i18n/locales/ — отворите PR на GitHub-у да допринесете.",
  faq_q4: "Да ли треба да инсталирам нешто додатно?",
  faq_a4:
    "Не. yt-dlp се аутоматски преузима при првом покретању и кешира на вашем рачунару; ffmpeg и ffprobe стижу уз апликацију. Након тога није потребно додатно подешавање.",
  faq_q5: "Да ли ће наставити да ради ако YouTube нешто промени?",
  faq_a5:
    "Да — и Arroxy има два слоја отпорности. Прво, yt-dlp је један од најактивније одржаваних алата отвореног кода — ажурира се у року od неколико сати након промена на било ком подржаном сajту, укључујући YouTube. Друго, Arroxy уопште не зависи од колачића или вашег Google налога, па нема сесија које истичу нити акредитива које треба мењати. Та комбинација чини га знатно стабилнијим од алата који зависе од извожења колачића из претраживача.",
  faq_q6: "Могу ли да преузимам плејлисте?",
  faq_a6:
    "Da. Nalepi URL plejliste, izaberi sve video snimke ili samo one koje želiš, a Arroxy će ih staviti u red kao jedan batch. Grupno preuzimanje celih kanala još nije podržano.",
  faq_q7: "Да ли му је потребан мој YouTube налог или колачићи?",
  faq_a7:
    "Подразумевано не — Arroxy ради без налога, пријаве или извоза колачића. Опционална подршка за колачиће доступна је у напредним подешавањима (фajл или импорт из претраживача) за садржај који захтева аутентификацију, попут видеа са старосним ограничењем или доступних само члановима. Подразумевано је искључена. Ако је омогућите, сопствена документација yt-dlp-а упозорава да аутоматизација заснована на колачићима може довести до означавања Google налога — у том случају је безбедније користити налог за једнократну употребу.",
  faq_q8:
    'macOS каже „апликација је оштећена" или „не може да се отвори" — шта да радим?',
  faq_a8:
    "То је macOS Gatekeeper блокира непотписану апликацију — нема стварног оштећења. README садржи упутства корак по корак за прво покретање на macOS-у.",
  faq_q9: "Да ли је ово законито?",
  faq_a9:
    "Преузимање видеа за личну употребу углавном је прихватљиво у većini јурисдикција. Ви сте одговорни за поштовање Услова коришћења YouTube-а и ваших локалних закона.",

  f13_h: "YouTube + 2000 сajтова",
  f13_p: "Поред YouTube-а, Arroxy преузима са 2000+ сaјтова које yt-dlp подржава — Vimeo, Twitch, Twitter/X, TikTok, SoundCloud, Bandcamp, Bilibili, BBC iPlayer, archive.org и многих других. Режим само аудио и титлови раде свуда, не само на YouTube-у.",

  mid_cta_h2: "Свиђа вам се?",
  mid_cta_sub: "Преузмите бесплатно. Без налога, без реклама, без обавеза.",
  end_cta_h2: "Бесплатно заувек. Отворени код. Без скривених услова.",
  end_cta_sub: "Хиљаде корисника већ преузима преко Arroxy. Један клик — и само ради.",
};
