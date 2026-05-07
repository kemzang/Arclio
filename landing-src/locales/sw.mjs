// Landing-page translations for "sw". One key per string; build.mjs
// validates parity against en.mjs at build time.
//
// Keys ending in `_html` are injected as raw HTML so translations can
// keep inline tags like <em>. Everything else is HTML-escaped.

export const sw = {
  title: "Arroxy — Kipakuliaji cha YouTube cha Bure cha 4K, Hakuna Kuingia",
  description:
    "Kipakuliaji cha YouTube cha desktop, bure, chenye leseni ya MIT kwa Windows, macOS, na Linux. Pakua video hadi 4K HDR kwa 60 fps bila akaunti ya Google, vidakuzi vya kivinjari, au kuingia yoyote.",
  og_title: "Arroxy — Kipakuliaji cha YouTube cha Bure cha 4K, Hakuna Kuingia",
  og_description:
    "Kipakuliaji cha YouTube cha bure cha 4K. Bila vidakuzi, bila kuingia, bila vikao vilivyovunjika. Leseni ya MIT. Windows · macOS · Linux.",

  nav_features: "Vipengele",
  nav_screenshots: "Picha za skrini",
  nav_install: "Sakinisha",
  nav_blog: "Blog",
  nav_download: "Pakua",

  hero_eyebrow: "Open Source · MIT · Maendeleo yanayoendelea",
  hero_h1_a: "Kipakuliaji cha YouTube cha bure cha 4K.",
  hero_h1_b: "Bila vidakuzi. Bila kuingia. Bila vikao vilivyovunjika.",
  hero_tagline:
    "Arroxy ni kipakuliaji cha YouTube cha desktop, bure, chenye leseni ya MIT kwa Windows, macOS, na Linux. Inapakua video hadi 4K HDR kwa 60 fps — bila kuomba akaunti ya Google, vidakuzi vya kivinjari, au kuingia yoyote.",
  hero_trust: "Kagua kila mstari kwenye GitHub.",
  pill_no_account: "Hakuna akaunti ya Google",
  pill_no_tracking: "Bila ufuatiliaji",
  pill_open_source: "Open source (MIT)",
  cta_download_os: "Pakua kwa mfumo wako",
  cta_view_github: "Tazama kwenye GitHub",
  release_label: "Toleo jipya zaidi:",
  release_loading: "inapakia…",

  cta_download_windows: "Pakua kwa Windows",
  cta_download_windows_portable: "Portable .exe (hakuna usakinishaji)",
  cta_download_mac_arm: "Pakua kwa macOS (Apple Silicon)",
  cta_download_mac_intel: "Mac ya Intel? Pata DMG x64",
  cta_download_linux_appimage: "Pakua kwa Linux (.AppImage)",
  cta_download_linux_flatpak: "Kifurushi cha Flatpak →",
  cta_other_platforms: "Majukwaa mengine / Vipakuliaji vyote",
  cta_os_windows: "Windows",
  cta_os_mac: "macOS",
  cta_os_linux: "Linux",
  cta_installer_label: "Kisakinishi",
  cta_portable_label: "Portable",
  cta_arm_label: "Apple Silicon",
  cta_intel_label: "Intel",
  mobile_notice: "Arroxy ni programu ya kompyuta kwa Windows, macOS, na Linux.",
  mobile_notice_sub: "Tembelea ukurasa huu kwenye kompyuta yako kupakua.",
  mobile_copy_link: "Nakili kiungo cha ukurasa",
  first_launch_label: "Msaada wa uzinduzi wa kwanza",
  first_launch_windows_html:
    "Windows SmartScreen inaweza kuonyesha <em>\"Windows protected your PC\"</em> au <em>\"Unknown publisher\"</em> wakati wa uzinduzi wa kwanza — Arroxy ni bure na chanzo wazi, na ujenzi wa Windows haujasainiwa kwa cheti cha malipo. Hii inatumika kwa <code>Arroxy-Setup-*.exe</code> na <code>Arroxy-Portable-*.exe</code> na <strong>haimaanishi</strong> kwamba Arroxy si salama. Bonyeza <strong>More info</strong>, kisha <strong>Run anyway</strong>. Pakua Arroxy tu kutoka ukurasa rasmi wa GitHub Releases — msimbo wa chanzo ni wa umma, hivyo unaweza kuukagua au kuujenga mwenyewe.",
  first_launch_mac_html:
    "macOS inaonyesha onyo la <em>msanidi asiyejulikana</em> wakati wa uzinduzi wa kwanza — Arroxy bado haijakosainiwa na msimbo. <strong>Bonyeza kulia ikoni ya programu → Fungua</strong>, kisha bonyeza <strong>Fungua</strong> kwenye kisanduku cha mazungumzo. Inahitajika mara moja tu.",
  first_launch_linux_html:
    "<strong>AppImage:</strong> bonyeza kulia faili → <strong>Mali → Ruhusu kutekeleza kama programu</strong>, au tekeleza <code>chmod +x Arroxy-*.AppImage</code> kwenye terminal. Ikiwa uzinduzi unashindwa, sakinisha <code>libfuse2</code> (Ubuntu/Debian), <code>fuse-libs</code> (Fedora), au <code>fuse2</code> (Arch).<br><br><strong>Flatpak:</strong> <code>flatpak install --user Arroxy-*.flatpak</code>, kisha uzindua kutoka menyu ya programu au tekeleza <code>flatpak run io.github.antonio_orionus.Arroxy</code>.",

  features_eyebrow: "Inachofanya",
  features_h2: "Kila unachotegemea, bila ugumu wowote.",
  features_sub: "Bandika URL, chagua ubora, bonyeza pakua. Hiyo tu.",
  f1_h: "Hadi 4K UHD",
  f1_p: "2160p, 1440p, 1080p, 720p — kila mwonekano ambao YouTube inatoa, pamoja na ubadilishaji wa sauti pekee kuwa MP3, M4A/AAC, Opus na WAV.",
  f2_h: "60 fps & HDR imehifadhiwa",
  f2_p: "Mtiririko wa kasi ya fremu nyingi na HDR unakuja hasa kama YouTube inavyousimba — bila kupoteza ubora.",
  f3_h: "Playlist pia",
  f3_p: "Bandika URL ya playlist, pakua orodha yote, au tiki video unazotaka tu kabla Arroxy haijaziweka kwenye foleni.",
  f4_h: "Masasisho ya kiotomatiki",
  f4_p: "Arroxy inaweka yt-dlp na ffmpeg safi chini ya kofia — inafanya kazi kupitia kila mabadiliko ya YouTube.",
  f5_h: "Lugha 21",
  f5_p: "English, Español, Deutsch, Français, 日本語, 中文, Русский, Українська, हिन्दी, Afaan Oromoo, Kiswahili, O'zbekcha, Tiếng Việt, አማርኛ, العربية, اردو, پښتو, বাংলা, မြန်မာဘာသာ, Ελληνικά, Српски — hugundua yako kiotomatiki.",
  f6_h: "Majukwaa mengi",
  f6_p: "Miundo asilia kwa Windows, macOS, na Linux — kisakinishi, portable, DMG, au AppImage.",
  f7_h: "Manukuu, kwa njia yako",
  f7_p: "Manukuu ya mkono au yanayozalishwa kiotomatiki katika SRT, VTT, au ASS — yaliyohifadhiwa karibu na video, yamejumuishwa kwenye .mkv inayobebeka, au yamewekwa kwenye folda ya Subtitles/.",
  f8_h: "SponsorBlock imejumuishwa",
  f8_p: "Ruka au alama sehemu za wadhamini, utangulizi, hitimisho, matangazo ya kibinafsi, na zaidi — zikata na FFmpeg au ongeza tu sura. Uamuzi wako, kwa kila kategoria.",
  f9_h: "Kujaza kiotomatiki kutoka klipu bodi",
  f9_p: "Nakili kiungo cha YouTube popote na Arroxy hugundua unapobadili tena — kidokezo cha uthibitisho kinakuweka udhibitini. Washa au zima katika mipangilio ya Hali ya Juu.",
  f10_h: "Usafi wa URL kiotomatiki",
  f10_p: "Vigezo vya ufuatiliaji (si, pp, feature, utm_*, fbclid, gclid, na zaidi) huondolewa kiotomatiki kutoka viungo vya YouTube vilivyobandiikwa, na vifuniko vya youtube.com/redirect hufunuliwa — sehemu ya URL daima inaonyesha kiungo rasmi.",
  f11_h: "Hujificha kwenye trei",
  f11_p: "Kufunga dirisha kunaweka Arroxy kwenye trei ya mfumo wako. Vipakuliaji vinaendelea kufanya kazi nyuma — bonyeza ikoni ya trei kulirejesha dirisha, au toka kutoka menyu ya trei.",
  f12_h: "Metadata na sanaa zilizojumuishwa",
  f12_p: "Jina, tarehe ya kupakiwa, msanii, maelezo, sanaa ya jalada, na alama za sura zimeandikwa moja kwa moja kwenye faili — hakuna faili za pembeni, hakuna uwekaji lebo wa mkono.",

  shots_eyebrow: "Ione ikifanya kazi",
  shots_h2: "Imejengwa kwa uwazi, si msongamano.",
  shot1_alt: "Bandika URL",
  shot2_alt: "Chagua ubora wako",
  shot3_alt: "Chagua mahali pa kuhifadhi",
  shot4_alt: "Vipakuliaji vya sambamba",
  shot5_alt: "Hatua ya manukuu — chagua lugha, muundo, na hali ya kuhifadhi",
  og_image_alt: "Ikoni ya programu ya Arroxy — programu ya kompyuta ya kupakua video za YouTube kwa 4K.",

  privacy_eyebrow: "Faragha",
  privacy_h2_html: "Arroxy <em>haifanyi</em> nini.",
  privacy_sub:
    "Vipakuliaji vingi vya YouTube hatimaye huomba vidakuzi vyako. Arroxy haitafanya hivyo kamwe.",
  p1_h: "Bila kuingia",
  p1_p: "Hakuna akaunti ya Google. Hakuna vikao vya kuisha muda. Hatari sifuri ya akaunti yako kupigwa bendera.",
  p2_h: "Bila vidakuzi",
  p2_p: "Arroxy inaomba alama sawa na kivinjari chochote. Hakuna kinachosafirishwa, hakuna kinachohifadhiwa.",
  p3_h: "Hakuna vitambulisho vya mtumiaji",
  p3_p: "Telemetry isiyo na jina kupitia TelemetryDeck — kitambulisho chako cha usanidi hufishwa kabla ya kuacha programu, hakuna uchapaji wa alama, hakuna data ya kibinafsi. Vipakuliaji vyako, historia, na faili hazitoki kamwe kwenye kifaa chako.",
  p4_h: "Bila seva za tatu",
  p4_p: "Mchakato wote unafanya kazi ndani ya mfumo kupitia yt-dlp + ffmpeg. Faili kamwe hazigusi seva ya mbali.",

  install_eyebrow: "Sakinisha",
  install_h2: "Chagua njia yako.",
  install_sub:
    "Pakua moja kwa moja au msimamizi wowote mkubwa wa vifurushi — vyote vinasasishwa kiotomatiki kwa kila toleo.",
  badge_windows: "Windows",
  badge_macos: "macOS",
  badge_linux: "Linux",
  badge_all: "Yote",
  winget_desc: "Inapendekezwa kwa Windows 10/11. Inasasishwa pamoja na mfumo.",
  scoop_desc: "Usakinishaji wa portable kupitia Scoop bucket. Hakuna haki za msimamizi zinazohitajika.",
  brew_desc: "Gonga cask, sakinisha kwa amri moja. Faili la ulimwengu wote (Intel + Apple Silicon).",
  flatpak_h: "Flatpak",
  flatpak_desc: "Usakinishaji wa sanduku. Pakua kifurushi cha .flatpak kutoka Releases, sakinisha kwa amri moja. Hakuna usanidi wa Flathub unaohitajika.",
  direct_h: "Pakua moja kwa moja",
  direct_desc: "Kisakinishi cha NSIS, .exe portable, .dmg, .AppImage, au .flatpak — moja kwa moja kutoka GitHub Releases.",
  direct_btn: "Fungua Releases →",
  copy_label: "Nakili",
  copied_label: "Imenakiliwa!",

  footer_made_by: "Leseni ya MIT · Imetengenezwa kwa upendo na",
  footer_github: "GitHub",
  footer_issues: "Matatizo",
  footer_releases: "Matoleo",
  footer_languages_label: "Lugha:",

  faq_eyebrow: "Maswali",
  faq_h2: "Maswali yanayoulizwa mara kwa mara",
  faq_q1: "Ni ubora gani wa video ninaweza kupakua?",
  faq_a1:
    "Kila kitu ambacho YouTube inatoa — 4K UHD (2160p), 1440p QHD, 1080p Full HD, 720p, 480p, 360p na sauti pekee. Mitiririko ya fremu nyingi (60 fps, 120 fps) na maudhui ya HDR huhifadhiwa kama yalivyo. Arroxy hukuonyesha kila fomati inayopatikana, pamoja na ubadilishaji wa MP3, M4A/AAC, Opus na WAV kwa upakuaji wa sauti pekee.",
  faq_q2: "Je, ni bure kweli kweli?",
  faq_a2: "Ndiyo. Leseni ya MIT. Hakuna ngazi ya malipo, hakuna kizuizi cha vipengele.",
  faq_q3: "Arroxy inapatikana katika lugha zipi?",
  faq_a3:
    "Ishirini na moja, kutoka mwanzoni: English, Español (Kihispania), Deutsch (Kijerumani), Français (Kifaransa), 日本語 (Kijapani), 中文 (Kichina), Русский (Kirusi), Українська (Kiukraini), हिन्दी (Kihindi), Afaan Oromoo, Kiswahili, O'zbekcha (Kiuzbeki), Tiếng Việt (Kivietinamu), አማርኛ (Kiamhara), العربية (Kiarabu), اردو (Kiurdu), پښتو (Kipashto), বাংলা (Kibengali), မြန်မာဘာသာ (Kiburma), Ελληνικά (Kigiriki), na Српски (Kiserbia). Arroxy hugundua lugha ya mfumo wako wa uendeshaji wakati wa uzinduzi wa kwanza na unaweza kubadili wakati wowote kutoka kichaguo cha lugha kwenye upau wa zana. Tafsiri zinaishi kama vitu vya TypeScript vya kawaida katika src/shared/i18n/locales/ — fungua PR kwenye GitHub kuchangia.",
  faq_q4: "Je, ninahitaji kusakinisha chochote?",
  faq_a4:
    "Hapana. yt-dlp na ffmpeg zinapakuliwa kiotomatiki wakati wa uzinduzi wa kwanza kutoka matoleo yao rasmi ya GitHub na kuhifadhiwa kwenye kompyuta yako. Baada ya hapo, hakuna usanidi wa ziada unaohitajika.",
  faq_q5: "Je, itaendelea kufanya kazi ikiwa YouTube itabadilisha kitu?",
  faq_a5:
    "Ndiyo — na Arroxy ina tabaka mbili za ustahimilivu. Kwanza, yt-dlp ni moja ya zana za chanzo huria zinazodumishwa zaidi — inasasishwa ndani ya masaa ya mabadiliko ya YouTube. Pili, Arroxy haiitegemei vidakuzi wala akaunti yako ya Google kamwe, kwa hivyo hakuna kikao cha kuisha muda wala vitambulisho vya kubadilisha. Mchanganyiko huo unaifanya iwe thabiti zaidi kuliko zana zinazotegemea vidakuzi vya kivinjari vilivyosafirishwa.",
  faq_q6: "Je, ninaweza kupakua orodha za kucheza?",
  faq_a6:
    "Ndiyo. Bandika URL ya playlist, chagua video zote au zile tu unazotaka, na Arroxy itaziweka kwenye foleni kama kundi moja. Upakuaji wa kundi wa channel nzima bado haujaungwa mkono.",
  faq_q7: "Je, inahitaji akaunti yangu ya YouTube au vidakuzi?",
  faq_a7:
    "Hapana — na hiyo ni jambo kubwa zaidi kuliko inavyosikika. Zana nyingi zinazoacha kufanya kazi baada ya sasisho la YouTube zinakuambia kusafirisha vidakuzi vya YouTube vya kivinjari chako. Suluhisho hilo huvunjika kila dakika ~30 YouTube inapobadilisha vikao, na hati za yt-dlp zenyewe zinaonyan kuwa zinaweza kupiga bendera akaunti yako ya Google. Arroxy kamwe haitumii vidakuzi wala vitambulisho. Bila kuingia. Bila akaunti iliyounganishwa. Hakuna kinachokwisha muda, hakuna kinachopigwa marufuku.",
  faq_q8:
    'macOS inasema "programu imeharibiwa" au "haiwezi kufunguliwa" — nifanye nini?',
  faq_a8:
    "Hii ni macOS Gatekeeper inazuia programu isiyosainiwa — si uharibifu halisi. README ina maelekezo hatua kwa hatua ya uzinduzi wa kwanza kwenye macOS.",
  faq_q9: "Je, hii ni halali?",
  faq_a9:
    "Kupakua video kwa matumizi ya kibinafsi kwa ujumla kunakubaliwa katika maeneo mengi ya kisheria. Wewe ndiye unayewajibika kuzingatia Masharti ya Huduma ya YouTube na sheria za nchi yako.",
};
