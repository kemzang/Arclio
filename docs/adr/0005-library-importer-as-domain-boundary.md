# 0005 — LibraryImporter as Domain Boundary

## Status

Accepted

## Context

The download engine (Arclio) must remain independent of the library domain. Two entry points must converge on the same Media creation logic:

1. Download completion (yt-dlp finishes)
2. Folder import (user adds existing files to library)

If `DownloadService` directly writes to the database, it becomes coupled to the library schema. Adding new import sources (Cloud, API) would require modifying the download engine.

## Decision

Introduce a **LibraryImporter** domain service. Download emits a `download:completed` event. LibraryImporter listens, reads probe cache, creates Media + Assets in the database.

```
DownloadService  ──event──→  LibraryImporter  ──write──→  SQLite
FolderScan       ──call──→  LibraryImporter  ──write──→  SQLite
```

### LibraryImporter responsibilities

1. Extract `source_key` from URL (platform-specific: `youtube:dQw4w9WgXcQ`)
2. Read probe data from `ProbeInfoJsonCache` (author, description, duration, thumbnails)
3. Create Media record in the database
4. Create Asset records for each artifact (media, subtitle, thumbnail)
5. Emit `library:media-created` event for renderer notification

### Data flow on download completion

```
QueueItem (title, url, thumbnail, artifacts)
    +
ProbeInfoJson (author, description, duration, extractor)
    ↓
LibraryImporter.importFromDownload()
    ↓
Media + Assets in SQLite
```

## Consequences

- DownloadService never imports database code
- Folder import reuses the same `createMedia()` logic
- Adding new import sources requires only a new event emitter
- Probe data (author, description, duration) is available via `ProbeInfoJsonRef`
- The service is ~50 lines — minimal overhead for clean separation
