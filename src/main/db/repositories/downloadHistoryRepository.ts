import {eq, desc, sql, and} from 'drizzle-orm'
import type {DrizzleDatabase} from '../connection.js'
import {downloadHistory, type DownloadHistory, type NewDownloadHistory} from '../schema.js'
import {randomUUID} from 'node:crypto'

export interface DownloadHistoryRepo {
	create(data: Omit<NewDownloadHistory, 'id' | 'createdAt'>): DownloadHistory
	list(options?: {status?: string; limit?: number; offset?: number}): DownloadHistory[]
	listByMediaId(mediaId: string): DownloadHistory[]
	update(id: string, data: Partial<Omit<NewDownloadHistory, 'id' | 'createdAt'>>): DownloadHistory | null
	count(): number
	countByStatus(): Record<string, number>
}

export function createDownloadHistoryRepository(db: DrizzleDatabase): DownloadHistoryRepo {
	return {
		create(data: Omit<NewDownloadHistory, 'id' | 'createdAt'>): DownloadHistory {
			const id = randomUUID()
			const now = new Date().toISOString()
			return db
				.insert(downloadHistory)
				.values({...data, id, createdAt: now})
				.returning()
				.get()
		},

		list(options: {status?: string; limit?: number; offset?: number} = {}): DownloadHistory[] {
			const conditions = []
			if (options.status) {
				conditions.push(eq(downloadHistory.status, options.status))
			}
			const where = conditions.length > 0 ? and(...conditions) : undefined

			let query = db.select().from(downloadHistory).where(where).orderBy(desc(downloadHistory.finishedAt))

			if (options.limit) {
				query = query.limit(options.limit) as typeof query
			}
			if (options.offset) {
				query = query.offset(options.offset) as typeof query
			}

			return query.all()
		},

		listByMediaId(mediaId: string): DownloadHistory[] {
			return db.select().from(downloadHistory).where(eq(downloadHistory.mediaId, mediaId)).orderBy(desc(downloadHistory.finishedAt)).all()
		},

		update(id: string, data: Partial<Omit<NewDownloadHistory, 'id' | 'createdAt'>>): DownloadHistory | null {
			return db.update(downloadHistory).set(data).where(eq(downloadHistory.id, id)).returning().get() ?? null
		},

		count(): number {
			const result = db.select({count: sql<number>`count(*)`}).from(downloadHistory).get()
			return result?.count ?? 0
		},

		countByStatus(): Record<string, number> {
			const rows = db.select({status: downloadHistory.status, count: sql<number>`count(*)`}).from(downloadHistory).groupBy(downloadHistory.status).all()
			return Object.fromEntries(rows.map((r: {status: string | null; count: number}) => [r.status, r.count])) as Record<string, number>
		}
	}
}
