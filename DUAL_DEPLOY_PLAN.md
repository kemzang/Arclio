# Arclio Dual-Deploy Architecture Plan

> Status: design proposal. Not yet executed.
> Author/owner: Antonio (OrionusAI@proton.me).
> Last revised: 2026-05-26.

## 1. Goal

Ship Arclio in two distribution modes from one codebase:

1. **Electron desktop app** (current): packaged for Windows/macOS/Linux via electron-builder, distributed through Scoop/Homebrew/Winget/Flatpak/GitHub Releases.
2. **Self-hosted server**: single docker image (`ghcr.io/antonio-orionus/arclio:latest`) deployable via `docker compose up`, fits homelab stacks alongside *arr suite, Traefik/Caddy/nginx-proxy-manager, Portainer, etc.

Constraint: **no logic duplication**. ~95% of code lives in shared `core/` + `shared/` consumed by both shells. Each shell is a thin (~15-20 file) glue layer.

## 2. Current State (as of this plan)

### What already helps
- `src/shared/` is pure: types, schemas, `transition()` state machine, i18n, error classification, progress format. Zero electron/node-only deps. Portable as-is.
- `src/main/services/` is mostly node + `child_process`. Electron API surface confined to boot wiring, BrowserWindow PoT scrape, `app.getPath()` calls, `electron-log`, `electron-updater`, native notifications.
- IPC bridges (`QueueEventBridge`, `DownloadEventBridge`) are already a command/event protocol. Renderer is read-only projection. Same shape maps cleanly to HTTP + WebSocket.
- Phase pipeline (`Preflight → Video → SidecarSubs / SubtitleOnly`) abstracts "spawn a binary, parse output" — extensible to non-yt-dlp backends later.
- Persistence is JSON files (`queue.json`, settings). Easy swap to SQLite.

### What ties code to Electron today
- `electron-log` imported across services.
- `app.getPath('userData' | 'downloads' | 'logs')` for path resolution.
- `BrowserWindow` (HiddenWindow) for PoT token minting in `TokenService.ts`.
- Native `Notification`, system tray, `ClipboardWatcher`.
- `electron-updater` v6.
- `webContents.send` for event projection.
- `ipcMain.handle` for command dispatch.

### Hardcoded couplings (not pluggable yet)
- yt-dlp invocation in `VideoPhase` (no `Downloader` interface).
- ffmpeg-only post-processing in `SidecarSubsPhase`.
- yt-dlp stderr regex parsing in `progressParser.ts`.
- Resume across restart reads `_arclio.info.json` (yt-dlp-specific cache).

## 3. Architecture: Hexagonal (Ports & Adapters)

### Cardinal rule

```
core/  → imports  shared/  only
shell/ → imports  core/, shared/, runtime-specific deps (electron OR hono/ws/etc.)
shared/→ imports  nothing app-specific (no node, no electron, no react)
```

Enforced at compile time, not by convention:

1. **`tsconfig.core.json`** — `"types": []`, no DOM lib, path aliases restrict to `@shared/*` only.
2. **ESLint `no-restricted-imports`** on `src/core/**` blocks `electron`, `electron-*`, `hono`, `better-sqlite3`, `react`, `@renderer/*`.
3. **ESLint `no-restricted-globals`** in core blocks `process`, `console`, `Date`, `crypto` — forces port usage for time/IDs/env.
4. **`dependency-cruiser`** rule file pinning layer direction (`shared ← core ← shell`).
5. **`madge --circular`** already in `bun run check`.
6. **CI grep gate**: server bundle must not contain `require('electron')`.

### Folder layout (target)

