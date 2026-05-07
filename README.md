<div align="center">
  <img src="src/renderer/src/assets/App-icon-HQ.png" alt="Arroxy mascot" width="180" />

# Arroxy — Free Open-Source YouTube Downloader for Windows, macOS & Linux

**4K · 1080p60 · HDR · Playlists · MP3 · Shorts · Subtitles · SponsorBlock**

**Read in:** [Afaan Oromoo](README.om.md) · [Deutsch](README.de.md) · **English** · [Español](README.es.md) · [Français](README.fr.md) · [Kiswahili](README.sw.md) · [O'zbekcha](README.uz.md) · [Tiếng Việt](README.vi.md) · [አማርኛ](README.am.md) · [العربية](README.ar.md) · [اردو](README.ur.md) · [پښتو](README.ps.md) · [বাংলা](README.bn.md) · [हिन्दी](README.hi.md) · [မြန်မာဘာသာ](README.my.md) · [Ελληνικά](README.el.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Українська](README.uk.md) · [中文](README.zh.md) · [日本語](README.ja.md)

[![Release](https://img.shields.io/github/v/release/antonio-orionus/Arroxy?label=Release&color=blueviolet)](https://github.com/antonio-orionus/Arroxy/releases/latest) [![Build](https://img.shields.io/github/actions/workflow/status/antonio-orionus/Arroxy/release.yml?label=Build)](https://github.com/antonio-orionus/Arroxy/actions/workflows/release.yml) [![Website](https://img.shields.io/badge/website-arroxy.orionus.dev-blueviolet)](https://arroxy.orionus.dev/) ![License](https://img.shields.io/badge/license-MIT-green) ![Platforms](https://img.shields.io/badge/platform-cross--platform-1f2937?logo=github&logoColor=white) ![Languages](https://img.shields.io/badge/i18n-21_languages-blue)

Download any YouTube video, Short, or audio track in original quality — up to 4K HDR at 60 fps, or as MP3 / AAC / Opus. Runs locally on Windows, macOS, and Linux. **No ads, no login, no browser cookies, no Google account linked.**

[**↓ Download Latest Release**](../../releases/latest) &nbsp;·&nbsp; [**Website**](https://arroxy.orionus.dev/) &nbsp;·&nbsp; [Windows](#download) · [macOS](#download) · [Linux](#download)

<img src="build/demo.gif" alt="Arroxy demo" width="720" />

If Arroxy saves you time, a ⭐ helps others find it.

</div>

---

## Contents

- [Why Arroxy](#why)
- [No cookies, no logins, no account linking](#no-cookies)
- [Features](#features)
- [Download](#download)
- [Privacy](#privacy)
- [FAQ](#faq)
- [Roadmap](#roadmap)
- [Built with](#tech)

---

## <a id="why"></a>Why Arroxy

A side-by-side comparison with the most common alternatives:

|            | Arroxy | 4K Video Downloader | JDownloader | Y2Mate / online converters | Browser extensions |
| ---------- | :----: | :-----------------: | :---------: | :------------------------: | :----------------: |
| Free, no premium tier |   ✅   |         ⚠️          |     ✅      |             ⚠️             |         ⚠️         |
| Open source |   ✅   |         ❌          |     ❌      |             ❌             |         ⚠️         |
| Local processing only |   ✅   |         ✅          |     ✅      |             ❌             |         ✅         |
| No login or cookie export |   ✅   |         ⚠️          |     ⚠️      |             ⚠️             |         ✅         |
| No usage caps |   ✅   |         ⚠️          |     ✅      |             🚫             |         ⚠️         |
| Cross-platform desktop app |   ✅   |         ✅          |     ✅      |            N/A             |         ❌         |
| Subtitles + SponsorBlock |   ✅   |         ⚠️          |     ❌      |             ❌             |         ❌         |

Arroxy is built for one thing: paste a URL, get a clean local file. No accounts, no upsells, no data collection.

---

## <a id="no-cookies"></a>No cookies, no logins, no account linking

This is the most common reason desktop YouTube downloaders break — and the main reason Arroxy exists.

When YouTube updates its bot detection, most tools tell you to export your browser's YouTube cookies as a workaround. Two problems with that:

1. Exported sessions typically expire within ~30 minutes, so you re-export constantly.
2. yt-dlp's own documentation [warns that cookie-based automation can flag your Google account](https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies).

**Arroxy never asks for cookies, logins, or any credential.** It uses only the public tokens YouTube serves to any browser. Nothing tied to your Google identity, nothing to expire, nothing to rotate.

---

## <a id="features"></a>Features

### Quality & formats

- Up to **4K UHD (2160p)**, 1440p, 1080p, 720p, 480p, 360p
- **High frame rate** preserved as-is — 60 fps, 120 fps, HDR
- **Audio-only** export to MP3, M4A/AAC, Opus, or WAV
- Quick presets: *Best quality* · *Balanced* · *Small file*

### Privacy & control

- 100% local processing — downloads go straight from YouTube to your disk
- No login, no cookies, no Google account linked
- Files saved straight to the folder you choose

### Workflow

- **Paste any YouTube URL** — videos, Shorts, and playlists supported; download the whole playlist or pick specific videos first
- **Multi-download queue** — track several downloads in parallel
- **Clipboard watch** — copy a YouTube link and Arroxy auto-fills the URL when you refocus the app (toggle in Advanced settings)
- **Auto-clean URLs** — strips tracking params (`si`, `pp`, `utm_*`, `fbclid`, `gclid`) and unwraps `youtube.com/redirect` links
- **Tray mode** — closing the window keeps downloads running in the background
- **21 languages** — auto-detects system locale, switchable any time

### Subtitles & post-processing

- **Subtitles** in SRT, VTT, or ASS — manual or auto-generated, in any available language
- Save next to the video, embed into `.mkv`, or organize into a `Subtitles/` subfolder
- **SponsorBlock** — skip or chapter-mark sponsors, intros, outros, self-promos
- **Embedded metadata** — title, upload date, channel, description, thumbnail, and chapter markers written into the file

<div align="center">
  <img src="build/Main-screenshot.png" width="48%" alt="Paste a URL" />
  <img src="build/Choosing-format-screenshot.png" width="48%" alt="Pick your quality" />
  <br/>
  <img src="build/Choosing-destination-screenshot.png" width="48%" alt="Choose where to save" />
  <img src="build/Downloading-in-parallel-screenshot.png" width="48%" alt="Download queue in action" />
  <br/>
  <img src="build/Subtitles-screenshot.png" width="48%" alt="Subtitle language and format picker" />
</div>

---

## <a id="download"></a>Download

| Platform | Format   |
| ------------------- | ------------------- |
| Windows             | Installer (NSIS) or Portable `.exe`   |
| macOS               | `.dmg` (Intel + Apple Silicon)   |
| Linux               | `.AppImage` or `.flatpak` (sandboxed) |

[**Grab the latest release →**](../../releases/latest)

### Install via package manager

| Channel | Command                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| Winget             | `winget install AntonioOrionus.Arroxy`                                                            |
| Scoop              | `scoop bucket add arroxy https://github.com/antonio-orionus/scoop-bucket && scoop install arroxy` |
| Homebrew           | `brew tap antonio-orionus/arroxy && brew install --cask arroxy`                                   |

<details>
<summary><strong>Windows: Installer vs Portable</strong></summary>

|               | NSIS Installer | Portable `.exe` |
| ------------- | :----------------------: | :---------------------: |
| Installation required | Yes  | No — run from anywhere  |
| Auto-updates | ✅ in-app  | ❌ manual download  |
| Startup speed | ✅ faster  | ⚠️ slower cold start  |
| Adds to Start Menu |            ✅            |           ❌            |
| Easy uninstall |            ✅            | ❌ delete the file  |

**Recommendation:** use the NSIS installer for auto-updates and faster startup. Use the portable `.exe` for a no-install, no-registry option.

**Windows SmartScreen warning**

On first launch you may see **"Windows protected your PC"** or **"Unknown publisher."** This applies to both `Arroxy-Setup-*.exe` and `Arroxy-Portable-*.exe`. Arroxy is free and open-source and the Windows builds are not code-signed with a paid certificate, which is why SmartScreen flags them. It does **not** automatically mean Arroxy is unsafe. To continue:

1. Click **More info**.
2. Click **Run anyway**.

> Only download Arroxy from the official GitHub Releases page. If you got the file from another website or someone sent it to you, delete it and download a fresh copy from the official source. The source code is public, so you can inspect it or build Arroxy yourself if you prefer.

</details>

<details>
<summary><strong>First-time launch on macOS</strong></summary>

Arroxy is not yet code-signed, so macOS Gatekeeper will warn you on first launch. This is expected — it's not a sign of damage.

**System Settings method (recommended):**

1. Right-click the Arroxy app icon and select **Open**.
2. The warning dialog appears — click **Cancel** (don't click *Move to Trash*).
3. Open **System Settings → Privacy & Security**.
4. Scroll to the **Security** section. You'll see *"Arroxy was blocked from use because it is not from an identified developer."*
5. Click **Open Anyway** and confirm with your password or Touch ID.

After step 5, Arroxy opens normally and the warning never appears again.

**Terminal method (advanced):**

```bash
xattr -dr com.apple.quarantine /Applications/Arroxy.app
```

> macOS builds are produced via CI on Apple Silicon and Intel runners. If you hit issues, please [open an issue](../../issues) — feedback from macOS users actively shapes the macOS testing cycle.

</details>

<details>
<summary><strong>First-time launch on Linux</strong></summary>

AppImages run directly — no installation. You just need to mark the file as executable.

**File manager:** right-click the `.AppImage` → **Properties** → **Permissions** → enable **Allow executing file as program**, then double-click.

**Terminal:**

```bash
chmod +x Arroxy-*.AppImage
./Arroxy-*.AppImage
```

If launch still fails, you may be missing FUSE:

```bash
# Ubuntu / Debian
sudo apt install -y libfuse2

# Fedora
sudo dnf install -y fuse-libs

# Arch
sudo pacman -S fuse2
```

**Flatpak (sandboxed alternative):** download `Arroxy-*.flatpak` from the same release page.

```bash
flatpak install --user Arroxy-*.flatpak
flatpak run io.github.antonio_orionus.Arroxy
```

</details>

---

## <a id="privacy"></a>Privacy

Downloads are fetched directly via [yt-dlp](https://github.com/yt-dlp/yt-dlp) from YouTube to the folder you pick — nothing routed through a third-party server. Watch history, download history, URLs, and file contents stay on your device.

Arroxy sends anonymous, aggregate telemetry via [OpenPanel](https://openpanel.dev) — just enough for an indie project to understand launches, OS, app versions, and crashes. No URLs, video titles, file paths, account info, fingerprinting, or personal data. The per-install ID is random and not tied to your identity. You can opt out in Settings.

---

## <a id="faq"></a>FAQ

**Is it really free?**
Yes — MIT licensed, no premium tier, no feature gating.

**What video qualities can I download?**
Anything YouTube serves: 4K UHD (2160p), 1440p, 1080p, 720p, 480p, 360p, plus audio-only. 60 fps, 120 fps, and HDR streams are preserved as-is.

**Can I extract just the audio as MP3?**
Yes. Pick *audio-only* in the format menu and choose MP3, M4A/AAC, Opus, or WAV.

**Do I need a YouTube account or cookies?**
No. Arroxy uses only the public tokens YouTube serves to any browser. No cookies, no login, no credentials stored. See [No cookies, no logins, no account linking](#no-cookies) for why this matters.

**Will it keep working when YouTube changes something?**
Two layers of resilience: yt-dlp updates within hours of YouTube changes, and Arroxy doesn't rely on cookies that expire every ~30 minutes. That makes it noticeably more stable than tools that depend on exported browser sessions.

**What languages is Arroxy available in?**
Twenty-one, out of the box: English, Español (Spanish), Deutsch (German), Français (French), 日本語 (Japanese), 中文 (Chinese), Русский (Russian), Українська (Ukrainian), हिन्दी (Hindi), Afaan Oromoo, Kiswahili, O'zbekcha (Uzbek), Tiếng Việt (Vietnamese), አማርኛ (Amharic), العربية (Arabic), اردو (Urdu), پښتو (Pashto), বাংলা (Bengali), မြန်မာဘာသာ (Burmese), Ελληνικά (Greek), and Српски (Serbian). Arroxy auto-detects your operating system's language on first launch and you can switch at any time from the language picker in the toolbar. Translations live as plain TypeScript objects in src/shared/i18n/locales/ — open a PR on GitHub to contribute.

**Do I need to install anything else?**
No. yt-dlp is downloaded automatically on first launch and cached on your machine; ffmpeg and ffprobe ship with the app. After that, no extra setup is needed.

**Can I download playlists or whole channels?**
Yes for playlists: paste a playlist URL, then queue the whole list or only the videos you select. Whole-channel batch downloads are not supported yet.

**macOS says "the app is damaged" — what do I do?**
That's macOS Gatekeeper blocking an unsigned app, not actual damage. See the [first-time launch on macOS](#download) section for the fix.

**Is downloading YouTube videos legal?**
For personal, private use it is generally accepted in most jurisdictions. You are responsible for complying with YouTube's [Terms of Service](https://www.youtube.com/t/terms) and your local copyright laws.

---

## <a id="roadmap"></a>Roadmap

Coming up — roughly in priority order:

| Feature    | Description    |
| ---------------- | ---------------- |
| **Batch URL input** | Paste multiple URLs at once and run them in one go |
| **Custom filename templates** | Name files by title, uploader, date, resolution — with live preview |
| **Scheduled downloads** | Start a queue at a set time (overnight runs) |
| **Speed limits** | Cap bandwidth so downloads don't saturate your connection |
| **Clip trimming** | Download only a segment by start/end time |

Have a feature in mind? [Open a request](../../issues) — community input shapes priority.

---

## <a id="tech"></a>Built with

<details>
<summary><strong>Stack</strong></summary>

- **Electron** — cross-platform desktop shell
- **React 19** + **TypeScript** — UI
- **Tailwind CSS v4** — styling
- **Zustand** — state management
- **yt-dlp** + **ffmpeg** — download and mux engine (yt-dlp fetched at runtime; ffmpeg/ffprobe bundled at build time)
- **Vite** + **electron-vite** — build tooling
- **Vitest** + **Playwright** — unit and end-to-end tests

</details>

<details>
<summary><strong>Build from source</strong></summary>

### Prerequisites — all platforms

| Tool | Version | Install |
| ---- | ------- | ------- |
| Git  | any     | [git-scm.com](https://git-scm.com) |
| Bun  | latest  | see per-OS below |

### Windows

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

No native build tools required — the project has no native Node addons.

### macOS

```bash
xcode-select --install
curl -fsSL https://bun.sh/install | bash
```

### Linux (Ubuntu / Debian)

```bash
curl -fsSL https://bun.sh/install | bash

# Electron runtime deps
sudo apt install -y libgtk-3-0 libnss3 libasound2t64

# E2E tests only (Electron needs a display)
sudo apt install -y xvfb
```

### Clone & run

```bash
git clone https://github.com/antonio-orionus/Arroxy
cd arroxy
bun install
bun run dev          # hot-reload dev build
```

### Build a distributable

```bash
bun run build        # typecheck + compile
bun run dist         # package for current OS
bun run dist:win     # cross-compile Windows portable exe
```

> yt-dlp is fetched from GitHub on first launch and cached in your app data folder. ffmpeg and ffprobe are bundled with every Arroxy release.

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

## Terms of use

Arroxy is a tool for personal, private use only. You are solely responsible for ensuring your downloads comply with YouTube's [Terms of Service](https://www.youtube.com/t/terms) and the copyright laws of your jurisdiction. Do not use Arroxy to download, reproduce, or distribute content you do not have the right to use. The developers are not liable for any misuse.

<div align="center">
  <sub>MIT License · Made with care by <a href="https://x.com/OrionusAI">@OrionusAI</a></sub>
</div>
