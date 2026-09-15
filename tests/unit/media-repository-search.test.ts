// @vitest-environment node

import Database from 'better-sqlite3'
import {drizzle} from 'drizzle-orm/better-sqlite3'
import {beforeEach, describe, expect, it} from 'vitest'
import {createMediaRepository} from '@main/db/repositories/mediaRepository.js'
import * as schema from '@main/db/schema.js'

// Same schema connection.ts creates via getLibraryDb() — duplicated here
// rather than imported because getLibraryDb() is hard-wired to
// app.getPath('userData') (Electron-only) and a real in-memory DB is what
// actually exercises the FTS5 MATCH query this suite is about, not a mock.
function createTestDb() {
	const sqlite = new Database(':memory:')
	sqlite.exec(`
		CREATE TABLE media (
			id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, author TEXT, url TEXT NOT NULL,
			source_key TEXT, source_type TEXT NOT NULL DEFAULT 'UNKNOWN', duration REAL, media_type TEXT NOT NULL,
			thumbnail_url TEXT, thumbnail_path TEXT, metadata TEXT, status TEXT NOT NULL DEFAULT 'AVAILABLE',
			is_favorite INTEGER NOT NULL DEFAULT 0, created_by TEXT NOT NULL DEFAULT 'DOWNLOAD',
			download_date TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
		);
		CREATE TABLE asset (
			id TEXT PRIMARY KEY, media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE, kind TEXT NOT NULL,
			path TEXT NOT NULL, file_name TEXT NOT NULL, size_bytes INTEGER, mime_type TEXT,
			status TEXT NOT NULL DEFAULT 'AVAILABLE', created_at TEXT NOT NULL
		);
		CREATE TABLE collection_media (
			collection_id TEXT NOT NULL, media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
			sort_order INTEGER NOT NULL DEFAULT 0, added_at TEXT NOT NULL, PRIMARY KEY (collection_id, media_id)
		);
		CREATE TABLE media_tag (media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE, tag_id TEXT NOT NULL, PRIMARY KEY (media_id, tag_id));
		CREATE VIRTUAL TABLE media_fts USING fts5(title, author, description, content='media', content_rowid='rowid');
		CREATE TRIGGER media_ai AFTER INSERT ON media BEGIN
			INSERT INTO media_fts(rowid, title, author, description) VALUES (new.rowid, new.title, new.author, new.description);
		END;
		CREATE TRIGGER media_ad AFTER DELETE ON media BEGIN
			INSERT INTO media_fts(media_fts, rowid, title, author, description) VALUES ('delete', old.rowid, old.title, old.author, old.description);
		END;
		CREATE TRIGGER media_au AFTER UPDATE ON media BEGIN
			INSERT INTO media_fts(media_fts, rowid, title, author, description) VALUES ('delete', old.rowid, old.title, old.author, old.description);
			INSERT INTO media_fts(rowid, title, author, description) VALUES (new.rowid, new.title, new.author, new.description);
		END;
	`)
	return drizzle(sqlite, {schema})
}

describe('mediaRepository — FTS5 search with real-world titles', () => {
	let repo: ReturnType<typeof createMediaRepository>

	beforeEach(() => {
		repo = createMediaRepository(createTestDb())
		repo.create({title: 'ANS - Mal Aimé (Clip Officiel)', url: 'https://youtube.com/watch?v=1', mediaType: 'video', status: 'AVAILABLE', createdBy: 'DOWNLOAD', downloadDate: '2026-09-15T00:00:00.000Z', sourceType: 'UNKNOWN', description: null, author: null, thumbnailUrl: null, thumbnailPath: null, metadata: null})
		repo.create({
			title: 'Why you should date the short guy | Amy Chan | TED',
			url: 'https://youtube.com/watch?v=2',
			mediaType: 'video',
			status: 'AVAILABLE',
			createdBy: 'DOWNLOAD',
			downloadDate: '2026-09-15T00:00:00.000Z',
			sourceType: 'UNKNOWN',
			description: null,
			author: null,
			thumbnailUrl: null,
			thumbnailPath: null,
			metadata: null
		})
	})

	it('finds a title by a plain single-word substring (baseline)', () => {
		expect(repo.list({search: 'Aimé'})).toHaveLength(1)
	})

	it('finds a title when the query contains parentheses copied straight from that title', () => {
		// Exactly what a user gets from selecting part of "(Clip Officiel)" with
		// their mouse, or from typing it progressively in a live search box.
		expect(repo.list({search: '(Clip Officiel)'})).toHaveLength(1)
	})

	it('does not silently return zero results for unbalanced parentheses (mid-typing state)', () => {
		// A live search box calls this on every keystroke — the query is
		// legitimately "(Clip" for one render before the user finishes typing
		// the closing paren. FTS5 treats a bare '(' as invalid grouping syntax.
		expect(repo.list({search: '(Clip'})).toHaveLength(1)
	})

	it('finds a title through a pipe character copied from the real title', () => {
		expect(repo.list({search: 'Amy Chan | TED'})).toHaveLength(1)
	})

	it('finds a title across a hyphen without matching the other, unrelated video', () => {
		expect(repo.list({search: 'Mal - Aimé'})).toHaveLength(1)
	})

	it('still returns empty for a query that truly matches nothing', () => {
		expect(repo.list({search: 'completely unrelated phrase'})).toHaveLength(0)
	})
})

describe('mediaRepository — DELETED status is a tombstone, not a visible item', () => {
	let repo: ReturnType<typeof createMediaRepository>

	beforeEach(() => {
		repo = createMediaRepository(createTestDb())
		repo.create({title: 'Still here', url: 'https://youtube.com/watch?v=1', mediaType: 'video', status: 'AVAILABLE', createdBy: 'DOWNLOAD', downloadDate: '2026-09-15T00:00:00.000Z', sourceType: 'YOUTUBE', description: null, author: null, thumbnailUrl: null, thumbnailPath: null, metadata: null})
		const deleted = repo.create({title: 'Soft deleted', url: 'https://youtube.com/watch?v=2', mediaType: 'video', status: 'AVAILABLE', createdBy: 'SYNC', downloadDate: '2026-09-15T00:00:00.000Z', sourceType: 'UNKNOWN', description: null, author: null, thumbnailUrl: null, thumbnailPath: null, metadata: null})
		repo.setStatus(deleted.id, 'DELETED')
	})

	// A synced deletion (or a future user-facing delete action) marks a row
	// DELETED rather than removing it outright — SyncService needs the row to
	// still exist locally so it can push the tombstone on the next round. The
	// library UI has no status filter of its own, so if list()/search() don't
	// hide DELETED by default, a "deleted" item stays fully visible until sync
	// happens to run — exactly what let the stray SYNC-originated rows found
	// live in this session sit in the library indefinitely.
	it('list() omits a DELETED row by default', () => {
		const titles = repo.list().map(item => item.title)
		expect(titles).toContain('Still here')
		expect(titles).not.toContain('Soft deleted')
	})

	it('list() still returns a DELETED row when explicitly asked for it', () => {
		const titles = repo.list({status: 'DELETED'}).map(item => item.title)
		expect(titles).toEqual(['Soft deleted'])
	})

	it('search() omits a DELETED row by default', () => {
		expect(repo.search('Soft deleted')).toHaveLength(0)
	})
})
