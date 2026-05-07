<div align="center">
  <img src="src/renderer/src/assets/App-icon-HQ.png" alt="Маскот Arroxy" width="180" />

# Arroxy — бесплатный загрузчик YouTube с открытым исходным кодом для Windows, macOS и Linux

**4K · 1080p60 · HDR · Playlists · MP3 · Shorts · Subtitles · SponsorBlock**

**Язык:** [Afaan Oromoo](README.om.md) · [Deutsch](README.de.md) · [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Kiswahili](README.sw.md) · [O'zbekcha](README.uz.md) · [Tiếng Việt](README.vi.md) · [አማርኛ](README.am.md) · [العربية](README.ar.md) · [اردو](README.ur.md) · [پښتو](README.ps.md) · [বাংলা](README.bn.md) · [हिन्दी](README.hi.md) · [မြန်မာဘာသာ](README.my.md) · [Ελληνικά](README.el.md) · **Русский** · [Српски](README.sr.md) · [Українська](README.uk.md) · [中文](README.zh.md) · [日本語](README.ja.md)

[![Релиз](https://img.shields.io/github/v/release/antonio-orionus/Arroxy?label=Release&color=blueviolet)](https://github.com/antonio-orionus/Arroxy/releases/latest) [![Сборка](https://img.shields.io/github/actions/workflow/status/antonio-orionus/Arroxy/release.yml?label=Build)](https://github.com/antonio-orionus/Arroxy/actions/workflows/release.yml) [![Сайт](https://img.shields.io/badge/website-arroxy.orionus.dev-blueviolet)](https://arroxy.orionus.dev/) ![Лицензия](https://img.shields.io/badge/license-MIT-green) ![Платформы](https://img.shields.io/badge/platform-cross--platform-1f2937?logo=github&logoColor=white) ![Языки](https://img.shields.io/badge/i18n-21_languages-blue)

Скачивайте любое видео YouTube, Shorts или аудиодорожку в оригинальном качестве — до 4K HDR при 60 fps или в виде MP3 / AAC / Opus. Работает локально на Windows, macOS и Linux. **Без рекламы, без логина, без кук браузера, без привязки к аккаунту Google.**

[**↓ Скачать последний релиз**](../../releases/latest) &nbsp;·&nbsp; [**Сайт**](https://arroxy.orionus.dev/) &nbsp;·&nbsp; [Windows](#download) · [macOS](#download) · [Linux](#download)

<img src="build/demo.gif" alt="Демо Arroxy" width="720" />

Если Arroxy экономит вам время — ⭐ поможет другим его найти.

</div>

> 🌐 Это перевод с помощью ИИ. [README на английском](README.md) — основной источник истины. Заметили ошибку? [Pull request приветствуется](../../pulls).

---

## Содержание

- [Почему Arroxy](#why)
- [Без кук, без логина, без привязки аккаунта](#no-cookies)
- [Возможности](#features)
- [Скачать](#download)
- [Конфиденциальность](#privacy)
- [Часто задаваемые вопросы](#faq)
- [Дорожная карта](#roadmap)
- [Создано на](#tech)

---

## <a id="why"></a>Почему Arroxy

Сравнение с наиболее распространёнными альтернативами:

|            | Arroxy | 4K Video Downloader | JDownloader | Y2Mate / online converters | Browser extensions |
| ---------- | :----: | :-----------------: | :---------: | :------------------------: | :----------------: |
| Бесплатно, без платных уровней |   ✅   |         ⚠️          |     ✅      |             ⚠️             |         ⚠️         |
| Открытый исходный код |   ✅   |         ❌          |     ❌      |             ❌             |         ⚠️         |
| Только локальная обработка |   ✅   |         ✅          |     ✅      |             ❌             |         ✅         |
| Без логина и экспорта кук |   ✅   |         ⚠️          |     ⚠️      |             ⚠️             |         ✅         |
| Без лимитов использования |   ✅   |         ⚠️          |     ✅      |             🚫             |         ⚠️         |
| Кросс-платформенное десктопное приложение |   ✅   |         ✅          |     ✅      |            N/A             |         ❌         |
| Субтитры + SponsorBlock |   ✅   |         ⚠️          |     ❌      |             ❌             |         ❌         |

Arroxy создан для одного: вставьте URL — получите чистый локальный файл. Никаких аккаунтов, никаких допродаж, никакого сбора данных.

---

## <a id="no-cookies"></a>Без кук, без логина, без привязки аккаунта

Именно из-за этого чаще всего ломаются десктопные загрузчики YouTube — и именно поэтому существует Arroxy.

Когда YouTube обновляет защиту от ботов, большинство инструментов предлагают экспортировать куки браузера YouTube в качестве обходного решения. Два недостатка такого подхода:

1. Экспортированные сессии обычно истекают примерно через ~30 минут, и приходится экспортировать их снова и снова.
2. Собственная документация yt-dlp [предупреждает, что автоматизация на основе кук может привлечь внимание к вашему аккаунту Google](https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies).

**Arroxy никогда не запрашивает куки, логины или какие-либо учётные данные.** Используются только публичные токены, которые YouTube выдаёт любому браузеру. Ничего не связано с вашим аккаунтом Google, нечему истекать, нечего ротировать.

---

## <a id="features"></a>Возможности

### Качество и форматы

- До **4K UHD (2160p)**, 1440p, 1080p, 720p, 480p, 360p
- **Высокая частота кадров** сохраняется как есть — 60 fps, 120 fps, HDR
- **Только аудио** в MP3, M4A/AAC, Opus или WAV
- Быстрые пресеты: *Лучшее качество* · *Сбалансированно* · *Маленький файл*

### Конфиденциальность и контроль

- 100% локальная обработка — загрузки идут напрямую с YouTube на ваш диск
- Без логина, без кук, без привязки к аккаунту Google
- Файлы сохраняются прямо в выбранную вами папку

### Рабочий процесс

- **Вставь любую ссылку YouTube** — поддерживаются видео, Shorts и плейлисты; скачай весь плейлист или сначала выбери нужные видео
- **Очередь загрузок** — следите за несколькими загрузками одновременно
- **Мониторинг буфера обмена** — скопируйте YouTube-ссылку, и Arroxy автоматически заполнит URL при следующем переключении на приложение (включается в расширенных настройках)
- **Автоочистка URL** — удаляет трекинговые параметры (`si`, `pp`, `utm_*`, `fbclid`, `gclid`) и разворачивает ссылки `youtube.com/redirect`
- **Режим трея** — закрытие окна сохраняет загрузки в фоновом режиме
- **9 языков** — автоматически определяет язык системы, переключается в любой момент

### Субтитры и постобработка

- **Субтитры** в SRT, VTT или ASS — ручные или авто-сгенерированные, на любом доступном языке
- Сохранение рядом с видео, встраивание в `.mkv` или размещение в подпапке `Subtitles/`
- **SponsorBlock** — пропуск или разметка спонсорских вставок, вступлений, концовок, самопиара
- **Встроенные метаданные** — название, дата загрузки, канал, описание, обложка и маркеры глав записываются в файл

<div align="center">
  <img src="build/Main-screenshot.png" width="48%" alt="Вставьте URL" />
  <img src="build/Choosing-format-screenshot.png" width="48%" alt="Выберите качество" />
  <br/>
  <img src="build/Choosing-destination-screenshot.png" width="48%" alt="Выберите, куда сохранять" />
  <img src="build/Downloading-in-parallel-screenshot.png" width="48%" alt="Очередь загрузок в работе" />
  <br/>
  <img src="build/Subtitles-screenshot.png" width="48%" alt="Выбор языка субтитров и формата" />
</div>

---

## <a id="download"></a>Скачать

| Платформа | Формат   |
| ------------------- | ------------------- |
| Windows             | Установщик (NSIS) или портативный `.exe`   |
| macOS               | `.dmg` (Intel + Apple Silicon)   |
| Linux               | `.AppImage` или `.flatpak` (с sandbox) |

[**Скачать последний релиз →**](../../releases/latest)

### Установка через пакетный менеджер

| Канал | Команда                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| Winget             | `winget install AntonioOrionus.Arroxy`                                                            |
| Scoop              | `scoop bucket add arroxy https://github.com/antonio-orionus/scoop-bucket && scoop install arroxy` |
| Homebrew           | `brew tap antonio-orionus/arroxy && brew install --cask arroxy`                                   |

<details>
<summary><strong>Windows: Установщик vs Портативная версия</strong></summary>

|               | Установщик NSIS | Портативный `.exe` |
| ------------- | :----------------------: | :---------------------: |
| Требует установки | Да  | Нет — запускается откуда угодно  |
| Авто-обновления | ✅ в приложении  | ❌ ручное скачивание  |
| Скорость запуска | ✅ быстрее  | ⚠️ долгий холодный старт  |
| Добавляется в меню «Пуск» |            ✅            |           ❌            |
| Удобное удаление |            ✅            | ❌ просто удалите файл  |

**Рекомендация:** используйте установщик NSIS для авто-обновлений и быстрого запуска. Портативный `.exe` подходит тем, кто предпочитает вариант без установки и без изменений реестра.

**Предупреждение Windows SmartScreen**

При первом запуске вы можете увидеть **«Windows protected your PC»** или **«Unknown publisher»**. Это касается как `Arroxy-Setup-*.exe`, так и `Arroxy-Portable-*.exe`. Arroxy бесплатный и открытый, а Windows-сборки не подписаны платным сертификатом — именно поэтому SmartScreen их помечает. Это **не** означает автоматически, что Arroxy опасен. Чтобы продолжить:

1. Нажмите **More info**.
2. Нажмите **Run anyway**.

> Скачивайте Arroxy только с официальной страницы GitHub Releases. Если вы получили файл с другого сайта или он был вам прислан — удалите его и загрузите свежую копию из официального источника. Исходный код открыт, поэтому при желании вы можете проверить его или собрать Arroxy самостоятельно.

</details>

<details>
<summary><strong>Первый запуск на macOS</strong></summary>

Arroxy пока не подписан кодом, поэтому macOS Gatekeeper покажет предупреждение при первом запуске. Это ожидаемо — признаком повреждения это не является.

**Способ через Системные настройки (рекомендуется):**

1. Кликните правой кнопкой по иконке Arroxy и выберите **Открыть**.
2. Появится диалог с предупреждением — нажмите **Отмена** (не нажимайте *Переместить в корзину*).
3. Откройте **Системные настройки → Конфиденциальность и безопасность**.
4. Прокрутите до раздела **Безопасность** — увидите *«Arroxy заблокирован, так как разработчик не идентифицирован»*.
5. Нажмите **Открыть всё равно** и подтвердите паролем или Touch ID.

После шага 5 Arroxy открывается как обычно, и предупреждение больше не появится.

**Способ через Терминал (продвинутый):**

```bash
xattr -dr com.apple.quarantine /Applications/Arroxy.app
```

> Сборки для macOS создаются через CI на Apple Silicon и Intel. Если возникнут проблемы, пожалуйста, [откройте issue](../../issues) — отзывы пользователей macOS напрямую влияют на цикл тестирования.

</details>

<details>
<summary><strong>Первый запуск на Linux</strong></summary>

AppImage запускаются напрямую — установка не нужна. Достаточно пометить файл как исполняемый.

**Файловый менеджер:** кликните правой кнопкой по `.AppImage` → **Свойства** → **Права** → включите **Разрешить выполнение файла как программы**, затем дважды кликните для запуска.

**Терминал:**

```bash
chmod +x Arroxy-*.AppImage
./Arroxy-*.AppImage
```

Если запуск всё равно не удаётся — возможно, отсутствует FUSE:

```bash
# Ubuntu / Debian
sudo apt install -y libfuse2

# Fedora
sudo dnf install -y fuse-libs

# Arch
sudo pacman -S fuse2
```

**Flatpak (изолированная альтернатива):** скачайте `Arroxy-*.flatpak` с той же страницы релиза.

```bash
flatpak install --user Arroxy-*.flatpak
flatpak run io.github.antonio_orionus.Arroxy
```

</details>

---

## <a id="privacy"></a>Конфиденциальность

Загрузки выполняются напрямую через [yt-dlp](https://github.com/yt-dlp/yt-dlp) с YouTube в выбранную вами папку — никакого маршрутизирования через сторонние серверы. История просмотров, история загрузок, URL-адреса и содержимое файлов остаются на вашем устройстве.

Arroxy отправляет анонимную агрегированную телеметрию через [TelemetryDeck](https://telemetrydeck.com) — ровно столько, чтобы небольшой инди-проект мог видеть, что им пользуются (запуски, OS, версия приложения, сбои). Никаких URL, названий видео, путей к файлам, информации об аккаунте. Идентификатор установки хешируется перед отправкой, а TelemetryDeck никогда не хранит IPs — размещён в EU и GDPR-совместим по дизайну. Можно отключить в настройках.

---

## <a id="faq"></a>Часто задаваемые вопросы

**Это правда бесплатно?**
Да — лицензия MIT, без платных уровней, без ограничений по функциям.

**Какие качества видео можно скачивать?**
Всё, что предлагает YouTube: 4K UHD (2160p), 1440p, 1080p, 720p, 480p, 360p, а также только аудио. Потоки с высокой частотой кадров (60 fps, 120 fps) и HDR сохраняются как есть.

**Можно ли извлечь только аудио в виде MP3?**
Да. Выбери *только аудио* в меню форматов, а затем MP3, M4A/AAC, Opus или WAV.

**Нужен ли аккаунт YouTube или куки?**
Нет. Arroxy использует только публичные токены, которые YouTube выдаёт любому браузеру. Никаких кук, никакого логина, никаких сохранённых учётных данных. Подробнее — в разделе [Без кук, без логина, без привязки аккаунта](#no-cookies).

**Будет ли работать, если YouTube что-то изменит?**
Два уровня устойчивости: yt-dlp обновляется в течение нескольких часов после изменений YouTube, и Arroxy не зависит от кук, которые истекают каждые ~30 минут. Это делает его значительно стабильнее инструментов, использующих экспорт сессий браузера.

**На каких языках доступен Arroxy?**
На девяти: English, Español, Deutsch, Français, 日本語, 中文, Русский, Українська, हिन्दी. Автоматически определяет язык системы; переключается в любой момент через панель инструментов. Файлы локализации — это простые TypeScript-объекты в `src/shared/i18n/locales/` — [PR приветствуется](../../pulls).

**Нужно что-то дополнительно устанавливать?**
Нет. yt-dlp и ffmpeg автоматически скачиваются при первом запуске с официальных GitHub releases и кешируются локально.

**Можно ли скачивать плейлисты или целые каналы?**
Да, для плейлистов: вставь ссылку на плейлист, затем поставь в очередь весь список или только выбранные видео. Пакетная загрузка целых каналов пока не поддерживается.

**macOS сообщает «приложение повреждено» — что делать?**
Это macOS Gatekeeper блокирует неподписанное приложение, а не реальное повреждение. Пошаговая инструкция — в разделе [Первый запуск на macOS](#download).

**Законно ли скачивать видео с YouTube?**
Для личного, частного использования это в целом допустимо в большинстве юрисдикций. Вы несёте ответственность за соблюдение [Условий использования](https://www.youtube.com/t/terms) YouTube и местных законов об авторском праве.

---

## <a id="roadmap"></a>Дорожная карта

Что запланировано — примерно в порядке приоритета:

| Функция    | Описание    |
| ---------------- | ---------------- |
| **Пакетный ввод URL** | Вставьте сразу несколько ссылок и запустите всё одним махом |
| **Шаблоны имён файлов** | Имена по названию, автору, дате, разрешению — с живым предпросмотром |
| **Запланированные загрузки** | Запуск очереди в заданное время (ночные загрузки) |
| **Лимит скорости** | Ограничение полосы, чтобы загрузки не забивали канал |
| **Обрезка клипов** | Скачайте только нужный отрезок, указав начало и конец |

Есть идея? [Откройте запрос](../../issues) — мнение сообщества определяет приоритеты.

---

## <a id="tech"></a>Создано на

<details>
<summary><strong>Стек технологий</strong></summary>

- **Electron** — кросс-платформенная десктопная оболочка
- **React 19** + **TypeScript** — UI
- **Tailwind CSS v4** — стили
- **Zustand** — управление состоянием
- **yt-dlp** + **ffmpeg** — движок загрузки и мультиплексирования (скачиваются с GitHub при первом запуске, всегда актуальны)
- **Vite** + **electron-vite** — инструменты сборки
- **Vitest** + **Playwright** — юнит- и end-to-end тесты

</details>

<details>
<summary><strong>Сборка из исходников</strong></summary>

### Предварительные требования — все платформы

| Инструмент | Версия  | Установка |
| ---------- | ------- | --------- |
| Git        | любая   | [git-scm.com](https://git-scm.com) |
| Bun        | последняя | см. ниже по платформе |

### Windows

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

Нативные инструменты сборки не требуются — в проекте нет нативных Node-аддонов.

### macOS

```bash
xcode-select --install
curl -fsSL https://bun.sh/install | bash
```

### Linux (Ubuntu / Debian)

```bash
curl -fsSL https://bun.sh/install | bash

# Зависимости рантайма Electron
sudo apt install -y libgtk-3-0 libnss3 libasound2t64

# Только для E2E-тестов (Electron требует дисплей)
sudo apt install -y xvfb
```

### Клонирование и запуск

```bash
git clone https://github.com/antonio-orionus/Arroxy
cd arroxy
bun install
bun run dev          # сборка с горячей перезагрузкой
```

### Сборка дистрибутива

```bash
bun run build        # проверка типов + компиляция
bun run dist         # упаковка для текущей ОС
bun run dist:win     # кросс-компиляция портативного .exe для Windows
```

> yt-dlp и ffmpeg не включены в сборку — они скачиваются с GitHub при первом запуске и кешируются в папке данных приложения.

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

## Условия использования

Arroxy — инструмент исключительно для личного, частного использования. Вы единолично отвечаете за то, чтобы ваши загрузки соответствовали [Условиям использования](https://www.youtube.com/t/terms) YouTube и законам об авторском праве вашей юрисдикции. Не используйте Arroxy для скачивания, воспроизведения или распространения контента, на который у вас нет прав. Разработчики не несут ответственности за злоупотребления.

<div align="center">
  <sub>Лицензия MIT · Сделано с заботой <a href="https://x.com/OrionusAI">@OrionusAI</a></sub>
</div>
