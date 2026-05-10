# Domain Glossary

This file is the canonical naming reference for Arroxy's architecture. New
modules / abstractions get an entry here so future maintainers (and AI
assistants) reuse the existing vocabulary instead of inventing parallel
ones. Update inline when extracting modules or renaming concepts.

## Job

A user-initiated download. Identified by `DownloadJob.id` (UUID). Lifecycle:
created in `DownloadService.start`, runs through `Phase`s, finalized via
`JobLifecycle.finalize`. **Where defined:** `src/shared/types.ts`
(`DownloadJob`).

## ActiveJob

In-flight download record holding `job`, `input`, `signal`/`controller`,
`disposables`, and mutable progress state. Aliased as `ActiveDownload` for
back-compat. **How it's used:** `DownloadService` creates one, registers
cleanup disposables as resources are acquired (tempDir, yt-dlp child,
ffmpeg child), passes it to `PhaseExecutor`. **Where defined:**
`src/main/services/phases/types.ts`.

## Phase

Pure step in the download pipeline (Preflight → Video → SidecarSubs /
SubtitleOnly). Inputs `PhaseContext`, returns `PhaseOutcome`
(`continue`/`completed`/`soft-failed`/`hard-failed`/`cancelled`/`paused`).
**How it's used:** `phasesFor(input)` builds the strategy chain;
`PhaseExecutor.run` drives the loop. Phases push disposables instead of
calling cleanup directly. **Where defined:**
`src/main/services/phases/types.ts`.

## Disposable

A teardown callback (`() => Promise<void> | void`) registered against an
`ActiveJob` for LIFO drain on finalize. Replaces ad-hoc per-cleanup-path
code. **How it's used:** `ctx.register(d)` from inside a phase pushes onto
`active.disposables`; `JobLifecycle.drain` empties the array in reverse
order with try/catch per entry. **Where defined:**
`src/main/services/phases/types.ts` (the `disposables` field) +
`JobLifecycle.drain`.

## JobLifecycle

Single-source coordinator for the end-of-job sequence: drain disposables,
emit analytics (`download_finished`/`_cancelled`/`_failed`), persist to
`RecentJobsStore`. **Where defined:** `src/main/services/JobLifecycle.ts`.

## QueueEvent

Closed union of state-change signals over a `QueueItem`: `started`,
`progress`, `paused`, `resumed`, `failed`, `completed`, `cancelled`,
`retry-reset`. Drives the pure `transition` function.
**Where defined:** `src/shared/queueTransition.ts`.

## transition

Pure exhaustive `(QueueItem, QueueEvent) → QueueItem` switch. No I/O.
The switch becomes a compile error if a new event kind is added without
a case. `illegalTransition` is the companion guard for stale signals
(progress/completed/failed on a cancelled item, anything on a done item
except retry).
**Where defined:** `src/shared/queueTransition.ts`.

## YtDlpErrorKind

Closed enum of yt-dlp failure categories: `botBlock`, `ipBlock`,
`rateLimit`, `ageRestricted`, `unavailable`, `geoBlocked`,
`outOfDiskSpace`, `chunkTransferFailure`, `postprocessFailure`,
`unsupportedUrl`, `parse`, `network`, `unknown`. Drives both analytics
(`error_category` label) and i18n key lookup.
**How it's used:** every yt-dlp failure plumbs through
`classifyYtDlpStderr(stderr)` to produce `{ kind, raw }`; UI keys i18n
strings off `kind`, falls through to `raw` for `'unknown'`. ProbeService
adds `unsupportedUrl` recognition for the pre-extraction signal yt-dlp
emits before any pattern would match.
**Where defined:** `src/shared/ytdlp/errors.ts`.

## LocalizedError

`{ kind: YtDlpErrorKind; raw: string }`. Always populated; `'unknown'`
covers the unmatched-stderr fallback. The renderer keys i18n strings off
`kind` and renders `raw` verbatim for `unknown`. Replaces the old
`{ key, rawMessage? }` shape; QueueStore + RecentJobsStore migrate
beta-shape entries on load. **Where defined:** `src/shared/i18n/types.ts`.

## BinaryDownloader

Plumbing for HTTP fetch with range-resume, checksum verification, and
zip extraction with symlink-safety. Exposes
`parseShaLine`/`parseStandaloneSha256`/`parsePowerShellFileHash`,
`sha256ForFile`, `downloadText`, `downloadFile`, `classifyDownloadError`,
plus the shared `HTTP_HEADERS`/`HTTP_RETRY`/`HTTP_TIMEOUT` got config.
Pure I/O; no policy. **How it's used:** `BinaryManager`'s strategy chain
calls it for managed-binary fetches.
**Where defined:** `src/main/services/binary/BinaryDownloader.ts`.

## BinaryProbe

