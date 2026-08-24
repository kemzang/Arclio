# Product

## Register

product

## Users

People who pull video, audio, music, playlists, channels, subtitles, books and comics off the internet and want to **keep and re-find them** — not just save a file and lose it in `~/Downloads`. They span casual users (grab one song as MP3, watch it offline later) and collectors (4K HDR, channel archives, tagged and sorted libraries spanning thousands of items).

Most arrive non-technical and intimidated by `yt-dlp` on the command line; the app is their reason for not touching a terminal. They use it on their own desktop (Windows / macOS / Linux), offline-capable, with no account required and no usage limits. The job to be done: **get media in, and be able to find it again a year later.**

## Product Purpose

Arclio is a local-first personal media library with a first-class downloader built in. Think Calibre for everything you watch and listen to.

The downloader is the **intake** — the thing that fills the library. It is a free, open-source GUI over `yt-dlp` + `ffmpeg`, and it exists to make the most capable downloader on the internet usable by people who would never run it from a shell, while not dumbing it down for the people who would. The library is the **product** — collections, tags, favorites, history, search, thumbnails, the player and the viewer are what makes a downloaded file still useful next month.

Success looks like: a first-time user pastes a link and gets a correct download with zero config; a power user reaches 4K/HDR, audio-only conversion, SponsorBlock, embedded vs sidecar subtitles, and playlist controls without fighting the UI; and both of them can open the app a year later and actually find what they saved.

It runs entirely on the user's machine, ships no telemetry-by-default dark patterns, and stays out of the way.

## Free and Pro

Arclio is open-core. The boundary is not negotiable and it is not arbitrary:

**Free forever, no account, works offline** — downloading, formats, subtitles, SponsorBlock, the queue, the local library, collections, tags, favorites, history, search, the converter, the player, the viewer, and import/export. Bringing your own AI key is free too.

**Pro** — only what genuinely runs on Arclio's servers: library sync across devices, cloud backup, public share links, and hosted AI. These cost money to operate, so they cost money to use.

Two rules follow from this, and they are constraints on every change:

- **Never gate the downloader.** It is what the competition gives away, and charging for the act of downloading is what turns a tool into a target.
- **Never gate data portability.** Import/export stays free. Locking a user's own library behind a subscription is the dark pattern this product exists to be the opposite of.

Arclio never hosts users' media files. Sync and backup carry **library metadata only** — what you saved, how you tagged it, where it lives on your disk.

## Brand Personality

Friendly, playful, approachable. Voice is warm and plain-spoken, never corporate: action labels read like a person talking ("Pull it! ↓", "Fetch formats →"), not "Submit" / "Execute". Mascot-forward and a little fun, but the playfulness never costs the user clarity or trust. Underneath the friendly surface is quiet competence: the hard stuff (bot-protection cycles, format negotiation, codec coherence, library indexing) is handled so well the user never sees it. Emotional goals: confidence ("this just works"), relief ("I didn't need the terminal"), and a small bit of delight.

## Anti-references

- **Sketchy downloader sites / freeware.** Ad-choked, fake-"Download" buttons, malware-adjacent, upsell-laden. Arclio's entire positioning ("no ads, no bloat, no upsells") is the opposite. The UI must read as trustworthy and clean, never like the thing it replaces.
- **Raw CLI / yt-dlp flag soup.** Don't expose argument complexity directly or make the surface feel power-user-only. The capability is there; the intimidation is not.
- **Generic SaaS dashboard.** No cookie-cutter card grids, no hero-metric template, no AI-default app shell. This is a focused desktop tool, not a dashboard.
- **Bloated legacy media suites.** Not heavy, not modal-stacked, not cluttered converter/burner UIs from a decade ago.
- **Freemium nag-ware.** No countdown timers, no "you have 3 downloads left", no feature teased behind a lock icon on a screen the free user uses daily. If a free user never pays, the app they have must still feel whole.

## Design Principles

- **The library is the destination.** Paste → probe → choose → queue → file → **library** is the spine. A download that lands in the library correctly tagged and thumbnailed is the finished job; a file on disk is only half of it.
- **Friendly front, expert core.** The default path is a calm linear wizard a non-technical user can finish without thinking; depth (formats, SponsorBlock, subtitle modes, diagnostics) is reachable but never in the newcomer's face.
- **Earn trust on every surface.** Honest progress, honest errors (localized, categorized, not raw stderr dumps), no dark patterns, no fake urgency. The UI is the proof that this is the safe, clean alternative.
- **Local-first and resilient.** Works offline, survives restarts (persisted queue, resumable paused jobs), degrades softly (subtitle failure keeps the video; an unreadable PDF still gets a labelled thumbnail). Never lose a user's in-flight work, and never lose their library.
- **Inclusive by default.** 21 languages including RTL, reduced-motion honored, AA contrast. Internationalization and accessibility are constraints on every change, not a later pass.
- **Validate against real user actions.** Product workflows are proven through the layer that can exercise them for real (Fixture Product E2E), not through isolated component states.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Body text ≥4.5:1, large text ≥3:1, verified against both light and dark themes. Full RTL support (Arabic, Urdu, Pashto, and others among the 21 supported locales) — layout, wizard step animations, and queue card entrances all have RTL variants. `prefers-reduced-motion` must have a real alternative (crossfade / instant) for every animation. Status must never rely on color alone (the `done` / `paused` / `error` palette pairs with icons and text). i18n is enforced in CI (`i18n-contract.test.ts`); every error kind and status key has a string in every locale.