```
src/
  shared/                       portable (today's content)
  core/                         NEW: env-agnostic daemon (extracted from src/main/services/)
    services/                   QueueService, DownloadService, ProbeService, YtDlp, BinaryManager
    phases/                     PhaseExecutor, PreflightPhase, VideoPhase, SidecarSubsPhase, SubtitleOnlyPhase
    stores/                     QueueStore, SettingsStore, RecentJobsStore (SQLite-backed)
    ports/                      interfaces only (Paths, Logger, PotProvider, CookieResolver, Notifier, EventBus, Clock)
    factory/                    createCore(ports) composition root
  shell/
    electron/                   NEW: was src/main/
      main.ts                   boot core with electron adapters, create BrowserWindow
      preload.ts                unchanged
      adapters/                 ElectronPaths, ElectronLogger, ElectronPotProvider, ElectronCookieResolver, ElectronNotifier, IpcEventBus
      ipc/                      tRPC IPC link handlers (generated from contract)
      tray.ts, clipboard.ts, updater.ts   electron-only features
    server/                     NEW: HTTP/WS daemon
      server.ts                 Hono app boot
      adapters/                 EnvPaths, PinoLogger, HttpPotProvider, UploadCookieResolver, WebhookNotifier, WsEventBus
      http/                     tRPC HTTP link routes
      ws/                       WebSocket event broadcast
      auth/                     session cookie + bcrypt
  renderer/                     unchanged React; new transport seam
    src/
      transport/
        Transport.ts            interface
        ElectronTransport.ts    tRPC IPC client (wraps window.appApi)
        HttpTransport.ts        tRPC HTTP+WS client
        index.ts                picks based on window.appApi presence
```

### Layer diagram

```
┌─────────────────────────────────────────────────┐
│  shell/electron     │  shell/server             │  thin (~500 LOC each)
│  + IPC handlers     │  + Hono routes + ws       │
│  + 6 adapters       │  + 6 adapters             │
└────────┬────────────┴────────┬──────────────────┘
         │ inject ports        │
         ▼                     ▼
┌─────────────────────────────────────────────────┐
│  core/  env-agnostic daemon                     │  ~95% of LOC
│  - services/, phases/, stores/                  │
│  - ports/ (interfaces only)                     │
│  - createCore(ports)                            │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  shared/  pure (types, schemas, transition, …)  │
└────────────────────▲────────────────────────────┘
                     │
                renderer/  React, transport-agnostic
```

## 4. Port Interfaces

Six ports total. Each < 10 LOC. Place in `src/core/ports/`.

```ts
// Paths.ts
export interface Paths {
  dataDir(): string       // queue.db, settings.db
  downloadsDir(): string  // default output target
  logsDir(): string
  binDir(): string        // yt-dlp, deno cache
  tempDir(): string
}

// Logger.ts
export interface Logger {
  scope(name: string): Logger
  trace(msg: string, meta?: object): void
  info(msg: string, meta?: object): void
  warn(msg: string, meta?: object): void
  error(msg: string, err?: Error, meta?: object): void
}

// PotProvider.ts
export interface PotProvider {
  mint(visitorData: string): Promise<{ poToken: string; visitorData: string }>
}

// CookieResolver.ts
import type { CookieSource } from '@shared/types.js'
export interface CookieResolver {
  resolve(source: CookieSource): Promise<CookieFile | null>
}

// Notifier.ts
export interface Notifier {
  jobCompleted(job: DownloadJob): void
  jobFailed(job: DownloadJob, err: LocalizedError): void
}

// EventBus.ts
export interface EventBus {
  emit(event: QueueProjectionEvent): void  // shell wires to IPC OR ws broadcast
}

// Clock.ts (also enables test determinism)
export interface Clock {
  now(): number
  iso(): string
}
```

## 5. Adapters per Shell

Symmetric 1:1 mapping. Lint rule can flag missing pairs.

| Port            | shell/electron/adapters/      | shell/server/adapters/        |
|-----------------|-------------------------------|-------------------------------|
| Paths           | `ElectronPaths.ts`            | `EnvPaths.ts`                 |
| Logger          | `ElectronLogger.ts`           | `PinoLogger.ts`               |
| PotProvider     | `ElectronPotProvider.ts`      | `HttpPotProvider.ts`          |
| CookieResolver  | `ElectronCookieResolver.ts`   | `UploadCookieResolver.ts`     |
| Notifier        | `ElectronNotifier.ts`         | `WebhookNotifier.ts`          |
| EventBus        | `IpcEventBus.ts`              | `WsEventBus.ts`               |

Clock is shared: `SystemClock` in `core/factory/`, `FakeClock` in `tests/fakes/`.

### Adapter notes

