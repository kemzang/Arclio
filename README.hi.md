<div align="center">
  <img src="src/renderer/src/assets/App-icon-HQ.png" alt="Arroxy मस्कट" width="180" />

# Arroxy — Windows, macOS और Linux के लिए मुफ़्त ओपन-सोर्स YouTube डाउनलोडर

**4K · 1080p60 · HDR · Playlists · MP3 · Shorts · Subtitles · SponsorBlock**

**भाषा:** [Afaan Oromoo](README.om.md) · [Deutsch](README.de.md) · [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Kiswahili](README.sw.md) · [O'zbekcha](README.uz.md) · [Tiếng Việt](README.vi.md) · [አማርኛ](README.am.md) · [العربية](README.ar.md) · [اردو](README.ur.md) · [پښتو](README.ps.md) · [বাংলা](README.bn.md) · **हिन्दी** · [မြန်မာဘာသာ](README.my.md) · [Ελληνικά](README.el.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Українська](README.uk.md) · [中文](README.zh.md) · [日本語](README.ja.md)

[![रिलीज़](https://img.shields.io/github/v/release/antonio-orionus/Arroxy?label=Release&color=blueviolet)](https://github.com/antonio-orionus/Arroxy/releases/latest) [![बिल्ड](https://img.shields.io/github/actions/workflow/status/antonio-orionus/Arroxy/release.yml?label=Build)](https://github.com/antonio-orionus/Arroxy/actions/workflows/release.yml) [![वेबसाइट](https://img.shields.io/badge/website-arroxy.orionus.dev-blueviolet)](https://arroxy.orionus.dev/) ![लाइसेंस](https://img.shields.io/badge/license-MIT-green) ![प्लेटफ़ॉर्म](https://img.shields.io/badge/platform-cross--platform-1f2937?logo=github&logoColor=white) ![भाषाएँ](https://img.shields.io/badge/i18n-21_languages-blue)

कोई भी YouTube वीडियो, Short या ऑडियो ट्रैक मूल क्वालिटी में डाउनलोड करें — 60 fps पर 4K HDR तक, या MP3 / AAC / Opus के रूप में। Windows, macOS और Linux पर लोकल रन होता है। **कोई विज्ञापन नहीं, कोई लॉगिन नहीं, कोई ब्राउज़र कुकीज़ नहीं, कोई Google अकाउंट लिंक नहीं।**

[**↓ नवीनतम रिलीज़ डाउनलोड करें**](../../releases/latest) &nbsp;·&nbsp; [**वेबसाइट**](https://arroxy.orionus.dev/) &nbsp;·&nbsp; [Windows](#download) · [macOS](#download) · [Linux](#download)

<img src="build/demo.gif" alt="Arroxy डेमो" width="720" />

अगर Arroxy आपका समय बचाता है, तो ⭐ दूसरों को इसे खोजने में मदद करती है।

</div>

> 🌐 यह AI-सहायता प्राप्त अनुवाद है। [अंग्रेज़ी README](README.md) सत्य का स्रोत है। कोई गलती दिखी? [PR का स्वागत है](../../pulls)।

---

## विषय-सूची

- [Arroxy क्यों?](#why)
- [कोई कुकीज़ नहीं, कोई लॉगिन नहीं, कोई अकाउंट लिंक नहीं](#no-cookies)
- [फ़ीचर](#features)
- [डाउनलोड](#download)
- [प्राइवेसी](#privacy)
- [अक्सर पूछे जाने वाले प्रश्न](#faq)
- [रोडमैप](#roadmap)
- [बनाया गया](#tech)

---

## <a id="why"></a>Arroxy क्यों?

सबसे आम विकल्पों के साथ एक साथ-साथ तुलना:

|            | Arroxy | 4K Video Downloader | JDownloader | Y2Mate / online converters | Browser extensions |
| ---------- | :----: | :-----------------: | :---------: | :------------------------: | :----------------: |
| मुफ़्त, कोई प्रीमियम टियर नहीं |   ✅   |         ⚠️          |     ✅      |             ⚠️             |         ⚠️         |
| ओपन सोर्स |   ✅   |         ❌          |     ❌      |             ❌             |         ⚠️         |
| केवल लोकल प्रोसेसिंग |   ✅   |         ✅          |     ✅      |             ❌             |         ✅         |
| कोई लॉगिन या कुकी एक्सपोर्ट नहीं |   ✅   |         ⚠️          |     ⚠️      |             ⚠️             |         ✅         |
| कोई उपयोग सीमा नहीं |   ✅   |         ⚠️          |     ✅      |             🚫             |         ⚠️         |
| क्रॉस-प्लेटफ़ॉर्म डेस्कटॉप ऐप |   ✅   |         ✅          |     ✅      |            N/A             |         ❌         |
| सबटाइटल + SponsorBlock |   ✅   |         ⚠️          |     ❌      |             ❌             |         ❌         |

Arroxy एक काम के लिए बना है: URL पेस्ट करें, एक साफ़ लोकल फ़ाइल पाएँ। कोई अकाउंट नहीं, कोई अपसेल नहीं, कोई डेटा कलेक्शन नहीं।

---

## <a id="no-cookies"></a>कोई कुकीज़ नहीं, कोई लॉगिन नहीं, कोई अकाउंट लिंक नहीं

यही सबसे आम कारण है कि डेस्कटॉप YouTube डाउनलोडर टूट जाते हैं — और मुख्य कारण कि Arroxy मौजूद है।

जब YouTube अपना बॉट डिटेक्शन अपडेट करता है, तो ज़्यादातर टूल आपको वर्कअराउंड के रूप में अपने ब्राउज़र की YouTube कुकीज़ एक्सपोर्ट करने को कहते हैं। इसमें दो समस्याएँ हैं:

1. एक्सपोर्ट किए गए सेशन आमतौर पर ~30 मिनट में एक्सपायर हो जाते हैं, इसलिए आपको बार-बार एक्सपोर्ट करना पड़ता है।
2. yt-dlp की अपनी डॉक्यूमेंटेशन [चेतावनी देती है कि कुकी-आधारित ऑटोमेशन आपके Google अकाउंट को फ़्लैग कर सकता है](https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies)।

**Arroxy कभी कुकीज़, लॉगिन या कोई क्रेडेंशियल नहीं माँगता।** यह केवल वही पब्लिक टोकन इस्तेमाल करता है जो YouTube किसी भी ब्राउज़र को देता है। आपकी Google पहचान से कुछ भी नहीं जुड़ा, कुछ एक्सपायर नहीं होता, कुछ रोटेट नहीं करना।

---

## <a id="features"></a>फ़ीचर

### क्वालिटी और फ़ॉर्मैट

- **4K UHD (2160p)** तक, 1440p, 1080p, 720p, 480p, 360p
- **हाई फ़्रेम रेट** जैसा है वैसा — 60 fps, 120 fps, HDR
- **सिर्फ ऑडियो** को MP3, M4A/AAC, Opus या WAV में एक्सपोर्ट करें
- त्वरित प्रीसेट: *बेस्ट क्वालिटी* · *बैलेंस्ड* · *स्मॉल फ़ाइल*

### प्राइवेसी और नियंत्रण

- 100% लोकल प्रोसेसिंग — डाउनलोड सीधे YouTube से आपकी डिस्क पर
- कोई लॉगिन नहीं, कोई कुकीज़ नहीं, कोई Google अकाउंट लिंक नहीं
- फ़ाइलें सीधे आपके चुने हुए फ़ोल्डर में सेव

### वर्कफ़्लो

- **कोई भी YouTube URL पेस्ट करें** — वीडियो, Shorts और playlists सपोर्टेड हैं; पूरी playlist डाउनलोड करें या पहले चुने हुए वीडियो चुनें
- **मल्टी-डाउनलोड क़तार** — कई डाउनलोड एक साथ ट्रैक करें
- **क्लिपबोर्ड वॉच** — YouTube लिंक कॉपी करें और ऐप पर वापस आते ही Arroxy URL अपने आप भर देता है (एडवांस्ड सेटिंग्स में टॉगल करें)
- **ऑटो-क्लीन URLs** — ट्रैकिंग पैरामीटर (`si`, `pp`, `utm_*`, `fbclid`, `gclid`) हटाता है और `youtube.com/redirect` लिंक खोलता है
- **ट्रे मोड** — विंडो बंद करने पर डाउनलोड बैकग्राउंड में चलते रहते हैं
- **21 भाषाएँ** — सिस्टम लोकेल अपने आप पहचानता है, कभी भी बदला जा सकता है

### सबटाइटल और पोस्ट-प्रोसेसिंग

- **सबटाइटल** SRT, VTT या ASS में — मैनुअल या ऑटो-जेनरेटेड, किसी भी उपलब्ध भाषा में
- वीडियो के बग़ल में सेव करें, `.mkv` में एम्बेड करें, या `Subtitles/` सबफ़ोल्डर में व्यवस्थित करें
- **SponsorBlock** — स्पॉन्सर, इंट्रो, आउट्रो, सेल्फ-प्रोमो को स्किप या चैप्टर-मार्क करें
- **एम्बेडेड मेटाडेटा** — टाइटल, अपलोड तिथि, चैनल, विवरण, थंबनेल और चैप्टर मार्कर फ़ाइल में लिखे जाते हैं

<div align="center">
  <img src="build/Main-screenshot.png" width="48%" alt="URL पेस्ट करें" />
  <img src="build/Choosing-format-screenshot.png" width="48%" alt="क्वालिटी चुनें" />
  <br/>
  <img src="build/Choosing-destination-screenshot.png" width="48%" alt="सेव लोकेशन चुनें" />
  <img src="build/Downloading-in-parallel-screenshot.png" width="48%" alt="डाउनलोड क़तार चलती हुई" />
  <br/>
  <img src="build/Subtitles-screenshot.png" width="48%" alt="सबटाइटल भाषा और फ़ॉर्मैट चुनें" />
</div>

---

## <a id="download"></a>डाउनलोड

| प्लेटफ़ॉर्म | फ़ॉर्मैट   |
| ------------------- | ------------------- |
| Windows             | इंस्टॉलर (NSIS) या पोर्टेबल `.exe`   |
| macOS               | `.dmg` (Intel + Apple Silicon)   |
| Linux               | `.AppImage` या `.flatpak` (sandboxed) |

[**नवीनतम रिलीज़ लें →**](../../releases/latest)

### पैकेज मैनेजर से इंस्टॉल करें

| चैनल | कमांड                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| Winget             | `winget install AntonioOrionus.Arroxy`                                                            |
| Scoop              | `scoop bucket add arroxy https://github.com/antonio-orionus/scoop-bucket && scoop install arroxy` |
| Homebrew           | `brew tap antonio-orionus/arroxy && brew install --cask arroxy`                                   |

<details>
<summary><strong>Windows: इंस्टॉलर बनाम पोर्टेबल</strong></summary>

|               | NSIS इंस्टॉलर | पोर्टेबल `.exe` |
| ------------- | :----------------------: | :---------------------: |
| इंस्टॉलेशन ज़रूरी | हाँ  | नहीं — कहीं से भी चलाएँ  |
| ऑटो-अपडेट | ✅ ऐप में  | ❌ मैन्युअल डाउनलोड  |
| स्टार्टअप स्पीड | ✅ तेज़  | ⚠️ कोल्ड स्टार्ट धीमा  |
| स्टार्ट मेन्यू में जुड़ता है |            ✅            |           ❌            |
| आसान अनइंस्टॉल |            ✅            | ❌ बस फ़ाइल डिलीट कर दें  |

**सिफ़ारिश:** ऑटो-अपडेट और तेज़ स्टार्टअप के लिए NSIS इंस्टॉलर इस्तेमाल करें। बिना इंस्टॉल और बिना रजिस्ट्री विकल्प के लिए पोर्टेबल `.exe` लें।

**Windows SmartScreen चेतावनी**

पहले लॉन्च पर आप **"Windows protected your PC"** या **"Unknown publisher."** देख सकते हैं। यह `Arroxy-Setup-*.exe` और `Arroxy-Portable-*.exe` दोनों पर लागू होता है। Arroxy मुफ़्त और ओपन-सोर्स है और Windows बिल्ड पेड सर्टिफ़िकेट से कोड-साइन नहीं हैं, इसीलिए SmartScreen फ़्लैग करता है। इसका **अपने आप** यह मतलब नहीं कि Arroxy असुरक्षित है। जारी रखने के लिए:

1. **More info** क्लिक करें।
2. **Run anyway** क्लिक करें।

> Arroxy केवल आधिकारिक GitHub Releases पेज से डाउनलोड करें। अगर फ़ाइल किसी दूसरी वेबसाइट से मिली हो या किसी ने भेजी हो, तो उसे डिलीट करें और आधिकारिक स्रोत से नई कॉपी डाउनलोड करें। सोर्स कोड सार्वजनिक है, इसलिए आप चाहें तो ख़ुद जाँच सकते हैं या Arroxy ख़ुद बना सकते हैं।

</details>

<details>
<summary><strong>macOS पर पहली बार लॉन्च</strong></summary>

Arroxy अभी कोड-साइन्ड नहीं है, इसलिए पहले लॉन्च पर macOS Gatekeeper चेतावनी देगा। यह अपेक्षित है — यह नुकसान का संकेत नहीं है।

**सिस्टम सेटिंग्स तरीक़ा (अनुशंसित):**

1. Arroxy ऐप आइकॉन पर राइट-क्लिक करें और **Open** चुनें।
2. चेतावनी डायलॉग आएगा — **Cancel** क्लिक करें (*Move to Trash* न क्लिक करें)।
3. **System Settings → Privacy & Security** खोलें।
4. **Security** सेक्शन तक स्क्रॉल करें। दिखेगा *"Arroxy was blocked from use because it is not from an identified developer."*
5. **Open Anyway** क्लिक करें और पासवर्ड या Touch ID से कन्फ़र्म करें।

क़दम 5 के बाद Arroxy सामान्य रूप से खुलेगा और चेतावनी फिर कभी नहीं आएगी।

**टर्मिनल तरीक़ा (एडवांस्ड):**

```bash
xattr -dr com.apple.quarantine /Applications/Arroxy.app
```

> macOS बिल्ड CI पर Apple Silicon और Intel रनर्स पर बनाए जाते हैं। अगर कोई समस्या आए, तो [issue खोलें](../../issues) — macOS यूज़र्स का फ़ीडबैक macOS टेस्टिंग साइकिल को सक्रिय रूप से आकार देता है।

</details>

<details>
<summary><strong>Linux पर पहली बार लॉन्च</strong></summary>

AppImage सीधे चलते हैं — कोई इंस्टॉलेशन नहीं। बस फ़ाइल को एक्ज़ीक्यूटेबल मार्क करना होता है।

**फ़ाइल मैनेजर:** `.AppImage` पर राइट-क्लिक → **Properties** → **Permissions** → **Allow executing file as program** ऑन करें, फिर डबल-क्लिक से चलाएँ।

**टर्मिनल:**

```bash
chmod +x Arroxy-*.AppImage
./Arroxy-*.AppImage
```

अगर फिर भी नहीं चलता, शायद FUSE नहीं है:

```bash
# Ubuntu / Debian
sudo apt install -y libfuse2

# Fedora
sudo dnf install -y fuse-libs

# Arch
sudo pacman -S fuse2
```

**Flatpak (सैंडबॉक्स विकल्प):** उसी रिलीज़ पेज से `Arroxy-*.flatpak` डाउनलोड करें।

```bash
flatpak install --user Arroxy-*.flatpak
flatpak run io.github.antonio_orionus.Arroxy
```

</details>

---

## <a id="privacy"></a>प्राइवेसी

डाउनलोड सीधे [yt-dlp](https://github.com/yt-dlp/yt-dlp) के ज़रिए YouTube से आपके चुने हुए फ़ोल्डर में फ़ेच होते हैं — किसी थर्ड-पार्टी सर्वर से नहीं गुज़रते। देखने की हिस्ट्री, डाउनलोड हिस्ट्री, URLs और फ़ाइल कंटेंट आपके डिवाइस पर रहते हैं।

Arroxy [OpenPanel](https://openpanel.dev) के ज़रिए गुमनाम, एग्रीगेट टेलीमेट्री भेजता है — लॉन्च, OS, ऐप वर्शन और क्रैश समझने भर के लिए। कोई URL, वीडियो शीर्षक, फ़ाइल पाथ, अकाउंट जानकारी, फ़िंगरप्रिंटिंग या निजी डेटा नहीं। प्रति-इंस्टॉल ID रैंडम होती है और आपकी पहचान से जुड़ी नहीं होती। Settings में ऑप्ट आउट कर सकते हैं।

---

## <a id="faq"></a>अक्सर पूछे जाने वाले प्रश्न

**क्या यह सच में मुफ़्त है?**
हाँ — MIT लाइसेंस, कोई प्रीमियम टियर नहीं, कोई फ़ीचर गेटिंग नहीं।

**मैं किन वीडियो क्वालिटी में डाउनलोड कर सकता हूँ?**
जो भी YouTube देता है: 4K UHD (2160p), 1440p, 1080p, 720p, 480p, 360p, और ऑडियो-only। 60 fps, 120 fps और HDR स्ट्रीम जैसे हैं वैसे ही रहते हैं।

**क्या मैं सिर्फ़ ऑडियो MP3 में निकाल सकता हूँ?**
हाँ। format menu में *सिर्फ ऑडियो* चुनें और फिर MP3, M4A/AAC, Opus या WAV चुनें।

**क्या मुझे YouTube अकाउंट या कुकीज़ चाहिए?**
नहीं। Arroxy केवल वही पब्लिक टोकन इस्तेमाल करता है जो YouTube किसी भी ब्राउज़र को देता है। कोई कुकीज़ नहीं, कोई लॉगिन नहीं, कोई क्रेडेंशियल स्टोर नहीं। [कोई कुकीज़ नहीं, कोई लॉगिन नहीं, कोई अकाउंट लिंक नहीं](#no-cookies) देखें कि यह क्यों मायने रखता है।

**जब YouTube कुछ बदले तो क्या यह काम करता रहेगा?**
रिज़िलियेंस की दो परतें हैं: yt-dlp YouTube के बदलावों के घंटों के भीतर अपडेट होता है, और Arroxy उन कुकीज़ पर निर्भर नहीं है जो हर ~30 मिनट में एक्सपायर होती हैं। यह इसे ब्राउज़र सेशन एक्सपोर्ट पर निर्भर टूल्स से काफ़ी ज़्यादा स्थिर बनाता है।

**Arroxy किन भाषाओं में उपलब्ध है?**
इक्कीस, बॉक्स से बाहर: English, Español (स्पेनिश), Deutsch (जर्मन), Français (फ़्रेंच), 日本語 (जापानी), 中文 (चीनी), Русский (रूसी), Українська (यूक्रेनी), हिन्दी, Afaan Oromoo (ओरोमो), Kiswahili (स्वाहिली), O'zbekcha (उज़्बेक), Tiếng Việt (वियतनामी), አማርኛ (अम्हारिक), العربية (अरबी), اردو (उर्दू), پښتو (पश्तो), বাংলা (बंगाली), မြန်မာဘာသာ (बर्मी), Ελληνικά (यूनानी) और Српски (सर्बियाई)। Arroxy पहले लॉन्च पर आपके ऑपरेटिंग सिस्टम की भाषा अपने आप पहचानता है, और आप टूलबार में भाषा चुनने वाले से कभी भी बदल सकते हैं। लोकेल फ़ाइलें src/shared/i18n/locales/ में सादे TypeScript ऑब्जेक्ट्स हैं — योगदान के लिए GitHub पर एक PR खोलें।

**क्या मुझे कुछ और इंस्टॉल करना होगा?**
नहीं। yt-dlp पहले लॉन्च पर अपने आप डाउनलोड होकर आपकी मशीन पर कैश हो जाता है; ffmpeg और ffprobe ऐप के साथ आते हैं। उसके बाद कोई अतिरिक्त सेटअप ज़रूरी नहीं।

**क्या मैं प्लेलिस्ट या पूरे चैनल डाउनलोड कर सकता हूँ?**
हाँ, playlists के लिए: playlist URL पेस्ट करें, फिर पूरी सूची या सिर्फ चुने हुए वीडियो queue करें. पूरे channel की batch downloads अभी supported नहीं हैं.

**macOS कहता है "ऐप ख़राब है" — क्या करूँ?**
यह macOS Gatekeeper बिना साइन की हुई ऐप को ब्लॉक कर रहा है, असली नुकसान नहीं है। फ़िक्स के लिए [macOS पर पहली बार लॉन्च](#download) सेक्शन देखें।

**क्या YouTube वीडियो डाउनलोड करना क़ानूनी है?**
ज़्यादातर अधिकार-क्षेत्रों में पर्सनल, प्राइवेट इस्तेमाल के लिए यह आम तौर पर स्वीकार्य है। YouTube की [Terms of Service](https://www.youtube.com/t/terms) और अपने स्थानीय कॉपीराइट क़ानूनों का पालन करना आपकी ज़िम्मेदारी है।

---

## <a id="roadmap"></a>रोडमैप

आने वाले — लगभग प्राथमिकता के क्रम में:

| फ़ीचर    | विवरण    |
| ---------------- | ---------------- |
| **बैच URL इनपुट** | एक साथ कई URLs पेस्ट करें और सब एक झटके में चलाएँ |
| **कस्टम फ़ाइल नाम टेम्पलेट** | टाइटल, अपलोडर, तारीख़, रेज़ोल्यूशन से फ़ाइलें नाम दें — लाइव प्रीव्यू के साथ |
| **शेड्यूल्ड डाउनलोड** | निर्धारित समय पर क़तार शुरू करें (रात भर के रन) |
| **स्पीड लिमिट** | बैंडविड्थ कैप करें ताकि डाउनलोड कनेक्शन न भर दे |
| **क्लिप ट्रिमिंग** | शुरू/अंत समय से सिर्फ़ एक सेगमेंट डाउनलोड करें |

कोई फ़ीचर मन में है? [रिक्वेस्ट खोलें](../../issues) — कम्यूनिटी की राय प्राथमिकता तय करती है।

---

## <a id="tech"></a>बनाया गया

<details>
<summary><strong>Stack</strong></summary>

- **Electron** — क्रॉस-प्लेटफ़ॉर्म डेस्कटॉप शेल
- **React 19** + **TypeScript** — UI
- **Tailwind CSS v4** — स्टाइलिंग
- **Zustand** — स्टेट मैनेजमेंट
- **yt-dlp** + **ffmpeg** — डाउनलोड और मक्स इंजन (yt-dlp रनटाइम पर फ़ेच होता है; ffmpeg/ffprobe बिल्ड समय पर बंडल होते हैं)
- **Vite** + **electron-vite** — बिल्ड टूलिंग
- **Vitest** + **Playwright** — यूनिट और एंड-टू-एंड टेस्ट

</details>

<details>
<summary><strong>सोर्स से बिल्ड करें</strong></summary>

### सभी प्लेटफ़ॉर्म के लिए आवश्यकताएँ

| टूल | वर्शन   | इंस्टॉल |
| ---- | ------- | ------- |
| Git  | कोई भी  | [git-scm.com](https://git-scm.com) |
| Bun  | नवीनतम  | नीचे OS-वार देखें |

### Windows

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

कोई नेटिव बिल्ड टूल ज़रूरी नहीं — प्रोजेक्ट में कोई नेटिव Node addon नहीं है।

### macOS

```bash
xcode-select --install
curl -fsSL https://bun.sh/install | bash
```

### Linux (Ubuntu / Debian)

```bash
curl -fsSL https://bun.sh/install | bash

# Electron रनटाइम डिपेंडेंसी
sudo apt install -y libgtk-3-0 libnss3 libasound2t64

# E2E टेस्ट के लिए ही (Electron को डिस्प्ले चाहिए)
sudo apt install -y xvfb
```

### क्लोन करें और चलाएँ

```bash
git clone https://github.com/antonio-orionus/Arroxy
cd arroxy
bun install
bun run dev          # हॉट-रीलोड देव बिल्ड
```

### डिस्ट्रीब्यूटेबल बिल्ड करें

```bash
bun run build        # टाइपचेक + कम्पाइल
bun run dist         # वर्तमान OS के लिए पैकेज
bun run dist:win     # Windows पोर्टेबल exe क्रॉस-कम्पाइल
```

> yt-dlp पहले लॉन्च पर GitHub से फ़ेच होकर आपके ऐप डेटा फ़ोल्डर में कैश होता है। ffmpeg और ffprobe हर Arroxy रिलीज़ के साथ बंडल होते हैं।

</details>

---

## <a id="troubleshooting"></a>Troubleshooting

### App won't open / no window appears

The Arroxy process starts but no window shows up. Most often this is a GPU driver hang during startup. Try, in order:

**1. Check the log.** It records startup, GPU info, and any crash. Path:

| Platform | Path                                              |
| -------- | ------------------------------------------------- |
| Windows  | `%APPDATA%\Arroxy\logs\main.log`                  |
| macOS    | `~/Library/Logs/Arroxy/main.log`                  |
| Linux    | `~/.config/Arroxy/logs/main.log`                  |

**2. Launch with hardware acceleration disabled.** Open a terminal / Command Prompt and run the executable with a flag:

```bash
# Windows (Portable) — PowerShell, run from the folder containing the exe
.\Arroxy-Portable-<version>.exe --disable-gpu

# Windows (Portable) — Command Prompt (cmd.exe), from the same folder
Arroxy-Portable-<version>.exe --disable-gpu

# Windows (Installed) — works in both PowerShell and cmd.exe
"%LOCALAPPDATA%\Programs\Arroxy\Arroxy.exe" --disable-gpu

# macOS
/Applications/Arroxy.app/Contents/MacOS/Arroxy --disable-gpu

# Linux (AppImage)
./Arroxy-*.AppImage --disable-gpu
```

If that works, the GPU/driver is the cause. Make the change permanent (next step).

**3. Persist the flag via `argv.json`.** Create the file at:

| Platform | Path                                          |
| -------- | --------------------------------------------- |
| Windows  | `%APPDATA%\Arroxy\argv.json`                  |
| macOS    | `~/Library/Application Support/Arroxy/argv.json` |
| Linux    | `~/.config/Arroxy/argv.json`                  |

With contents:

```json
{ "disable-hardware-acceleration": true }
```

Arroxy reads this before opening any window, so it works even when the window never appeared.

**4. Other flags worth trying** (combine if needed): `--disable-software-rasterizer`, `--disable-gpu-sandbox`, `--in-process-gpu`.

**5. Stale window position.** If the window may be opening off-screen (multi-monitor change since last run), delete `<userData>\window-state.json` and relaunch.

**6. Still stuck?** Open an issue with: OS version, the contents of `main.log`, and any output from running with `--enable-logging --v=1`.

---

## उपयोग की शर्तें

Arroxy केवल पर्सनल, प्राइवेट इस्तेमाल के लिए एक टूल है। यह सुनिश्चित करना कि आपके डाउनलोड YouTube की [Terms of Service](https://www.youtube.com/t/terms) और आपके अधिकार-क्षेत्र के कॉपीराइट क़ानूनों का पालन करते हैं — यह पूरी तरह आपकी ज़िम्मेदारी है। ऐसी सामग्री डाउनलोड, पुनरुत्पादित या वितरित करने के लिए Arroxy का उपयोग न करें जिसका उपयोग करने का अधिकार आपके पास नहीं है। डेवलपर किसी भी दुरुपयोग के लिए उत्तरदायी नहीं हैं।

<div align="center">
  <sub>MIT लाइसेंस · <a href="https://x.com/OrionusAI">@OrionusAI</a> द्वारा प्यार से बनाया गया</sub>
</div>
