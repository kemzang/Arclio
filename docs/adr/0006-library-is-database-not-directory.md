# 0006 — Library Is Database Not Directory

## Status

Accepted

## Context

Files can be moved, deleted, renamed, or stored on removable drives. If the library is tied to a directory structure, any filesystem change breaks the library. Arclio must survive filesystem changes gracefully.

## Decision

The library is the **SQLite database**. Directories are "sources" that feed the library. They are not the library itself.

```
Library = database of Media records

Sources = where files come from
├── Download output directory
├── Watch folders (user-specified)
├── Future: Cloud drives
├── Future: USB / NAS
```

### Media status lifecycle

```
AVAILABLE  →  file exists on disk, playable
MISSING    →  file not found (deleted, moved, disconnected drive)
CORRUPTED  →  file found but unreadable (0 bytes, invalid header)
DELETED    →  user explicitly removed from library
```

### Scan behavior

- On app launch: quick scan (check file existence for all AVAILABLE Media)
- On user request: full scan (check existence + size + header)
- Scan updates status, never deletes Media automatically

### Watch folders

Stored in settings as `watchFolders: string[]`. Not a separate table in V1. The user can add/remove watch folders from settings. Scan imports new files as Media.

## Consequences

- Media persists when files disappear (status → MISSING, not deleted)
- User can relocate files (update Asset path, status → AVAILABLE)
- Multiple source directories supported
- Library works offline as long as database exists
- Future Cloud sync is just another source feeding the same database