- **EnvPaths** reads `ARCLIO_DATA_DIR`, `ARCLIO_DOWNLOADS_DIR`, `ARCLIO_LOG_DIR`, `ARCLIO_BIN_DIR`, `ARCLIO_TEMP_DIR` with sensible defaults (`/data`, `/downloads`, `/data/logs`, `/data/bin`, `/tmp/arclio`).
- **PinoLogger** emits NDJSON to stdout; standard for container logging stacks (Loki, Vector, Datadog).
- **HttpPotProvider** POSTs to `ARCLIO_POT_PROVIDER_URL` (bgutil-ytdlp-pot-provider sidecar). Falls back to bypass mode if env unset (degraded YT support).
- **UploadCookieResolver** reads from `${dataDir}/cookies/{netscape|json}` files uploaded via API. Browser auto-extraction unavailable in container.
- **WebhookNotifier** POSTs to `ARCLIO_WEBHOOK_URL` if set; no-op otherwise.
- **WsEventBus** broadcasts to all authenticated ws clients. Snapshot sent on connect.

## 6. Contract: tRPC + Zod (Duplication Killer #1)

One router definition powers both IPC and HTTP. Renderer imports `AppRouter` type only.

```ts
// src/core/contract/router.ts
export const appRouter = t.router({
  queue: t.router({
    add: t.procedure.input(z.array(downloadJobSchema)).mutation(...),
    pause: t.procedure.input(z.object({ id: z.string() })).mutation(...),
    resume: t.procedure.input(z.object({ id: z.string() })).mutation(...),
    cancel: t.procedure.input(z.object({ id: z.string().nullable() })).mutation(...),
    retry: t.procedure.input(z.object({ id: z.string() })).mutation(...),
    remove: t.procedure.input(z.object({ id: z.string() })).mutation(...),
    clearCompleted: t.procedure.mutation(...),
    snapshot: t.procedure.query(...),
    onEvent: t.procedure.subscription(...)   // ws/IPC stream
  }),
  probe: t.router({ ... }),
  settings: t.router({ ... }),
  binary: t.router({ ... })
})
export type AppRouter = typeof appRouter
```

- Electron shell: `electron-trpc` IPC link wires `appRouter` to `ipcMain` automatically.
- Server shell: `@trpc/server/adapters/fetch` (Hono adapter) exposes `appRouter` over HTTP.
- Renderer transport: `createTRPCClient<AppRouter>({ links: [electronLink() OR httpBatchLink() + wsLink()] })`.

End-to-end type safety. Add a procedure once → both shells expose it, renderer client gains typed method, breaking changes surface at compile time.

## 7. Persistence: One SQLite Impl, Two Paths

Library: **better-sqlite3** (sync, fast, no daemon, zero-config). WAL mode. Schema bundled as SQL migration files.

```sql
CREATE TABLE queue_items (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  lane TEXT NOT NULL,
  created_at TEXT NOT NULL,
  finished_at TEXT,
  payload JSON NOT NULL,           -- entire QueueItem
  position INTEGER NOT NULL
);
CREATE INDEX idx_status_lane_created ON queue_items(status, lane, created_at);

CREATE TABLE settings (key TEXT PRIMARY KEY, value JSON NOT NULL);
CREATE TABLE recent_jobs (id TEXT PRIMARY KEY, finished_at TEXT NOT NULL, payload JSON NOT NULL);
CREATE INDEX idx_recent_finished ON recent_jobs(finished_at DESC);

-- server-only (electron shell ignores)
CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id));
```

One `QueueStore` class. Both shells inject the same store built from `Paths.dataDir()`. Electron passes `app.getPath('userData')`, server passes `/data`. Zero forking inside QueueStore.

Migration on first boot: if `queue.json` present, read items, insert rows, rename file `queue.json.bak`.

Query builder: **kysely** (type-safe) or **drizzle**. Skip prisma (heavy, codegen pain in monorepo).

## 8. Renderer Transport Seam

```ts
// src/renderer/src/transport/index.ts
export const transport: Transport = window.appApi
  ? createElectronTransport()
  : createHttpTransport({
      base: import.meta.env.BASE_URL,
      ws: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/events`
    })
