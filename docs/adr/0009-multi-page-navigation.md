# 0009 — Multi-Page Navigation

## Status

Accepted

## Context

Arclio is a single-page wizard with no router. Navigation is state-driven via Zustand (`wizardStep`). This works for a download-focused app but doesn't support multiple distinct pages (Library, Collections, Player, etc.).

Arclio needs:
- Persistent sidebar navigation
- Distinct pages with deep linking
- Lazy loading per route
- Existing wizard flow preserved

## Decision

Introduce **react-router v7**. Sidebar navigation replaces the tab strip. Existing wizard mounts inside the Home route.

### Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Home | Wizard landing (existing Arclio flow, unchanged) |
| `/library` | Library | Grid/list view of all media |
| `/library/:id` | Player | Single media playback |
| `/collections` | Collections | Collection list |
| `/collections/:id` | Collection detail | Media in a collection |
| `/favorites` | Favorites | Filtered library (is_favorite = 1) |
| `/history` | History | Download + playback history |
| `/tags` | Tags | Tag management |
| `/settings` | Settings | App settings |

### Layout

```
┌─────────────────────────────────────┐
│ TitleBar                            │
├──────┬──────────────────────────────┤
│      │                              │
│ Side │    <Outlet />                │
│ bar  │    (page content)            │
│      │                              │
│      │                              │
├──────┴──────────────────────────────┤
│ Footer (zoom, theme, language)      │
└─────────────────────────────────────┘
```

### Sidebar items

| Icon | Label | Route |
|------|-------|-------|
| Download | Home | `/` |
| Library | Library | `/library` |
| FolderHeart | Collections | `/collections` |
| Star | Favorites | `/favorites` |
| Tag | Tags | `/tags` |
| Clock | History | `/history` |
| Settings | Settings | `/settings` |

## Consequences

- Existing wizard components unchanged (mount inside `/`)
- Sidebar provides persistent navigation across all pages
- Deep linking possible (share URL to a specific media)
- Lazy loading per route for performance
- `react-router` adds ~30KB to bundle
- Hash-based routing (`#/library`) for Electron compatibility
