# Contributing to Arroxy

Thanks for thinking about contributing! Bug reports, fixes, and small features are all welcome.

This document covers the essentials. If anything is unclear, open an issue and ask.

---

### Branching model

Arroxy uses two long-lived branches:

| Branch     | Purpose                                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| **`main`** | Stable releases only. Every commit on `main` corresponds to released code. Do not open PRs against `main`.              |
| **`dev`**  | Active development and integration. All features, fixes, and beta releases land here first. Open all PRs against `dev`. |

This keeps `main` aligned with shipped releases and avoids review/merge conflicts caused by targeting the release branch instead of the development branch.

If you accidentally target `main`, GitHub lets you change the base branch on an open PR — click "Edit" next to the title and switch the base to `dev`.

## Reporting bugs / requesting features

Use the [issue templates](https://github.com/antonio-orionus/Arroxy/issues/new/choose). For bugs, include:

- OS + version (e.g. Windows 11 23H2, macOS 14.4, Ubuntu 24.04)
- Install channel (NSIS installer, Portable, Scoop, Homebrew, Winget, AppImage, tar.gz, Flatpak, DMG)
- Arroxy version (visible in the title bar / Settings)
- A URL or scenario that reproduces it, plus the failure mode (error text, log line, screenshot)

## Local development

Prerequisites: [Bun](https://bun.sh) and Node.js LTS. Linux additionally needs `bash` + `unzip` for the embedded-binary fetch.

```bash
git clone https://github.com/antonio-orionus/Arroxy.git
cd Arroxy
bun install
bun run dev          # runs the Electron app against the Vite renderer
```

For pure-renderer / UI work without the Electron shell:

```bash
npx vite src/renderer --port 5173
```

The renderer's `browserMock.ts` stubs `window.appApi` so the wizard, queue, and update banner all simulate without a backend.

## Required pre-PR checks

All three must pass cleanly before opening a PR. CI gates on the same commands.

```bash
bun run lint        # ESLint — zero warnings
bun run typecheck   # tsc --noEmit — zero type errors
bun run knip        # dead exports / unused files — zero issues
```

If your change touches code with tests, also run:

```bash
bun run test        # vitest run
```

## Building installers locally (optional)

```bash
bun run dist:linux   # AppImage + tar.gz + Flatpak inputs
bun run dist:mac     # arm64 + x64 DMG (requires macOS host)
bun run dist:win     # NSIS installer + Portable .exe (Windows host)
```

For a fresh-Windows-box bootstrap, see `scripts/build/build-windows.ps1`.

## Coding conventions

- **TypeScript-strict.** No `any` / `unknown` without justification.
- **Naming.** Reuse the domain glossary in [`CLAUDE.md`](CLAUDE.md) → "Domain Glossary" section (Job / ActiveJob / Phase / JobLifecycle / BinaryManager / NavContext / FormatPicker / etc.). Don't introduce parallel vocabularies.
- **Architecture.** Renderer should not know how main fetches; main should not know which component renders. IPC channel names live in `src/shared/ipc.ts`; payload types live in `src/shared/types.ts`.
- **Comments.** Don't restate what code already says. Comment when WHY is non-obvious — a hidden constraint, an OS-specific quirk, a workaround for a specific bug.
- **No backwards-compat shims.** Delete old code rather than aliasing or re-exporting.
- **Mature libraries over bespoke code** for validation, HTTP, ORM, auth, logging, etc.

## Commit & PR conventions

- **Conventional Commits.** Subject ≤ ~70 chars: `fix(scope): …`, `feat(scope): …`, `refactor: …`, `build: …`, `docs: …`. Body explains the _why_, not the _what_.
- **No AI attribution.** Do **not** add `Co-Authored-By: Claude …` trailers or `🤖 Generated with …` footers to commits or PR bodies. Write as if authored solely by yourself.
- **Small, separable commits.** If your PR has two unrelated concerns, make them two commits — reviewers may take one and not the other.
- **Sign your commits** if your Git identity is set up for it. Not required.

## Licensing

Arroxy is MIT-licensed. By submitting a PR you agree your contribution is licensed under the same terms.