Spawns a binary with `--version` (or `-version`), parses stdout/stderr,
classifies spawn failures (ENOENT/EACCES/ETIMEDOUT/SmartScreen). No
policy; no version comparison. Companion `whereOnPath` discovers
candidate binaries via `where`/`which`.
**Where defined:** `src/main/services/binary/BinaryProbe.ts`.

## BinaryManager

Resolver facade orchestrating BinaryDownloader + BinaryProbe behind the
strategy chain (manualOverride → envOverride → managed → systemPath).
Owns version-comparison policy, accumulates `DependencyAttempt[]` on the
chain, returns a `DependencyDiagnostic` per binary. Public class API
preserved for callers (`YtDlp`, `WarmupService`, `diagnosticsHandlers`).
**Where defined:** `src/main/services/BinaryManager.ts`.

## Diagnostic

`DependencyAttempt[]` + final `DependencyDiagnostic` shape — what attempts
were made, which succeeded, what failed. Each failure carries a stable
`FAILURE_CODE` (ARX-NNN) so users can search the repair UI codes
language-independently.
**Where defined:** `src/shared/types.ts` (`DependencyDiagnostic`,
`DependencyAttempt`, `DependencyFailure`, `FAILURE_CODE`).

## NavContext

Inputs to `nextStep`: extends `StepContext` (mode, preset, extractor,
hasSubtitles) with `wizardSubtitleSkipped` and `retryOrigin` so re-entry
from the skip / error step lands on the right destination instead of
bouncing back into subtitles.
**Where defined:** `src/renderer/src/components/wizard/nextStep.ts`.

## FormatPicker

Two parts in `src/renderer/src/store/wizard/formatPicker.ts`:

- **Pure helpers** — `applyPreset`, `restoreFormatSelection`,
  `restoreSubtitleSelection`. Inputs `FormatOption[]` + `AppSettings`;
  outputs plain selection objects. No I/O.
- **Slice** — `createFormatPickerSlice` owns `wizardFormats`,
  `selectedVideoFormatId`, `audioSelection`, `lastConvertBitrate`,
  `activePreset`, plus the subtitle pools (`wizardSubtitles`,
  `wizardAutomaticCaptions`, `wizardSubtitleLanguages`,
  `wizardSubtitleSkipped`, `wizardSubtitleMode`, `wizardSubtitleFormat`)
  and their setters. The probe pipeline writes the format/subtitle pools
  via shared `set()` after probe success.

## ProbeOrchestrator

Renderer slice that owns the URL → probe → format-step pipeline plus the
wizard step graph and playlist enumeration. Holds `wizardStep`,
`wizardUrl`, `wizardExtractor`, `wizardError`, the playlist fields, and
the navigation actions (`advance`/`back`/`skipSubtitles`/`reset`).
Cross-slice writes through `set()` are intentional — probe success
populates format pools, subtitle pools, output prefs, and dialog flags
in one transition. **Where defined:**
`src/renderer/src/store/wizard/probeOrchestrator.ts`.

## OutputConfig

Renderer slice owning "where + how the file lands": `wizardOutputDir`,
`wizardSubfolderEnabled`/`Name`, SponsorBlock mode + categories, embed
flags. **Where defined:**
`src/renderer/src/store/wizard/outputConfig.ts`.

## WizardDialogs

Renderer slice for transient modal flags: `mixedUrlPromptOpen`,
`mixedUrlPending`, `advancedAutoOpen`, `cookiesConfigDialogIssue`. All
session-only; reset to defaults by `WizardCommands.resetAll`.
**Where defined:**
`src/renderer/src/store/wizard/wizardDialogs.ts`.

## WizardCommands

Cross-slice orchestrator helpers — currently `resetAll(set)` (applied
via the `reset` action on `ProbeOrchestrator`). Future deep-link /
snapshot replay code lands here.
**Where defined:** `src/renderer/src/store/wizard/commands.ts`.

## FormatPrefsPersistence

Bridge between wizard state and SettingsStore. Reads format / audio /
subtitle / output / embed / sponsorblock fields across the four wizard
slices and writes the right shape into the `common` / `single` /
`playlist` Settings buckets via IPC. Lives in the wizard module (not
QueueSlice) because the inputs are wizard-owned, even though the firing
point is queue-submit / start / retry. **Where defined:**
`src/renderer/src/store/wizard/persistFormatPrefs.ts`.

---

## Conventions

- New shared modules go under `src/shared/` so renderer + main both
  import without IPC. Modules with electron / node-only deps stay in
  `src/main/services/` (or `src/renderer/...`) and surface their seam
  via re-exports of pure helpers.
- Pure helpers — those without I/O — should live in their own module
  with a fixture-driven test alongside. Pattern: see
  `tests/fixtures/yt-dlp-stderr/<kind>/*.txt` +
  `tests/unit/yt-dlp-errors.test.ts`.
- Classification regexes / closed enums must stay synchronized with the
  i18n locale entries — the `i18n-contract.test.ts` suite enforces that
  every locale has a string for every `YtDlpErrorKind` and `StatusKey`.
