# 0008 — SQLite with Drizzle ORM

## Status

Accepted

## Context

Arclio uses `electron-store` (JSON files) for persistence. This works for settings and queue state but doesn't scale for:

- Relational data (Media ↔ Collection ↔ Tag)
- Full-text search (title, author, description)
- Aggregations (count by platform, duration sums)
- Large datasets (10,000+ media items)

## Decision

Use **better-sqlite3** for the library database with **Drizzle ORM** for type-safe schema and migrations.

### What stays on electron-store

| Store | Why |
|-------|-----|
| `settings.json` | Small, no queries needed, already works |
| `queue.json` | Operational state (transient), not library data |
| `playlist-manifests.json` | Download coordination, not library data |

### What moves to SQLite

| Table | Why |
|-------|-----|
| `media` | Core library entity, needs queries, FTS, relations |
| `asset` | File tracking, needs path lookups |
| `collection` | User organization, needs N-N with Media |
| `tag` | Metadata, needs N-N with Media |
| `playback_history` | Resume/most-played, needs time queries |
| `download_history` | Audit trail, replaces RecentJobsStore |

### SQLite configuration

- **WAL mode** — concurrent reads during writes
- **FTS5** — full-text search on title, author, description
- **Foreign keys** — enforced via `PRAGMA foreign_keys = ON`
- **Single file** — `library.db` in Electron userData directory

### Drizzle benefits

- TypeScript types generated from schema
- Type-safe queries (no string SQL)
- Migration generation (`drizzle-kit generate`)
- Standard SQL output (no SQLite-specific features)
- Future PostgreSQL swap = config change

## Consequences

- Library queries are fast (indexed, FTS)
- Single file backup (`library.db`)
- Type safety from schema to query
- Standard SQL for future PostgreSQL migration
- `better-sqlite3` requires native addon rebuild per Electron version
- FTS5 is enabled by default in better-sqlite3 builds
