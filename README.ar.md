<div align="center">
  <img src="src/renderer/src/assets/App-icon-HQ.png" alt="شعار Arroxy" width="180" />

# Arroxy — محمّل يوتيوب مجاني ومفتوح المصدر لـ Windows وmacOS وLinux

**4K · 1080p60 · HDR · Playlists · MP3 · Shorts · Subtitles · SponsorBlock**

**اقرأ بـ:** [Afaan Oromoo](README.om.md) · [Deutsch](README.de.md) · [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Kiswahili](README.sw.md) · [O'zbekcha](README.uz.md) · [Tiếng Việt](README.vi.md) · [አማርኛ](README.am.md) · **العربية** · [اردو](README.ur.md) · [پښتو](README.ps.md) · [বাংলা](README.bn.md) · [हिन्दी](README.hi.md) · [မြန်မာဘာသာ](README.my.md) · [Ελληνικά](README.el.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Українська](README.uk.md) · [中文](README.zh.md) · [日本語](README.ja.md)

[![الإصدار](https://img.shields.io/github/v/release/antonio-orionus/Arroxy?label=Release&color=blueviolet)](https://github.com/antonio-orionus/Arroxy/releases/latest) [![البناء](https://img.shields.io/github/actions/workflow/status/antonio-orionus/Arroxy/release.yml?label=Build)](https://github.com/antonio-orionus/Arroxy/actions/workflows/release.yml) [![الموقع الإلكتروني](https://img.shields.io/badge/website-arroxy.orionus.dev-blueviolet)](https://arroxy.orionus.dev/) ![الرخصة](https://img.shields.io/badge/license-MIT-green) ![الأنظمة](https://img.shields.io/badge/platform-cross--platform-1f2937?logo=github&logoColor=white) ![اللغات](https://img.shields.io/badge/i18n-21_languages-blue)

نزِّل أي فيديو أو Short أو مقطع صوتي من يوتيوب بجودته الأصلية — حتى 4K HDR بـ 60 إطاراً في الثانية، أو بصيغ MP3 / AAC / Opus. يعمل محلياً على Windows وmacOS وLinux. **لا إعلانات، لا تسجيل دخول، لا كوكيز متصفح، لا ربط بحساب Google.**

[**↓ تنزيل أحدث إصدار**](../../releases/latest) &nbsp;·&nbsp; [**الموقع الإلكتروني**](https://arroxy.orionus.dev/) &nbsp;·&nbsp; [Windows](#download) · [macOS](#download) · [Linux](#download)

<img src="build/demo.gif" alt="عرض توضيحي لـ Arroxy" width="720" />

إذا وفّر لك Arroxy الوقت، فإن ⭐ يساعد الآخرين على اكتشافه.

</div>

---

## المحتويات

- [لماذا Arroxy](#why)
- [لا كوكيز، لا تسجيل دخول، لا ربط بالحساب](#no-cookies)
- [الميزات](#features)
- [التنزيل](#download)
- [الخصوصية](#privacy)
- [الأسئلة الشائعة](#faq)
- [خارطة الطريق](#roadmap)
- [مبني باستخدام](#tech)

---

## <a id="why"></a>لماذا Arroxy

مقارنة جنباً إلى جنب مع أكثر البدائل شيوعاً:

|            | Arroxy | 4K Video Downloader | JDownloader | Y2Mate / online converters | Browser extensions |
| ---------- | :----: | :-----------------: | :---------: | :------------------------: | :----------------: |
| مجاني، بدون مستوى مميز |   ✅   |         ⚠️          |     ✅      |             ⚠️             |         ⚠️         |
| مفتوح المصدر |   ✅   |         ❌          |     ❌      |             ❌             |         ⚠️         |
| معالجة محلية فقط |   ✅   |         ✅          |     ✅      |             ❌             |         ✅         |
| لا تسجيل دخول ولا تصدير كوكيز |   ✅   |         ⚠️          |     ⚠️      |             ⚠️             |         ✅         |
| لا حدود للاستخدام |   ✅   |         ⚠️          |     ✅      |             🚫             |         ⚠️         |
| تطبيق سطح مكتب متعدد الأنظمة |   ✅   |         ✅          |     ✅      |            N/A             |         ❌         |
| ترجمات + SponsorBlock |   ✅   |         ⚠️          |     ❌      |             ❌             |         ❌         |

Arroxy مبني لغرض واحد: الصق رابطاً، احصل على ملف محلي نظيف. لا حسابات، لا عروض ترويجية، لا جمع بيانات.

---

## <a id="no-cookies"></a>لا كوكيز، لا تسجيل دخول، لا ربط بالحساب

هذا هو السبب الأكثر شيوعاً لتعطل محمّلات يوتيوب للسطح المكتبي — والسبب الرئيسي لوجود Arroxy.

عندما يُحدِّث يوتيوب آليات اكتشاف البوت، تطلب معظم الأدوات تصدير كوكيز يوتيوب من متصفحك كحل بديل. ثمة مشكلتان في ذلك:

1. تنتهي صلاحية الجلسات المُصدَّرة عادةً خلال ~30 دقيقة، مما يضطرك لإعادة التصدير باستمرار.
2. توثيق yt-dlp نفسه [يحذّر من أن أتمتة الكوكيز قد تُعلِّم حساب Google الخاص بك](https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies).

**Arroxy لا يطلب كوكيز أو تسجيل دخول أو أي بيانات اعتماد.** يستخدم فقط الرموز العامة التي يقدمها يوتيوب لأي متصفح. لا شيء مرتبط بهويتك على Google، لا شيء ينتهي، لا شيء يحتاج إلى تجديد.

---

## <a id="features"></a>الميزات

### الجودة والصيغ

- حتى **4K UHD (2160p)**، 1440p، 1080p، 720p، 480p، 360p
- **معدل إطارات عالٍ** محفوظ كما هو — 60 fps، 120 fps، HDR
- **صوت فقط** إلى MP3 أو M4A/AAC أو Opus أو WAV
- إعدادات سريعة: *أفضل جودة* · *متوازن* · *ملف صغير*

### الخصوصية والتحكم

- معالجة محلية 100% — تذهب التنزيلات مباشرة من يوتيوب إلى قرصك
- لا تسجيل دخول، لا كوكيز، لا ربط بحساب Google
- الملفات تُحفظ مباشرة في المجلد الذي تختاره

### سير العمل

- **ألصق أي رابط YouTube** — الفيديوهات وShorts وقوائم التشغيل مدعومة؛ نزّل قائمة التشغيل كاملة أو اختر فيديوهات محددة أولاً
- **قائمة تنزيل متعددة** — تتبع عدة تنزيلات بالتوازي
- **مراقبة الحافظة** — انسخ رابط يوتيوب ويملأ Arroxy الحقل تلقائياً عند العودة للتطبيق (قابل للتفعيل في الإعدادات المتقدمة)
- **تنظيف الروابط تلقائياً** — يحذف معاملات التتبع (`si`، `pp`، `utm_*`، `fbclid`، `gclid`) ويفك روابط `youtube.com/redirect`
- **وضع الشريط** — إغلاق النافذة يبقي التنزيلات تعمل في الخلفية
- **21 لغة** — يكتشف لغة النظام تلقائياً، قابل للتغيير في أي وقت

### الترجمات والمعالجة اللاحقة

- **ترجمات** بصيغ SRT أو VTT أو ASS — يدوية أو مولَّدة تلقائياً، بأي لغة متاحة
- حفظها بجانب الفيديو، أو تضمينها في `.mkv`، أو تنظيمها في مجلد فرعي `Subtitles/`
- **SponsorBlock** — تخطي الرعاة أو وضع علامة فصل عليهم، المقدمات والخواتم والترويج الذاتي
- **بيانات وصفية مضمّنة** — العنوان، تاريخ الرفع، القناة، الوصف، الصورة المصغرة، وعلامات الفصول تُكتب في الملف

<div align="center">
  <img src="build/Main-screenshot.png" width="48%" alt="الصق رابطاً" />
  <img src="build/Choosing-format-screenshot.png" width="48%" alt="اختر الجودة" />
  <br/>
  <img src="build/Choosing-destination-screenshot.png" width="48%" alt="اختر مكان الحفظ" />
  <img src="build/Downloading-in-parallel-screenshot.png" width="48%" alt="قائمة التنزيل في العمل" />
  <br/>
  <img src="build/Subtitles-screenshot.png" width="48%" alt="منتقي لغة وصيغة الترجمة" />
</div>

---

## <a id="download"></a>التنزيل

| النظام | الصيغة   |
| ------------------- | ------------------- |
| Windows             | المثبِّت (NSIS) أو محمول `.exe`   |
| macOS               | `.dmg` (Intel + Apple Silicon)   |
| Linux               | `.AppImage` أو `.flatpak` (معزول) |

[**احصل على أحدث إصدار →**](../../releases/latest)

### التثبيت عبر مدير الحزم

| القناة | الأمر                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| Winget             | `winget install AntonioOrionus.Arroxy`                                                            |
| Scoop              | `scoop bucket add arroxy https://github.com/antonio-orionus/scoop-bucket && scoop install arroxy` |
| Homebrew           | `brew tap antonio-orionus/arroxy && brew install --cask arroxy`                                   |

<details>
<summary><strong>Windows: المثبِّت مقابل المحمول</strong></summary>

|               | NSIS Installer | Portable `.exe` |
| ------------- | :----------------------: | :---------------------: |
| يتطلب التثبيت | نعم  | لا — يعمل من أي مكان  |
| التحديث التلقائي | ✅ داخل التطبيق  | ❌ تنزيل يدوي  |
| سرعة التشغيل | ✅ أسرع  | ⚠️ بداية باردة أبطأ  |
| يُضاف إلى قائمة ابدأ |            ✅            |           ❌            |
| سهولة إلغاء التثبيت |            ✅            | ❌ احذف الملف  |

**التوصية:** استخدم مثبِّت NSIS للتحديثات التلقائية والتشغيل الأسرع. استخدم `.exe` المحمول لخيار بدون تثبيت وبدون سجل.

**تحذير Windows SmartScreen**

عند التشغيل الأول قد تظهر **"Windows protected your PC"** أو **"Unknown publisher."** ينطبق هذا على كلٍّ من `Arroxy-Setup-*.exe` و`Arroxy-Portable-*.exe`. Arroxy مجاني ومفتوح المصدر وإصدارات Windows غير موقَّعة بشهادة مدفوعة، لذا يُعلِّمها SmartScreen. هذا **لا** يعني تلقائياً أن Arroxy غير آمن. للمتابعة:

1. انقر **More info**.
2. انقر **Run anyway**.

> حمِّل Arroxy من صفحة GitHub Releases الرسمية فقط. إذا حصلت على الملف من موقع آخر أو أرسله إليك أحد، احذفه وحمِّل نسخة جديدة من المصدر الرسمي. الكود المصدري عام ويمكنك مراجعته أو بناء Arroxy بنفسك إن أردت.

</details>

<details>
<summary><strong>التشغيل لأول مرة على macOS</strong></summary>

Arroxy غير موقَّع رمزياً بعد، لذا سيحذّرك Gatekeeper في macOS عند التشغيل الأول. هذا متوقع — وليس دليلاً على تلف.

**طريقة إعدادات النظام (مُوصى بها):**

1. انقر بزر الماوس الأيمن على أيقونة تطبيق Arroxy واختر **فتح**.
2. تظهر نافذة التحذير — انقر **إلغاء** (لا تنقر *نقل إلى سلة المهملات*).
3. افتح **إعدادات النظام ← الخصوصية والأمان**.
4. مرِّر إلى قسم **الأمان**. ستجد *"تم حظر Arroxy لأنه ليس من مطوّر معروف."*
5. انقر **فتح على أي حال** وأكِّد بكلمة المرور أو Touch ID.

بعد الخطوة 5، يفتح Arroxy بشكل طبيعي ولن يظهر التحذير مجدداً.

**طريقة Terminal (متقدم):**

```bash
xattr -dr com.apple.quarantine /Applications/Arroxy.app
```

> تُنتَج إصدارات macOS عبر CI على أجهزة Apple Silicon وIntel. إذا واجهت مشاكل، يرجى [فتح تقرير](../../issues) — تعليقات مستخدمي macOS تُشكِّل دورة الاختبار بفاعلية.

</details>

<details>
<summary><strong>التشغيل لأول مرة على Linux</strong></summary>

تعمل AppImages مباشرة — دون تثبيت. تحتاج فقط إلى تعيين الملف كقابل للتنفيذ.

**مدير الملفات:** انقر بزر الأيمن على `.AppImage` ← **خصائص** ← **أذونات** ← مكِّن **السماح بتنفيذ الملف كبرنامج**، ثم انقر نقراً مزدوجاً.

**Terminal:**

```bash
chmod +x Arroxy-*.AppImage
./Arroxy-*.AppImage
```

إذا فشل التشغيل بعد ذلك، قد يكون FUSE مفقوداً:

```bash
# Ubuntu / Debian
sudo apt install -y libfuse2

# Fedora
sudo dnf install -y fuse-libs

# Arch
sudo pacman -S fuse2
```

**Flatpak (بديل معزول):** نزِّل `Arroxy-*.flatpak` من صفحة الإصدار نفسها.

```bash
flatpak install --user Arroxy-*.flatpak
flatpak run io.github.antonio_orionus.Arroxy
```

</details>

---

## <a id="privacy"></a>الخصوصية

تُجلب التنزيلات مباشرة عبر [yt-dlp](https://github.com/yt-dlp/yt-dlp) من يوتيوب إلى المجلد الذي تختاره — لا شيء يمر عبر خادم طرف ثالث. سجل المشاهدة والتنزيل والروابط ومحتوى الملفات تبقى على جهازك.

يرسل Arroxy قياسات مجهولة ومجمّعة عبر [OpenPanel](https://openpanel.dev) — بما يكفي فقط لفهم مرات التشغيل وأنظمة التشغيل وإصدارات التطبيق والأعطال. لا URLs، لا عناوين فيديو، لا مسارات ملفات، لا معلومات حساب، لا بصمة رقمية، ولا بيانات شخصية. معرّف كل تثبيت عشوائي وغير مرتبط بهويتك. يمكنك إيقافه من الإعدادات.

---

## <a id="faq"></a>الأسئلة الشائعة

**هل هو مجاني حقاً؟**
نعم — مرخَّص بـ MIT، بدون مستوى مميز، بدون قيود على الميزات.

**ما جودات الفيديو التي يمكنني تنزيلها؟**
كل ما يوفره يوتيوب: 4K UHD (2160p)، 1440p، 1080p، 720p، 480p، 360p، بالإضافة إلى الصوت فقط. تدفقات 60 fps و120 fps وHDR محفوظة كما هي.

**هل يمكنني استخراج الصوت فقط بصيغة MP3؟**
نعم. اختر *صوت فقط* من قائمة الصيغ ثم اختر MP3 أو M4A/AAC أو Opus أو WAV.

**هل أحتاج إلى حساب يوتيوب أو كوكيز؟**
لا. يستخدم Arroxy فقط الرموز العامة التي يقدمها يوتيوب لأي متصفح. لا كوكيز، لا تسجيل دخول، لا بيانات اعتماد مُخزَّنة. انظر [لا كوكيز، لا تسجيل دخول، لا ربط بالحساب](#no-cookies) لمعرفة أهمية ذلك.

**هل سيستمر في العمل عند تغيير يوتيوب لشيء ما؟**
طبقتان من الصمود: يتحدث yt-dlp خلال ساعات من تغييرات يوتيوب، ولا يعتمد Arroxy على كوكيز تنتهي صلاحيتها كل ~30 دقيقة. هذا يجعله أكثر استقراراً بشكل ملحوظ من الأدوات التي تعتمد على جلسات المتصفح المُصدَّرة.

**ما اللغات المتاحة في Arroxy؟**
إحدى وعشرون لغة، جاهزة للاستخدام: English وEspañol (الإسبانية) وDeutsch (الألمانية) وFrançais (الفرنسية) و日本語 (اليابانية) و中文 (الصينية) وРусский (الروسية) وУкраїнська (الأوكرانية) وहिन्दी (الهندية) وAfaan Oromoo وKiswahili وO'zbekcha (الأوزبكية) وTiếng Việt (الفيتنامية) وአማርኛ (الأمهرية) والعربية واردو (الأردية) وپښتو (البشتونية) وবাংলা (البنغالية) وမြန်မာဘာသာ (البورمية) وΕλληνικά (اليونانية) وСрпски (الصربية). يكتشف Arroxy لغة نظام تشغيلك تلقائياً عند الإطلاق الأول، ويمكنك التبديل في أي وقت من محدد اللغة في شريط الأدوات. تقع ملفات الترجمة كأوبجكتات TypeScript بسيطة في src/shared/i18n/locales/ — افتح طلب سحب على GitHub للمساهمة.

**هل أحتاج إلى تثبيت شيء آخر؟**
لا. يُحمَّل yt-dlp تلقائياً عند الإطلاق الأول ويُخزَّن على جهازك؛ أمّا ffmpeg وffprobe فيأتيان داخل التطبيق. بعد ذلك، لا تحتاج أي إعداد إضافي.

**هل يمكنني تنزيل قوائم التشغيل أو القنوات بالكامل؟**
نعم، بالنسبة لقوائم التشغيل: الصق رابط قائمة التشغيل ثم ضع القائمة كاملة أو الفيديوهات التي تختارها فقط في قائمة الانتظار. تنزيل القنوات الكاملة دفعة واحدة غير مدعوم بعد.

**يقول macOS إن "التطبيق تالف" — ماذا أفعل؟**
هذا Gatekeeper في macOS يحظر تطبيقاً غير موقَّع، وليس تلفاً فعلياً. انظر قسم [التشغيل لأول مرة على macOS](#download) للحل.

**هل تنزيل فيديوهات يوتيوب قانوني؟**
للاستخدام الشخصي الخاص، يُقبَل هذا عموماً في معظم الولايات القضائية. أنت مسؤول عن الامتثال لـ [شروط خدمة](https://www.youtube.com/t/terms) يوتيوب وقوانين حقوق النشر في بلدك.

---

## <a id="roadmap"></a>خارطة الطريق

القادم — تقريباً بترتيب الأولوية:

| الميزة    | الوصف    |
| ---------------- | ---------------- |
| **إدخال روابط متعددة** | الصق روابط متعددة دفعة واحدة وشغِّلها معاً |
| **قوالب أسماء ملفات مخصصة** | تسمية الملفات بالعنوان أو الرافع أو التاريخ أو الدقة — مع معاينة فورية |
| **التنزيلات المجدولة** | بدء قائمة في وقت محدد (تشغيل ليلي) |
| **حدود السرعة** | تحديد عرض النطاق الترددي حتى لا تُشبع التنزيلات اتصالك |
| **قص المقاطع** | تنزيل جزء فقط بتحديد وقت البداية والنهاية |

هل لديك ميزة في ذهنك؟ [افتح طلباً](../../issues) — مدخلات المجتمع تُشكِّل الأولويات.

---

## <a id="tech"></a>مبني باستخدام

<details>
<summary><strong>Stack</strong></summary>

- **Electron** — بيئة سطح المكتب متعددة الأنظمة
- **React 19** + **TypeScript** — واجهة المستخدم
- **Tailwind CSS v4** — التنسيق
- **Zustand** — إدارة الحالة
- **yt-dlp** + **ffmpeg** — محرك التنزيل والدمج (يُجلب yt-dlp وقت التشغيل؛ ويُضمَّن ffmpeg/ffprobe وقت البناء)
- **Vite** + **electron-vite** — أدوات البناء
- **Vitest** + **Playwright** — اختبارات الوحدة والشامل

</details>

<details>
<summary><strong>البناء من المصدر</strong></summary>

### المتطلبات الأساسية — جميع الأنظمة

| الأداة | الإصدار | التثبيت |
| ---- | ------- | ------- |
| Git  | أي إصدار | [git-scm.com](https://git-scm.com) |
| Bun  | الأحدث  | انظر الأنظمة أدناه |

### Windows

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

لا حاجة لأدوات بناء أصلية — المشروع لا يحتوي على إضافات Node أصلية.

### macOS

```bash
xcode-select --install
curl -fsSL https://bun.sh/install | bash
```

### Linux (Ubuntu / Debian)

```bash
curl -fsSL https://bun.sh/install | bash

# اعتماديات Electron
sudo apt install -y libgtk-3-0 libnss3 libasound2t64

# اختبارات E2E فقط (يحتاج Electron إلى شاشة)
sudo apt install -y xvfb
```

### الاستنساخ والتشغيل

```bash
git clone https://github.com/antonio-orionus/Arroxy
cd arroxy
bun install
bun run dev          # بناء تطويري مع إعادة التحميل الفوري
```

### بناء حزمة قابلة للتوزيع

```bash
bun run build        # فحص الأنواع + التجميع
bun run dist         # حزمة للنظام الحالي
bun run dist:win     # تجميع متقاطع لـ Windows Portable exe
```

> يُجلب yt-dlp من GitHub عند أول تشغيل ويُخزَّن في مجلد بيانات التطبيق. يأتي ffmpeg وffprobe مضمنين مع كل إصدار من Arroxy.

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

## شروط الاستخدام

Arroxy أداة للاستخدام الشخصي الخاص فقط. أنت مسؤول مسؤولية كاملة عن ضمان امتثال تنزيلاتك لـ [شروط خدمة](https://www.youtube.com/t/terms) يوتيوب وقوانين حقوق النشر في ولايتك القضائية. لا تستخدم Arroxy لتنزيل أو إعادة إنتاج أو توزيع محتوى ليس لديك حق استخدامه. المطوّرون غير مسؤولين عن أي إساءة استخدام.

<div align="center">
  <sub>ترخيص MIT · صُنع بعناية بواسطة <a href="https://x.com/OrionusAI">@OrionusAI</a></sub>
</div>