```

Renderer calls `transport.queue.add(items)` everywhere. Never references `window.appApi` directly. Build flag `--mode electron|server` flips Vite `base` and bundles the right transport as default.

All transports use the **same `AppRouter` type** from `core/contract/`. tRPC handles serialization, batching, subscription multiplexing.

## 9. PoT Minting Strategy (Hard Problem)

YouTube increasingly demands PoT tokens. `TokenService.ts` currently uses `BrowserWindow` to scrape nsig decoder. No display server in docker.

### Three options evaluated

| Option | Description | Cost | Verdict |
|---|---|---|---|
| A | Headless Chromium inside server image (puppeteer-core + alpine chromium) | +300MB image, more attack surface | fallback only |
| B | Sidecar container `brainicism/bgutil-ytdlp-pot-provider` | small server image, modular updates | **recommended** |
| C | Accept degraded YT (no PoT) | unreliable, support burden | last resort |

### Chosen: B (sidecar)

- yt-dlp talks to sidecar over HTTP via plugin.
- Sidecar updates independently — community maintains.
- Server image stays slim.
- Standard pattern in self-host yt-dlp world.

### Abstraction

```ts
interface PotProvider {
  mint(visitorData: string): Promise<{ poToken: string; visitorData: string }>
}
```

- `ElectronPotProvider` → current HiddenWindow code, unchanged.
- `HttpPotProvider` → POSTs to `ARCLIO_POT_PROVIDER_URL`.
- Optional future `BypassPotProvider` for graceful degradation.

`YtDlp` service takes `PotProvider` via constructor. Service has zero knowledge of how token is obtained.

## 10. Docker + Compose

### Dockerfile (multi-stage)

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json bun.lockb ./
RUN apk add --no-cache python3 make g++ \
 && npm i -g bun \
 && bun install --frozen-lockfile
COPY . .
RUN bun run build:server && bun run build:web

FROM node:22-alpine
RUN apk add --no-cache ffmpeg ca-certificates tini su-exec
WORKDIR /app
COPY --from=build /app/dist/server ./
COPY --from=build /app/dist/web ./public
ENV NODE_ENV=production \
    ARCLIO_DATA_DIR=/data \
    ARCLIO_DOWNLOADS_DIR=/downloads \
    PORT=8000
EXPOSE 8000
VOLUME ["/data", "/downloads"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://localhost:8000/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
```

- ffmpeg from alpine apk (smaller than BtbN bundle, dynamic deps OK in container).
- yt-dlp + deno still runtime-fetched into `/data/bin/` by `BinaryManager` — same flow, same checksum verify.
- `tini` as PID 1 for proper signal forwarding to child processes.
- Healthcheck for Docker/Portainer status.

### docker-compose.yml (homelab-friendly)

```yaml
services:
  arclio:
    image: ghcr.io/antonio-orionus/arclio:latest
    container_name: arclio
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - ./arclio/data:/data
      - /mnt/media/youtube:/downloads
    environment:
      ARCLIO_POT_PROVIDER_URL: http://pot-provider:4416
      ARCLIO_AUTH_PASSWORD_HASH: ${ARCLIO_PASS_HASH}
      TZ: Europe/Berlin
    depends_on:
      - pot-provider
    labels:
      - traefik.enable=true
      - traefik.http.routers.arclio.rule=Host(`arclio.home.lan`)
      - traefik.http.services.arclio.loadbalancer.server.port=8000

  pot-provider:
    image: brainicism/bgutil-ytdlp-pot-provider:latest
    container_name: arclio-pot-provider
    restart: unless-stopped
```

Drop-in alongside *arr stack. Reverse-proxy aware (X-Forwarded-* honored by Hono middleware). Optional sub-path mount via `ARCLIO_BASE_PATH=/arclio` env (Vite `base` configured at build, runtime served from same prefix).

## 11. Auth (Server Only)

Homelab norm: single admin user, possibly behind Authelia/Authentik. Build small, don't reinvent.

- First-run setup: env `ARCLIO_AUTH_PASSWORD_HASH` set → use it. Unset → generate random password, log it to stdout once (sonarr-style "admin password = XYZ" first-boot message).
- Library: **lucia-auth** v3 or hand-rolled (session table + bcrypt).
- Cookie: `httpOnly`, `Secure` (when behind HTTPS proxy), `SameSite=Lax`.
- Trust proxy: `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Forwarded-Host`. Hono middleware.
- Healthcheck endpoint `/health` does NOT require auth.
- API endpoints under `/api/*` require valid session cookie.
- Static SPA at `/` redirects to `/login` if no session.
- No OIDC v1. Add later if demand emerges.
- No multi-user v1. Single admin row. Multi-user is a future feature requiring `userId` FK on `queue_items`, per-user output dirs, per-user cookies — deferred.

## 12. Build & CI Changes

### package.json scripts

