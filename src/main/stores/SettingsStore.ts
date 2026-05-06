import Store from 'electron-store';
import type { AppSettings, CommonSettings, PlaylistPrefs, SinglePrefs } from '@shared/types';
import type { SettingsPatch } from '@shared/api';

export type { SettingsPatch };

const COMMON_FLAT_KEYS = ['defaultOutputDir', 'rememberLastOutputDir', 'uiZoom', 'uiTheme', 'language', 'commonPaths', 'cookiesPath', 'cookiesEnabled', 'proxyUrl', 'clipboardWatchEnabled', 'closeBehavior', 'embedChapters', 'embedMetadata', 'embedThumbnail', 'writeDescription', 'writeThumbnail', 'lastSponsorBlockMode', 'lastSponsorBlockCategories', 'analyticsEnabled', 'firstRunCompleted', 'drawerOpen'] as const;

const SINGLE_FLAT_KEYS = ['lastPreset', 'lastVideoResolution', 'lastSubtitleLanguages', 'lastSubtitleMode', 'lastSubtitleFormat', 'lastSubfolderEnabled', 'lastSubfolder'] as const;

const PLAYLIST_FLAT_KEYS = ['lastPlaylistPreset', 'lastPlaylistSubfolderEnabled', 'lastPlaylistSubfolder'] as const;

function pickKeys<K extends string>(src: Record<string, unknown>, keys: readonly K[]): Partial<Record<K, unknown>> {
  const out: Partial<Record<K, unknown>> = {};
  for (const k of keys) {
    if (k in src && src[k] !== undefined) out[k] = src[k];
  }
  return out;
}

function isLegacyShape(raw: Record<string, unknown>): boolean {
  // electron-store always seeds defaults into store.store, so `common` is
  // present even on a fresh install. The signal of legacy data is the
  // presence of any flat key — those only appear if the on-disk file came
  // from a pre-nested version.
  return COMMON_FLAT_KEYS.some((k) => k in raw) || SINGLE_FLAT_KEYS.some((k) => k in raw) || PLAYLIST_FLAT_KEYS.some((k) => k in raw);
}

function migrateFlatToNested(raw: Record<string, unknown>, defaults: AppSettings): AppSettings {
  const common = { ...defaults.common, ...pickKeys(raw, COMMON_FLAT_KEYS) } as CommonSettings;
  const single = { ...defaults.single, ...pickKeys(raw, SINGLE_FLAT_KEYS) } as SinglePrefs;
  const playlist = { ...defaults.playlist, ...pickKeys(raw, PLAYLIST_FLAT_KEYS) } as PlaylistPrefs;
  return { common, single, playlist };
}

function deepMerge(base: AppSettings, patch: SettingsPatch): AppSettings {
  return {
    common: { ...base.common, ...(patch.common ?? {}) },
    single: { ...base.single, ...(patch.single ?? {}) },
    playlist: { ...base.playlist, ...(patch.playlist ?? {}) }
  };
}

export class SettingsStore {
  // electron-store types are pinned to AppSettings, but the on-disk file may
  // hold the legacy flat shape until the first read. Cast at the boundary.
  private readonly store: Store<AppSettings>;
  private readonly defaults: AppSettings;

  constructor(userDataPath: string, defaults: AppSettings) {
    this.store = new Store<AppSettings>({ name: 'settings', cwd: userDataPath, defaults, clearInvalidConfig: true });
    this.defaults = defaults;
    this.maybeMigrate();
  }

  private maybeMigrate(): void {
    const raw = this.store.store as unknown as Record<string, unknown>;
    if (!isLegacyShape(raw)) return;
    const migrated = migrateFlatToNested(raw, this.defaults);
    // Replace the entire on-disk shape with the nested one. Wiping flat keys
    // first prevents both shapes from coexisting on disk.
    this.store.clear();
    this.store.set(migrated);
  }

  async get(): Promise<AppSettings> {
    return this.store.store;
  }

  async update(patch: SettingsPatch): Promise<AppSettings> {
    const merged = deepMerge(this.store.store, patch);
    this.store.set(merged);
    return this.store.store;
  }
}
