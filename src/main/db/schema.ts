import {int, integer, real, sqliteTable, text, primaryKey} from 'drizzle-orm/sqlite-core'

// ── Media ────────────────────────────────────────────────────────────────────

export const media = sqliteTable('media', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	author: text('author'),
	url: text('url').notNull(),
	sourceKey: text('source_key'),
	sourceType: text('source_type').notNull().default('UNKNOWN'),
	duration: real('duration'),
	mediaType: text('media_type').notNull(), // 'video' | 'audio'
	thumbnailUrl: text('thumbnail_url'),
	thumbnailPath: text('thumbnail_path'),
	status: text('status').notNull().default('AVAILABLE'), // 'AVAILABLE' | 'MISSING' | 'CORRUPTED' | 'DELETED'
	isFavorite: int('is_favorite').notNull().default(0),
	createdBy: text('created_by').notNull().default('DOWNLOAD'), // 'DOWNLOAD' | 'IMPORT' | 'SYNC' | 'API'
	downloadDate: text('download_date').notNull(),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
})

// ── Asset ────────────────────────────────────────────────────────────────────

export const asset = sqliteTable('asset', {
	id: text('id').primaryKey(),
	mediaId: text('media_id')
		.notNull()
		.references(() => media.id, {onDelete: 'cascade'}),
	kind: text('kind').notNull(), // 'video' | 'audio' | 'subtitle' | 'thumbnail' | 'other'
	path: text('path').notNull(),
	fileName: text('file_name').notNull(),
	sizeBytes: integer('size_bytes'),
	mimeType: text('mime_type'),
	status: text('status').notNull().default('AVAILABLE'), // 'AVAILABLE' | 'MISSING'
	createdAt: text('created_at').notNull()
})

// ── Collection ───────────────────────────────────────────────────────────────

export const collection = sqliteTable('collection', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	icon: text('icon'),
	color: text('color'),
	sortOrder: int('sort_order').notNull().default(0),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
})

// ── Collection ↔ Media (N-N) ─────────────────────────────────────────────────

export const collectionMedia = sqliteTable(
	'collection_media',
	{
		collectionId: text('collection_id')
			.notNull()
			.references(() => collection.id, {onDelete: 'cascade'}),
		mediaId: text('media_id')
			.notNull()
			.references(() => media.id, {onDelete: 'cascade'}),
		sortOrder: int('sort_order').notNull().default(0),
		addedAt: text('added_at').notNull()
	},
	t => [primaryKey({columns: [t.collectionId, t.mediaId]})]
)

// ── Tag ──────────────────────────────────────────────────────────────────────

export const tag = sqliteTable('tag', {id: text('id').primaryKey(), name: text('name').notNull().unique(), color: text('color'), createdAt: text('created_at').notNull()})

// ── Media ↔ Tag (N-N) ────────────────────────────────────────────────────────

export const mediaTag = sqliteTable(
	'media_tag',
	{
		mediaId: text('media_id')
			.notNull()
			.references(() => media.id, {onDelete: 'cascade'}),
		tagId: text('tag_id')
			.notNull()
			.references(() => tag.id, {onDelete: 'cascade'})
	},
	t => [primaryKey({columns: [t.mediaId, t.tagId]})]
)

// ── Playback History ─────────────────────────────────────────────────────────

export const playbackHistory = sqliteTable('playback_history', {
	id: text('id').primaryKey(),
	mediaId: text('media_id')
		.notNull()
		.references(() => media.id, {onDelete: 'cascade'}),
	lastPosition: real('last_position').notNull().default(0),
	duration: real('duration'),
	playCount: int('play_count').notNull().default(1),
	completed: int('completed').notNull().default(0),
	lastOpenedAt: text('last_opened_at').notNull(),
	createdAt: text('created_at').notNull()
})

// ── Download History ─────────────────────────────────────────────────────────

export const downloadHistory = sqliteTable('download_history', {
	id: text('id').primaryKey(),
	url: text('url').notNull(),
	outputDir: text('output_dir'),
	mediaId: text('media_id').references(() => media.id, {onDelete: 'set null'}),
	status: text('status').notNull(), // 'completed' | 'failed' | 'cancelled'
	errorKind: text('error_kind'),
	errorRaw: text('error_raw'),
	formatId: text('format_id'),
	durationMs: integer('duration_ms'),
	finishedAt: text('finished_at').notNull(),
	createdAt: text('created_at').notNull()
})

// ── FTS5 virtual table (managed via raw SQL, not Drizzle) ────────────────────
// See connection.ts for FTS5 setup

// ── Inferred type aliases ────────────────────────────────────────────────────

export type Media = typeof media.$inferSelect
export type NewMedia = typeof media.$inferInsert
export type Asset = typeof asset.$inferSelect
export type NewAsset = typeof asset.$inferInsert
export type Collection = typeof collection.$inferSelect
export type NewCollection = typeof collection.$inferInsert
export type Tag = typeof tag.$inferSelect
export type NewTag = typeof tag.$inferInsert
export type PlaybackHistory = typeof playbackHistory.$inferSelect
export type NewPlaybackHistory = typeof playbackHistory.$inferInsert
export type DownloadHistory = typeof downloadHistory.$inferSelect
export type NewDownloadHistory = typeof downloadHistory.$inferInsert