```jsonc
{
  "scripts": {
    "build:core":     "tsc -p tsconfig.core.json --noEmit",
    "build:electron": "electron-vite build && bun run check:preload-bundle",
    "build:server":   "tsup src/shell/server/server.ts --format esm --target node22 --tree-shake",
    "build:web":      "vite build --config src/renderer/vite.config.mjs --mode web",
    "docker:build":   "docker buildx build --platform linux/amd64,linux/arm64 -t arclio ."
  }
}
```

### tsconfig.core.json

```jsonc
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "types": [],
    "lib": ["ES2023"],
    "rootDir": "src/core",
    "paths": { "@shared/*": ["src/shared/*"] }
  },
  "include": ["src/core/**/*"]
}
```

### ESLint rules (core scope)

```jsonc
{
  "files": ["src/core/**/*.ts"],
  "rules": {
    "no-restricted-globals": ["error", "process", "console"],
    "no-restricted-imports": ["error", {
      "patterns": ["electron", "electron-*", "hono", "ws", "react", "@renderer/*", "@main/*"]
    }]
  }
}
```

### CI gates (add to `.github/workflows/`)

- `bun run check` (existing) — lint + typecheck + knip + madge.
- `tsc -p tsconfig.core.json` — hard boundary on core deps.
- `grep -rE "require\(['\"]electron['\"]\)" dist/server/` must be empty.
- `docker buildx build --platform linux/amd64,linux/arm64` on every PR.
- Publish to `ghcr.io/antonio-orionus/arclio:{version,latest,beta}` on tag matrix:
  - Stable tag (`v1.2.3`) → `:1.2.3` + `:latest`.
  - Beta tag (`v1.2.3-beta.1`) → `:1.2.3-beta.1` + `:beta`.

### Knip config update

Add `src/shell/electron/main.ts` and `src/shell/server/server.ts` as entry points. Knip finds files reachable from neither → dead. Prevents drift where logic exists in one shell but not the other.

## 13. Migration Sequence

Strict order. Steps 1-4 are pure refactor (desktop-only, ships independently). Step 5+ is additive (server emerges without touching core).

### Phase 1 — Extract `src/core/` (1 day)
- Move `src/main/services/`, `src/main/services/phases/`, `src/main/services/download/`, `src/main/stores/` → `src/core/services/`, `src/core/phases/`, `src/core/services/download/`, `src/core/stores/`.
- Update path aliases: `@main/*` becomes `@core/*` for moved files.
- **Verify**: `bun run check` clean. `bun run dev` works. No behavioral change.

### Phase 2 — Introduce ports (0.5 day)
- Create `src/core/ports/{Paths,Logger,PotProvider,CookieResolver,Notifier,EventBus,Clock}.ts` interfaces.
- Add `tsconfig.core.json` and ESLint rules.
- Compile fails everywhere `core/` imports electron — listed as port adoption targets.
- **Verify**: failing compile list matches expected adapter surface.

### Phase 3 — Wrap electron deps into adapters (1 day)
- Create `src/shell/electron/adapters/` w/ six adapters.
- Refactor services to take ports via constructor. Replace direct `electron-log` / `app.getPath()` / `BrowserWindow` calls with port calls.
- **Verify**: `tsc -p tsconfig.core.json` passes. Electron app behaviorally unchanged.

### Phase 4 — `createCore(ports)` composition root (0.5 day)
- Add `src/core/factory/createCore.ts` building all services from injected ports.
- Refactor `src/shell/electron/main.ts` to boot via `createCore`.
- **Verify**: Electron app boots. Existing tests pass.
- **Checkpoint**: ship as internal release. Clean refactored desktop app, no server yet.

### Phase 5 — SQLite migration (1 day)
- Add `better-sqlite3` + `kysely`.
- Rewrite `QueueStore`, `SettingsStore`, `RecentJobsStore` against SQLite.
- One-shot migration: read `queue.json` if present, insert rows, rename `.bak`.
- **Verify**: existing queue state migrates correctly. Tests with fixture queue.json pass.

### Phase 6 — tRPC contract module (1 day)
- Add `@trpc/server` + `@trpc/client` + `electron-trpc`.
- Define `appRouter` in `src/core/contract/router.ts`.
- Replace hand-written IPC handlers in `shell/electron/ipc/` with tRPC IPC link.
- **Verify**: renderer calls go through tRPC. No behavioral change.

