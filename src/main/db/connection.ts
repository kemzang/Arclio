import Database from 'better-sqlite3'
import {drizzle} from 'drizzle-orm/better-sqlite3'
import {app} from 'electron'
import path from 'node:path'
import * as schema from './schema.js'

export type DrizzleDatabase = ReturnType<typeof drizzle<typeof schema>>

let _db: DrizzleDatabase | null = null

function getDbPath(): string {
	const userData = app.getPath('userData')
	return path.join(userData, 'library.db')
}

export function getLibraryDb(): ReturnType<typeof drizzle<typeof schema>> {
	if (_db) return _db

	const dbPath = getDbPath()
	const sqlite = new Database(dbPath)

	// WAL mode for concurrent reads during writes
	sqlite.pragma('journal_mode = WAL')
	sqlite.pragma('foreign_keys = ON')

	// Create tables if they don't exist
	sqlite.exec(`
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      author TEXT,
      url TEXT NOT NULL,
      source_key TEXT,
      source_type TEXT NOT NULL DEFAULT 'UNKNOWN',
      duration REAL,
      media_type TEXT NOT NULL,
      thumbnail_url TEXT,
      thumbnail_path TEXT,
      status TEXT NOT NULL DEFAULT 'AVAILABLE',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL DEFAULT 'DOWNLOAD',
      download_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_media_source_key ON media(source_key);
    CREATE INDEX IF NOT EXISTS idx_media_source_type ON media(source_type);
    CREATE INDEX IF NOT EXISTS idx_media_author ON media(author);
    CREATE INDEX IF NOT EXISTS idx_media_media_type ON media(media_type);
    CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);
    CREATE INDEX IF NOT EXISTS idx_media_is_favorite ON media(is_favorite);
    CREATE INDEX IF NOT EXISTS idx_media_download_date ON media(download_date);

    CREATE TABLE IF NOT EXISTS asset (
      id TEXT PRIMARY KEY,
      media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      size_bytes INTEGER,
      mime_type TEXT,
      status TEXT NOT NULL DEFAULT 'AVAILABLE',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_asset_media ON asset(media_id);
    CREATE INDEX IF NOT EXISTS idx_asset_kind ON asset(kind);
    CREATE INDEX IF NOT EXISTS idx_asset_path ON asset(path);

    CREATE TABLE IF NOT EXISTS collection (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collection_media (
      collection_id TEXT NOT NULL REFERENCES collection(id) ON DELETE CASCADE,
      media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      added_at TEXT NOT NULL,
      PRIMARY KEY (collection_id, media_id)
    );

    CREATE INDEX IF NOT EXISTS idx_collection_media_media ON collection_media(media_id);

    CREATE TABLE IF NOT EXISTS tag (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media_tag (
      media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
      PRIMARY KEY (media_id, tag_id)
    );

    CREATE INDEX IF NOT EXISTS idx_media_tag_tag ON media_tag(tag_id);

    CREATE TABLE IF NOT EXISTS playback_history (
      id TEXT PRIMARY KEY,
      media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      last_position REAL NOT NULL DEFAULT 0,
      duration REAL,
      play_count INTEGER NOT NULL DEFAULT 1,
      completed INTEGER NOT NULL DEFAULT 0,
      last_opened_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_playback_media ON playback_history(media_id);
    CREATE INDEX IF NOT EXISTS idx_playback_last_opened ON playback_history(last_opened_at);

    CREATE TABLE IF NOT EXISTS download_history (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      output_dir TEXT,
      media_id TEXT REFERENCES media(id) ON DELETE SET NULL,
      status TEXT NOT NULL,
      error_kind TEXT,
      error_raw TEXT,
      format_id TEXT,
      duration_ms INTEGER,
      finished_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_download_history_status ON download_history(status);
    CREATE INDEX IF NOT EXISTS idx_download_history_finished ON download_history(finished_at);
    CREATE INDEX IF NOT EXISTS idx_download_history_media ON download_history(media_id);
  `)

	// FTS5 virtual table for full-text search
	sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS media_fts USING fts5(
      title, author, description,
      content='media',
      content_rowid='rowid'
    );
  `)

	// FTS sync triggers
	sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS media_ai AFTER INSERT ON media BEGIN
      INSERT INTO media_fts(rowid, title, author, description)
      VALUES (new.rowid, new.title, new.author, new.description);
    END;

    CREATE TRIGGER IF NOT EXISTS media_ad AFTER DELETE ON media BEGIN
      INSERT INTO media_fts(media_fts, rowid, title, author, description)
      VALUES ('delete', old.rowid, old.title, old.author, old.description);
    END;

    CREATE TRIGGER IF NOT EXISTS media_au AFTER UPDATE ON media BEGIN
      INSERT INTO media_fts(media_fts, rowid, title, author, description)
      VALUES ('delete', old.rowid, old.title, old.author, old.description);
      INSERT INTO media_fts(rowid, title, author, description)
      VALUES (new.rowid, new.title, new.author, new.description);
    END;
  `)

	_db = drizzle(sqlite, {schema})
	return _db
}

export function closeLibraryDb(): void {
	if (_db) {
		_db.$client.close()
		_db = null
	}
}
