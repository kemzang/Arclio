# Changelog

All notable user-facing changes to Arroxy.

This file is the source of truth for release notes. The release workflow reads the section matching the pushed tag (e.g. `## 0.3.5-beta.1`) and posts it as the GitHub Release body. Auto-generated "What's Changed" PR list + Full Changelog link is appended automatically.

When cutting a release, add a new section at the top in the same shape as the most recent entry.

---

## 0.3.10

This release makes Arroxy faster for everyday grabbing, better for playlist triage, and more helpful when yt-dlp needs repair.

## Highlights

### Faster Ways To Start Downloads

Quick downloads are now easier to launch when you already know what you want.

- A new clipboard quick-download flow can pick up a copied URL and move it toward download without forcing you through the full wizard every time.
- Bulk URL downloads let you paste multiple links, hydrate their metadata, and send them into the queue together.
- Startup clipboard prompts are now gated more carefully, so Arroxy avoids interrupting launch unless there is a real action to confirm.

### Playlist Scope Filters

Large playlist and channel runs now have better controls for deciding what should be probed and queued.

- Playlist scope filters let you narrow work before the item list is built.
- The playlist picker keeps scope, limit, and retry state aligned when reloading results.
- Mock scenarios and regression coverage were expanded around playlist limits, scope changes, and bulk submission paths.

### yt-dlp Repair From Package Managers

When a local yt-dlp install is stale or broken, Arroxy can now guide repair through supported package-manager paths.

- The repair panel can surface package-manager repair actions for Homebrew and Winget installs.
- Binary diagnostics record the repair path more clearly, making dependency issues easier to understand.
- Startup repair and dependency checks have broader automated coverage.

### Release Pipeline Hardening

The release workflow now publishes with stronger provenance and safer automation.

- Release assets are covered by GitHub artifact attestations.
- GitHub Actions workflows were hardened and the release runbook was refreshed.
- The README feature roadmap was updated across localized copies.

---

## 0.3.9

This release fixes the Intel Mac packaging issue and makes SponsorBlock outages non-fatal during downloads.

## Highlights

### Intel Mac Builds Include FFmpeg Again

The previous Intel macOS DMG could open, but it did not include the embedded `ffmpeg` and `ffprobe` binaries. Arroxy would then show `ARX-004` and ask the user to pick working copies manually.

- Intel macOS packaging now resolves the requested build architecture correctly instead of falling back to the Apple Silicon runner architecture.
- The build now fails early if either embedded FFmpeg binary is missing, so a broken DMG cannot be published silently.
- The packaging logic has targeted test coverage for electron-builder's string and numeric architecture values.

### SponsorBlock Outages No Longer Stop Downloads

When SponsorBlock is enabled, a temporary SponsorBlock API outage should not make the whole download fail.

- Arroxy now treats SponsorBlock lookup failures as a skipped SponsorBlock step and continues the download.
- The queue still records the skip state, so the download status remains honest without blocking the file.

---

## 0.3.8

This is a small stability release for Intel Mac users.

## Highlights

### Intel Mac Builds Include FFmpeg Again

The previous Intel macOS DMG could open, but it did not include the embedded `ffmpeg` and `ffprobe` binaries. Arroxy would then show `ARX-004` and ask the user to pick working copies manually.

- Intel macOS packaging now resolves the requested build architecture correctly instead of falling back to the Apple Silicon runner architecture.
- The build now fails early if either embedded FFmpeg binary is missing, so a broken DMG cannot be published silently.
- The packaging logic has targeted test coverage for electron-builder's string and numeric architecture values.

---

## 0.3.7

This release turns playlist handling into a much more deliberate workflow: pick the right batch format, scan only as much as you need, skip files you already have, and keep the output folder organized as the playlist grows.

## Highlights

### Playlist Quality Is Now a Real Picker
Playlist downloads no longer ask you to choose from a short list of fixed presets. The batch quality step now lets you choose the media type, quality ceiling, codec preference, audio format, and bitrate.

- Video playlists can use best available codecs or prefer MP4 / H.264 for broader player compatibility.
- Audio playlists can stay native or convert to MP3, M4A, or Opus with selectable bitrates.
- Each playlist item resolves the chosen tier independently, so mixed-resolution playlists download cleanly instead of failing on one awkward entry.
- Mixed YouTube links (`video + playlist`) now explain the choice more clearly: download only the clicked video or open the playlist picker.

### Playlist Sync Keeps Folders Tidy
Arroxy can now compare a probed playlist against the local destination folder before queueing work.

- Playlist files use stable names with the video ID included, which makes repeat runs and title changes much less messy.
- The playlist picker scans the output folder automatically and marks videos that are already downloaded.
- "Apply sync" deselects already-downloaded videos so only new items get queued.
- You can change the playlist folder from the sync alert and Arroxy keeps the output settings aligned with that folder.
- Playlist downloads can generate an `.m3u` file in playlist order. The file is rebuilt as items finish, so partial or resumed playlist runs still leave a useful playlist behind.

### Scan Limits And Gentle Downloading
Large playlists, channels, and search results now have explicit controls instead of hidden limits.

- The URL step has a playlist scan limit picker with presets and custom values from 1 to 5000 items.
- If a playlist is capped by the current scan limit, Arroxy shows an alert right in the item picker and lets you raise the limit and re-scan.
- Network pacing presets now live in Advanced settings: Off, Balanced, Careful, and Custom.
- Balanced is the new default: it adds small request/media/subtitle waits and uses one fragment connection to reduce host pressure on heavy playlist runs.
- The queue's old fixed 3-second pause between jobs is now shorter, so normal queues feel less sluggish while pacing is handled inside yt-dlp where it matters.

