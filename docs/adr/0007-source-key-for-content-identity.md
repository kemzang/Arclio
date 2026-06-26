# 0007 — source_key for Content Identity

## Status

Accepted

## Context

The same video can be downloaded in different formats (1080p, 720p, MP3). Without a content identity, each download creates a separate Media entry. Users see duplicates in their library.

Full content hashing is too expensive for large video files. We need a lightweight way to identify "same content."

## Decision

Add a `source_key` field on Media. Format: `platform:id` (e.g., `youtube:dQw4w9WgXcQ`). Extracted from URL during import. NULL for unknown platforms.

### Extraction rules

| Platform | source_key | Extraction |
|----------|-----------|------------|
| YouTube | `youtube:VIDEO_ID` | Parse `v=` param from URL |
| Vimeo | `vimeo:VIDEO_ID` | Parse path segment |
| Twitch | `twitch:CLIP_ID` | Parse path segment |
| TikTok | `tiktok:VIDEO_ID` | Parse path segment |
| Instagram | `instagram:VIDEO_ID` | Parse path segment |
| Unknown | `NULL` | No extraction possible |

### How it's used in V1

- Stored on Media for future reference
- Filterable in library views ("show all YouTube media")
- NOT used for deduplication in V1 (same URL = two Media)

### How it enables V2 (Versions)

When Version support is added:
1. On download completion, check if Media with same `source_key` exists
2. If yes, ask user: "Replace, add as new version, or skip?"
3. Version table links multiple Assets to one Media via `source_key` grouping

## Consequences

- Zero complexity added to V1 (just a field + extraction logic)
- Platform filtering works immediately
- Version table can be added in V2 without schema migration
- NULL for unknown platforms is honest (no guessing)
