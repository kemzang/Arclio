import {eq, desc, asc, sql, and, inArray} from 'drizzle-orm'
import type {DrizzleDatabase} from '../connection.js'
import {media, asset, type Media, type NewMedia} from '../schema.js'
import {randomUUID} from 'node:crypto'

export interface MediaWithAssets extends Media {
	assets: (typeof asset.$inferSelect)[]
	totalSize: number | null
}

export interface MediaListFilters {
	search?: string
	mediaType?: 'video' | 'audio'
	status?: string
	isFavorite?: boolean
	sourceType?: string
	collectionId?: string
	tagId?: string
	sortBy?: 'title' | 'download_date' | 'created_at' | 'duration'
	sortOrder?: 'asc' | 'desc'
	limit?: number
	offset?: number
}

export interface MediaRepo {
	create(data: Omit<NewMedia, 'id' | 'createdAt' | 'updatedAt'>): Media
	getById(id: string): MediaWithAssets | null
	list(filters?: MediaListFilters): MediaWithAssets[]
	update(id: string, data: Partial<Omit<NewMedia, 'id' | 'createdAt'>>): Media | null
	delete(id: string): boolean
	setFavorite(id: string, isFavorite: boolean): void
	setStatus(id: string, status: 'AVAILABLE' | 'MISSING' | 'CORRUPTED' | 'DELETED'): void
	search(query: string, limit?: number): Media[]
	count(): number
	countByStatus(): Record<string, number>
}

export function createMediaRepository(db: DrizzleDatabase): MediaRepo {
	return {
		create(data: Omit<NewMedia, 'id' | 'createdAt' | 'updatedAt'>): Media {
			const now = new Date().toISOString()
			const id = randomUUID()
			const inserted = db
				.insert(media)
				.values({...data, id, createdAt: now, updatedAt: now})
				.returning()
				.get()
			return inserted
		},

		getById(id: string): MediaWithAssets | null {
			const row = db.select().from(media).where(eq(media.id, id)).get()
			if (!row) return null
			const assets = db.select().from(asset).where(eq(asset.mediaId, id)).all()
			const totalSize = assets.reduce((sum, a) => sum + (a.sizeBytes ?? 0), 0)
			return {...row, assets, totalSize}
		},

		list(filters: MediaListFilters = {}): MediaWithAssets[] {
			const conditions = []

			if (filters.search) {
				// Use FTS5 for full-text search
				const ftsResults = db.all(sql`SELECT rowid FROM media_fts WHERE media_fts MATCH ${filters.search}`) as {rowid: number}[]
				if (ftsResults.length === 0) return []
				const rowids = ftsResults.map((r: {rowid: number}) => r.rowid)
				conditions.push(
					sql`media.rowid IN (${sql.join(
						rowids.map(r => sql`${r}`),
						sql`, `
					)})`
				)
			}

			if (filters.mediaType) {
				conditions.push(eq(media.mediaType, filters.mediaType))
			}
			if (filters.status) {
				conditions.push(eq(media.status, filters.status))
			}
			if (filters.isFavorite !== undefined) {
				conditions.push(eq(media.isFavorite, filters.isFavorite ? 1 : 0))
			}
			if (filters.sourceType) {
				conditions.push(eq(media.sourceType, filters.sourceType))
			}

			const where = conditions.length > 0 ? and(...conditions) : undefined

			// Sorting
			const sortColumn = {title: media.title, download_date: media.downloadDate, created_at: media.createdAt, duration: media.duration}[filters.sortBy ?? 'download_date']

			const orderFn = filters.sortOrder === 'asc' ? asc : desc

			let query = db.select().from(media).where(where).orderBy(orderFn(sortColumn))

			if (filters.limit) {
				query = query.limit(filters.limit) as typeof query
			}
			if (filters.offset) {
				query = query.offset(filters.offset) as typeof query
			}

			const rows = query.all()

			// Batch-fetch assets for all media
			const mediaIds = rows.map((r: typeof media.$inferSelect) => r.id)
			if (mediaIds.length === 0) return []

			const allAssets = db.select().from(asset).where(inArray(asset.mediaId, mediaIds)).all()

			const assetsByMedia = new Map<string, (typeof asset.$inferSelect)[]>()
			for (const a of allAssets) {
				const list = assetsByMedia.get(a.mediaId) ?? []
				list.push(a)
				assetsByMedia.set(a.mediaId, list)
			}

			return rows.map((row: typeof media.$inferSelect) => {
				const assets = assetsByMedia.get(row.id) ?? []
				const totalSize = assets.reduce((sum: number, a: typeof asset.$inferSelect) => sum + (a.sizeBytes ?? 0), 0)
				return {...row, assets, totalSize}
			})
		},

		update(id: string, data: Partial<Omit<NewMedia, 'id' | 'createdAt'>>): Media | null {
			const now = new Date().toISOString()
			const updated = db
				.update(media)
				.set({...data, updatedAt: now})
				.where(eq(media.id, id))
				.returning()
				.get()
			return updated ?? null
		},

		delete(id: string): boolean {
			const result = db.delete(media).where(eq(media.id, id)).run()
			return result.changes > 0
		},

		setFavorite(id: string, isFavorite: boolean): void {
			db.update(media)
				.set({isFavorite: isFavorite ? 1 : 0, updatedAt: new Date().toISOString()})
				.where(eq(media.id, id))
				.run()
		},

		setStatus(id: string, status: 'AVAILABLE' | 'MISSING' | 'CORRUPTED' | 'DELETED'): void {
			db.update(media).set({status, updatedAt: new Date().toISOString()}).where(eq(media.id, id)).run()
		},

		search(query: string, limit = 20): Media[] {
			const results = db.all(sql`SELECT media.* FROM media_fts JOIN media ON media.rowid = media_fts.rowid WHERE media_fts MATCH ${query} ORDER BY rank LIMIT ${limit}`)
			return results as Media[]
		},

		count(): number {
			const result = db.select({count: sql<number>`count(*)`}).from(media).get()
			return result?.count ?? 0
		},

		countByStatus(): Record<string, number> {
			const rows = db.select({status: media.status, count: sql<number>`count(*)`}).from(media).groupBy(media.status).all()
			return Object.fromEntries(rows.map((r: {status: string | null; count: number}) => [r.status, r.count])) as Record<string, number>
		}
	}
}
