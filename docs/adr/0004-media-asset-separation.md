# 0004 — Media/Asset Separation

## Status

Accepted

## Context

Arroxy stores download data as a flat `QueueItem` with `file_path` on the item itself. This model assumes one file per download. Arclio needs to:

- Support multiple files per content (video + subtitles + thumbnail + description)
- Distinguish logical content from physical files
- Prepare for future multi-format versions (1080p, 720p, MP3) without schema migration

## Decision

Separate **Media** (logical content) from **Asset** (physical file). Media is the user-facing entity displayed in the library. Asset is an implementation detail invisible to the user.

```
Media (1) ──→ Asset (N)
  title         kind: 'video' | 'audio' | 'subtitle' | 'thumbnail' | 'other'
  author        path
  url           file_name
  duration      size_bytes
  media_type    mime_type
```

- **Media** represents "what" — the content, its metadata, its identity
- **Asset** represents "where" — the physical file on disk

### Key rules

1. Library queries target Media, never Asset directly
2. Player reads Media, resolves to the primary Asset (kind = video or audio) for playback
3. File operations (move, delete) operate on Asset, then update Media status
4. `file_size` lives only on Asset, not on Media (computed on read for library display)
5. Future Version table inserts between Media and Asset without schema migration

## Consequences

- Library UI is clean — users see Media, not files
- Multiple subtitle files, thumbnails, and descriptions are naturally supported
- File relocation only requires updating Asset.path, not touching Media
- The `source_key` field on Media enables future content-based grouping (Versions)
- Slightly more complex than flat model, but the complexity is in the right place
