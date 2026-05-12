# dev-docs/

Internal engineering docs — feature designs, architecture notes, system maps.

**Not** to be confused with:

- `docs/` — generated GitHub Pages output (`landing-src/build.mjs`). Public site.
- `readme-src/` — README source-of-truth (English + 21 locales).
- `CLAUDE.md` / `AGENTS.md` — agent-only operating notes (gitignored).

## Convention

- One Markdown file per feature/topic. Kebab-case filename: `share-feature.md`, `release-pipeline.md`.
- Begin each doc with a "lives in" file table that lists the source paths the doc references. Makes refactor-driven rot easy to spot.
- Treat these as living documents — when shipping a refactor that touches a file mentioned here, update the doc in the same PR.
- For one-off design specs that won't outlive the work, prefer `docs/superpowers/specs/YYYY-MM-DD-*.md` (planning skill default) so they don't pile up here.

## Index

- [release-runbook.md](release-runbook.md) — Manual maintainer checklist for beta validation and stable tagging, both cut from `main`.
- [share-feature.md](share-feature.md) — Share button + periodic prompts + telemetry. Covers the dialog, all 5 manual entry points, the time/milestone triggers, persisted settings, and i18n.