### Phase 7 — Renderer transport seam (0.5 day)
- Add `src/renderer/src/transport/{Transport,ElectronTransport,HttpTransport,index}.ts`.
- Refactor renderer to call `transport.*` instead of `window.appApi.*`.
- **Verify**: Electron app works through new seam. browser-mock mode still works.

### Phase 8 — Server shell (2 days)
- Add `src/shell/server/server.ts` + Hono adapter + six server-side adapters.
- Add `tsup` build script for server bundle.
- Implement auth (session cookie + bcrypt, lucia-auth or hand-rolled).
- **Verify**: `bun run build:server` produces working bundle. `node dist/server/server.js` boots, accepts API calls, downloads work end-to-end.

### Phase 9 — PoT sidecar integration (1 day)
- Implement `HttpPotProvider` adapter.
- Test against `brainicism/bgutil-ytdlp-pot-provider` sidecar locally.
- Document fallback when sidecar unreachable.
- **Verify**: YouTube downloads succeed via server mode w/ sidecar.

### Phase 10 — Dockerfile + compose + CI (0.5 day)
- Add `Dockerfile`, `docker-compose.yml`, `.dockerignore`.
- Add GitHub Actions `publish-docker` job.
- **Verify**: `docker compose up` produces working install. Multi-arch image on ghcr.io.

### Phase 11 — Docs + homelab README (0.5 day)
- Add `docs/self-hosted.md` w/ compose examples for Traefik / Caddy / nginx-proxy-manager / bare.
- Add reverse-proxy + healthcheck + backup guidance.
- Update main README w/ "Self-Hosted Server" section linking to docs.

**Total MVP: ~8 days solid work.**

## 14. Risk Surface

| Risk | Mitigation |
|---|---|
| PoT sidecar reliability against YT bot-protection | Test against current YT before declaring v1. Fallback: ship custom puppeteer-based PoT image as alt sidecar. |
| SQLite migration from queue.json corrupts state | Keep `.bak` original, atomic write, fixture-test edge cases (corrupted JSON, partial migrate, schema drift between beta and current). |
| Cookies UX downgrade in web mode | Document clearly. Future: browser extension to export cookies, paste in UI. |
| Vite `base` path config breaks asset URLs | Build flag `--mode electron|server` with separate base. Test both bundles in CI. |
| WebSocket reconnect storm on flaky network | tRPC subscription wsLink has built-in reconnect. On reconnect, server re-sends snapshot. Standard pattern. |
| Auth bypass via misconfigured reverse proxy | Default to refusing requests with no session. Document required proxy headers. |
| Knip detects new core code as unreachable when only one shell uses it | Add both shell entry points to knip config. CI fails if either is missing. |
| Increased build time / bundle size | tsup tree-shaking + per-shell build keeps each bundle lean. Measure bundle size in CI, alert on regression. |
| Adapter surface drift (one shell forgets a port) | Lint rule enforces presence of adapter file per port per shell. |
| Bgutil pot-provider stops being maintained | Pin version. Document custom puppeteer alternative. |

## 15. Anti-Patterns (Watch For)

- **`if (isElectron)` branches in core** — should be impossible since electron globals unreachable from core. If you reach for this, your port is wrong.
- **Duplicating logic between shells** — anything copy-paste between `shell/electron/` and `shell/server/` either belongs in `core/`, or is an adapter pair (which is fine).
- **Two persistence implementations** — pick SQLite for both. Don't write `JsonQueueStore` for Electron + `SqliteQueueStore` for Server.
- **`core/electron/` or `core/server/` subdirs** — wrong direction. Env-specific code lives in `shell/{env}/adapters/`.
- **God-port `Platform`** — six small ports beats one big abstraction. Don't merge.
- **`shared/` importing from `core/`** — cycle. Direction is `shared ← core ← shell`.
- **Hand-written IPC handlers + HTTP routes that mirror each other** — that's tRPC's job. One router definition, two transports.
- **Bypassing transport seam in renderer** — direct `window.appApi.*` calls leak Electron coupling into renderer. Always go through `transport`.

## 16. Test Strategy

### Core
- Pure node tests, no electron, no docker.
- Fakes in `tests/fakes/`: `FakeClock`, `MemoryLogger`, `FakePotProvider`, `NoopCookieResolver`, `RecordingNotifier`, `RecordingEventBus`, `TmpPaths`.
- Test through `createCore({ ...fakes })` factory — same composition root, swappable adapters.
- 95% of test surface lives here.

