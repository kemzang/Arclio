# Changelog

All notable user-facing changes to Arroxy.

This file is the source of truth for release notes. The release workflow reads the section matching the pushed tag (e.g. `## 0.3.5-beta.1`) and posts it as the GitHub Release body. Auto-generated "What's Changed" PR list + Full Changelog link is appended automatically.

When cutting a release, add a new section at the top in the same shape as the most recent entry.

---

## 0.3.5

This release tightens resume reliability for tricky sites and adds the speed-limit control a lot of you have asked for.

## Highlights

### Per-Job Speed Limits
You can now cap how fast Arroxy downloads, so background jobs do not steal your whole connection.

- New rate-limit picker in the wizard and in the queue drawer, with presets like `500K`, `2M`, `5M` plus a custom value.
- Limits are validated before they are sent to yt-dlp, so typos do not silently get ignored.
- A small inline hint explains that an in-flight download needs Pause + Resume to pick up a new limit.

### More Trustworthy Resume
Big or fiddly downloads now survive interruptions a lot better.

- Resumed downloads reuse cached metadata from the original spawn instead of re-extracting on every retry. Sites with short-lived signed URLs, shifting HLS/DASH format IDs, or session-bound cookies (PornHub being a notable one) no longer trip the "Requested format is not available" error on resume.
- The fix is invisible: Arroxy writes a small info file into the preserved temp folder on the first run, and the next spawn picks it up automatically.

### Smoother Queue
A big rewrite under the hood of the download queue makes state transitions cleaner and progress reporting more accurate.

- The ETA (estimated time left) shown on active downloads is finally honest — it now reflects current throughput instead of an averaged-since-start figure.
- Internal telemetry around the queue was tightened so error categories and lifecycle events line up consistently.
- Small visual polish on the queue drawer, queue items, and the confirm + URL-input wizard steps.

### Security
- Closed two high-severity advisories pulled in transitively through `ajv` by overriding `fast-uri` to a patched version. No user action needed.

### Maintenance
- Dependency refresh across the board: Electron, electron-builder, i18next, Tailwind Merge, Playwright, Vite, Vitest, plus a sweep of GitHub Actions versions.
- The marketing site moved to its own repository ([`antonio-orionus/arroxy-web`](https://github.com/antonio-orionus/arroxy-web)); the app repo is leaner now.

---

## 0.3.5-beta.1

This beta tightens resume reliability for tricky sites and adds the speed-limit control a lot of you have asked for.

## Highlights

### Per-Job Speed Limits
You can now cap how fast Arroxy downloads, so background jobs do not steal your whole connection.

- New rate-limit picker in the wizard and in the queue drawer, with presets like `500K`, `2M`, `5M` plus a custom value.
- Limits are validated before they are sent to yt-dlp, so typos do not silently get ignored.
- A small inline hint explains that an in-flight download needs Pause + Resume to pick up a new limit.

### More Trustworthy Resume
Big or fiddly downloads now survive interruptions a lot better.

- Resumed downloads reuse cached metadata from the original spawn instead of re-extracting on every retry. Sites with short-lived signed URLs, shifting HLS/DASH format IDs, or session-bound cookies (PornHub being a notable one) no longer trip the "Requested format is not available" error on resume.
- The fix is invisible: Arroxy writes a small info file into the preserved temp folder on the first run, and the next spawn picks it up automatically.

### Smoother Queue
A big rewrite under the hood of the download queue makes state transitions cleaner and progress reporting more accurate.

- The ETA (estimated time left) shown on active downloads is finally honest — it now reflects current throughput instead of an averaged-since-start figure.
- Internal telemetry around the queue was tightened so error categories and lifecycle events line up consistently.
- Small visual polish on the queue drawer, queue items, and the confirm + URL-input wizard steps.

### Security
- Closed two high-severity advisories pulled in transitively through `ajv` by overriding `fast-uri` to a patched version. No user action needed.

### Maintenance
- Dependency refresh across the board: Electron, electron-builder, i18next, Tailwind Merge, Playwright, Vite, Vitest, plus a sweep of GitHub Actions versions.
- The marketing site moved to its own repository ([`antonio-orionus/arroxy-web`](https://github.com/antonio-orionus/arroxy-web)); the app repo is leaner now.

---

## 0.3.4

Arroxy 0.3.4 is the release where Arroxy grows up from a YouTube-focused downloader into a much wider, smoother tool for everyday saves. Paste a link, pick what you want, and let the queue do the boring parts.

## Highlights

### YouTube + 2000+ Sites
Arroxy now works with the wider yt-dlp ecosystem, not just YouTube. That means links from Vimeo, Twitch, Reddit, SoundCloud, Bandcamp, and thousands of other supported sites can go through the same friendly wizard.

- Paste any supported video or audio link, including links picked up by clipboard watch.
- Music-first sites open in the right flow automatically, so you do not have to fight empty video options.
- Built-in-audio formats now default to "Keep as-is" instead of accidentally adding duplicate audio.
- YouTube channel links, playlists, Shorts, Music, and mixed video/playlist URLs are handled more deliberately.
- Tracker-heavy URLs are cleaned before probing, so shared links are less messy.

### Faster Wizard Flow
Getting to the download button takes fewer clicks now.

- New "Skip to confirm" button lets you jump straight from format selection to the final screen using your saved preferences.
- Subtitle selection is easier to skip when you just want the video.
- Saved YouTube preferences stay scoped to YouTube, so choices from one site do not leak into another.
- The app is clearer when a site requires cookies, sign-in, or a different link.

### Better Queue Control
The queue is easier to pause, resume, and trust.

- Pause all active downloads from the drawer header.
- Resume paused downloads directly from the drawer when you are ready.
- Quit dialog now offers "Pause Downloads & Quit," so closing the app does not have to mean throwing progress away.
- Paused downloads keep more resume context, making interrupted video downloads more dependable.
- Queue state now lives in the main process, which makes progress, pause, cancel, retry, and restart behavior steadier.

### More Reliable Downloads
A lot of this release is about making failure less mysterious.

- Large or unstable downloads get stronger retry behavior for broken chunks and interrupted streams.
- Low disk space is detected and explained before it turns into a confusing failure.
- Error messages are clearer for unsupported URLs, rate limits, geo blocks, network failures, sign-in/cookie problems, post-processing failures, and yt-dlp parser drift.
- Non-YouTube sites skip YouTube-only token work, which keeps probes lighter and less noisy.

### Platform Fixes
This release also tightens install and startup behavior across desktop platforms.

- macOS packaging was hardened, especially around Apple Silicon builds and bundled media tools.
- Windows startup and packaged-build behavior got more resilient, with extra checks for cold-start failures.
- Release automation now catches more broken builds before they reach users.

### Nice New Touches
- New About dialog with quick links and license details.
- New Share dialog, because Arroxy is free and open-source and a little easier to pass along now.
- Small UI polish across the drawer, wizard, update banner, dialogs, and startup flow.