### More Helpful Download Feedback
Several failure and progress cases should now be less confusing.

- DRM-protected videos and login-required videos now get clearer error messages.
- SponsorBlock lookup and retry states are shown in the queue instead of looking like a stalled download.
- HLS fragment bootstrap lines no longer jump running jobs to 100% before the file is actually done.
- Resuming a paused job whose temp folder disappeared now restarts cleanly instead of trying to reuse a missing path.
- Cancelling during the subtitle phase now exits as a cancellation instead of falling through as a subtitle failure.

### Smaller Workflow Improvements
- One-off downloads can include the video ID in the filename by default, with a toggle in Advanced settings.
- URL cleanup now uses the maintained `@url-sanitize` ClearURLs catalog and still strips pasted whitespace from wrapped links.
- Cookies setup links are easier to reach from Advanced settings.
- Output sidecar options now include `.m3u` playlist generation alongside description and thumbnail files.

### Maintenance
- Error classification now uses the shared `ytdlp-errors` package instead of a local classifier.
- Probe errors now flow through a discriminated union, which makes failure handling easier to reason about.
- The browser-mock dev mode gained a scenario gallery, test knobs, and browser coverage for playlist states.
- CI and dependency maintenance landed across Bun, Node, Vitest matcher types, setup-node, setup-bun, CodeRabbit, and release notifications.

---

## 0.3.7-beta.1

This beta makes playlist downloads feel more intentional: better presets, cleaner folders, and fewer surprises when Arroxy has to slow itself down for a host.

## Highlights

### Playlist Presets Are More Useful
Playlist preset downloads now do a better job matching the output you asked for.

- Presets apply during playlist probing without wiping out retry state.
- Mixed playlist flows keep format choices and output preferences lined up more reliably.
- Playlist item handling has been tightened so large queues behave more predictably from probe through submit.

### Cleaner Playlist Output
Playlist downloads now have better tools for keeping a folder organized.

- Stable playlist filenames make repeated runs less messy.
- Sync-with-folder can skip items that already exist locally.
- M3U playlist generation adds a lightweight way to preserve playlist order for external players.

### Network Pacing Controls
Arroxy now has configurable network pacing for playlist-heavy workflows.

- The default pacing preset is now balanced.
- Inter-job sleep is shorter, so safe pacing feels less sluggish.
- Playlist probe limits are configurable for users who need to trade speed against host pressure.

### Maintenance
- Error classification now uses the shared `ytdlp-errors` package instead of a local classifier.
- Probe errors now flow through a discriminated union, which makes failure handling easier to reason about.
- CI and dependency maintenance landed across Bun, Node, Vitest matcher types, and repository review tooling.

---

## 0.3.6

This release is all about big playlists. If you ever pasted a 290-video URL and watched Arroxy slowly chew through it while the UI lagged behind, this one is for you.

## Highlights

### Large playlists no longer drag the UI

Queueing hundreds of items used to push the renderer multiple seconds behind the actual download state. With a 290-video playlist, the drawer would still show "downloading Ep. 4" while yt-dlp was already on Ep. 7.

- Progress events from yt-dlp are now coalesced on the main side at 10 Hz per job. Transitions (started, completed, merging, failed) still fire immediately — only the lossy "downloading X.X%" stream is throttled.
- Queue updates arriving in the renderer are now batched per animation frame. Updates, additions, and removals coming in the same frame merge into a single state mutation and one React commit.
- The queue drawer is now virtualized. Only the rows in view (plus a small over-scroll buffer) mount in the DOM. Drawer scroll stays smooth at any queue size.

### "Cancel all" + "Clear" go from minutes to a blink

Cancelling and clearing a 290-item queue used to take **a full minute** in the worst case. Each item triggered its own disk write and its own re-render.

- Bulk cancel and bulk clear now persist the queue file once at the end of the sweep, not per item.
- The renderer applies all the removals in one pass per animation frame.

End-to-end, clearing a 290-item queue is now under a second.

### Full YouTube playlist enumeration

Probing a YouTube playlist now returns **all** entries (up to the configured cap), not the first 100.

- We were sending a `visitor_data` token alongside the YouTube tab extractor probe, which silently capped tab pagination at one innertube page (100 entries) regardless of `--playlist-end`. Symptom: "can't fetch more than 100 videos."
- Probes no longer need PoT/visitor_data — they only fetch metadata, not streaming URLs — so we skip that path entirely for probes. Non-web clients (android/ios) provide the format JSON without it.

### Smarter URL paste

URLs pasted from word-wrapped terminals, chat bubbles, or PDF viewers often arrive with a newline or stray space mid-link. Arroxy now cleans those up before parsing.

- A line break injected mid-playlist-ID no longer turns into `%20` and mangles the URL.
- Tabs, CRLFs, and literal spaces all get stripped at paste time.
- Already-encoded `%20` sequences (legitimately part of a path) are left alone.

### No more accidental double-submit

Submitting a 290-entry playlist takes a perceptible moment while Arroxy builds and ships the queue items. Mash the button twice and you used to end up with duplicates.

- The "Add to queue" and "Pull it" buttons are now disabled while the submission is in flight.
- A guard at the function level catches double-fires from keyboard shortcuts too.

### Smaller stuff
- Error messages in the queue drawer now stay on a single line and reveal the full text in a tooltip on hover. Keeps the queue density tight even when something blows up verbosely.

### Maintenance
- Internal IPC seam now has a single chokepoint for the bulk-write guard, so future bulk operations (think: future import-from-file) get the perf optimization for free.
- Dropped the shadcn `ScrollArea` wrapper specifically for the queue drawer — the virtualizer needed direct access to the scroll element. Other ScrollArea usages elsewhere in the app are unchanged.

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