### Shells
- Thin integration tests per adapter (~50 LOC each):
  - "ElectronLogger forwards to electron-log"
  - "HttpPotProvider POSTs valid payload to sidecar URL"
  - "IpcEventBus calls webContents.send"
  - "WsEventBus broadcasts to connected clients only"

### Contract
- tRPC type tests: `expectTypeOf<inferProcedureInput<...>>().toEqualTypeOf<...>()`.
- Schema fixture tests for every zod schema in `core/contract/`.

### End-to-end
- Electron: existing Playwright `_electron.launch()` tests.
- Server: spin docker image in CI, hit `/health`, `POST /api/queue/add`, watch ws for `started` event.

## 17. Distribution Outcome

| Channel | Before | After |
|---|---|---|
| GitHub Releases | NSIS, portable.exe, DMG (arm64/x64), AppImage, tar.gz, Flatpak | unchanged |
| Scoop | `arclio.json` manifest | unchanged |
| Homebrew | `arclio.rb` cask | unchanged |
| Winget | `AntonioOrionus.Arclio` | unchanged |
| Flatpak | bundle | unchanged |
| **ghcr.io** | — | **`arclio:{version,latest,beta}` multi-arch image (NEW)** |

Existing release pipeline (`release.yml`) unchanged. Docker job (`publish-docker.yml`) added in parallel.

## 18. Future / Out of Scope for v1

- Multi-user (per-user queues, output dirs, cookies).
- OIDC / SSO (`openid-client`).
- Sub-path mount as runtime config (currently build-time).
- Webhook notifications on job complete (basic version in WebhookNotifier; richer payloads later).
- Prometheus `/metrics` endpoint.
- Plugin system for non-yt-dlp backends (aria2 for HTTP/FTP, libtorrent for magnets). Requires `Downloader` interface abstracting `VideoPhase`. Separate plan.
- Browser extension for cookies export → server upload.
- Mobile-friendly responsive UI improvements.

## 19. References / Prior Art

- **MeTube** — yt-dlp web UI, Python, simple, no PoT support.
- **Pinchflat** — Elixir/Phoenix, scheduled yt-dlp for shows.
- **TubeArchivist** — Python/Django + ES, full archival, heavy.
- **yt-dlp-web-ui** — Go, simple.
- **JDownloader2** — Java, multi-host, plugin arch, established UX patterns.
- **aria2** — JSON-RPC daemon for direct HTTP/FTP/Magnet; integrates with yt-dlp via `--downloader aria2c` flag (future plugin).
- **brainicism/bgutil-ytdlp-pot-provider** — community PoT sidecar, standard pattern in self-host yt-dlp world.
- **electron-trpc** — IPC link for tRPC, used by several Electron apps for dual-shell architectures.
- **Servarr stack** (Sonarr, Radarr, Lidarr, Prowlarr) — reference for homelab UX conventions: first-boot password, healthcheck, single-port exposure, reverse-proxy aware.

## 20. Decision Log

| Decision | Reason |
|---|---|
| Hexagonal (ports & adapters) over feature flags | Hard compile-time boundary, no `if (isElectron)` drift. |
| Six ports (not fewer, not more) | Each cross-cutting concern gets its own port. Smaller = easier to fake; bigger = god-port. |
| tRPC over hand-written IPC/HTTP | One router definition, two transports, end-to-end type safety, zero duplication. |
| SQLite (better-sqlite3) over keeping queue.json | Indexed queries, scales to 10k+ items, unifies both shells. |
| PoT sidecar (option B) over embedded headless Chromium | Slim image, modular updates, community-maintained. |
| Hono over Fastify/Express | Lightweight, runs on Node/Bun/Deno, modern ergonomics, tRPC adapter mature. |
| No BullMQ/redis | Desktop in-process queue. Single-instance self-host = same. Only add at multi-machine worker scale. |
| Single admin auth v1 (no OIDC) | Homelab norm. Authelia/Authentik can sit in front. Add OIDC when demand emerges. |
| Same React app for both shells | Transport seam swaps; UI code identical. |
| Adopt TC39 `using` / `Symbol.dispose` for Disposables | Compiler-enforced cleanup, deletes ~80 LOC of plumbing. |
| Adopt `tree-kill` npm package | Better cross-platform edge case coverage than current `processControl.ts`. |
