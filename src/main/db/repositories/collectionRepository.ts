import {eq, asc, sql} from 'drizzle-orm'
import type {DrizzleDatabase} from '../connection.js'
import {collection, collectionMedia, media, type Collection, type NewCollection} from '../schema.js'
import {randomUUID} from 'node:crypto'

export interface CollectionWithCount extends Collection {
	mediaCount: number
	coverThumbnailUrl: string | null
}

export interface CollectionRepo {
	create(data: Omit<NewCollection, 'id' | 'createdAt' | 'updatedAt'>): Collection
	getById(id: string): Collection | null
	list(): CollectionWithCount[]
	update(id: string, data: Partial<Omit<NewCollection, 'id' | 'createdAt'>>): Collection | null
	delete(id: string): boolean
	addMedia(collectionId: string, mediaId: string): void
	removeMedia(collectionId: string, mediaId: string): void
	getMediaIds(collectionId: string): string[]
	getCollectionIdsForMedia(mediaId: string): string[]
}

export function createCollectionRepository(db: DrizzleDatabase): CollectionRepo {
	return {
		create(data: Omit<NewCollection, 'id' | 'createdAt' | 'updatedAt'>): Collection {
			const id = randomUUID()
			const now = new Date().toISOString()
			return db
				.insert(collection)
				.values({...data, id, createdAt: now, updatedAt: now})
				.returning()
				.get()
		},

		getById(id: string): Collection | null {
			return db.select().from(collection).where(eq(collection.id, id)).get() ?? null
		},

		list(): CollectionWithCount[] {
			const rows = db.select().from(collection).orderBy(asc(collection.sortOrder)).all()

			return rows.map((row: typeof collection.$inferSelect) => {
				const countResult = db.select({count: sql<number>`count(*)`}).from(collectionMedia).where(eq(collectionMedia.collectionId, row.id)).get()

				// Get first media thumbnail as cover
				const cover = db.select({thumbnailUrl: media.thumbnailUrl}).from(collectionMedia).innerJoin(media, eq(collectionMedia.mediaId, media.id)).where(eq(collectionMedia.collectionId, row.id)).limit(1).get()

				return {...row, mediaCount: countResult?.count ?? 0, coverThumbnailUrl: cover?.thumbnailUrl ?? null}
			})
		},

		update(id: string, data: Partial<Omit<NewCollection, 'id' | 'createdAt'>>): Collection | null {
			const now = new Date().toISOString()
			return (
				db
					.update(collection)
					.set({...data, updatedAt: now})
					.where(eq(collection.id, id))
					.returning()
					.get() ?? null
			)
		},

		delete(id: string): boolean {
			return db.delete(collection).where(eq(collection.id, id)).run().changes > 0
		},

		addMedia(collectionId: string, mediaId: string): void {
			const now = new Date().toISOString()
			db.insert(collectionMedia).values({collectionId, mediaId, sortOrder: 0, addedAt: now}).onConflictDoNothing().run()
		},

		removeMedia(collectionId: string, mediaId: string): void {
			db.delete(collectionMedia).where(sql`${collectionMedia.collectionId} = ${collectionId} AND ${collectionMedia.mediaId} = ${mediaId}`).run()
		},

		getMediaIds(collectionId: string): string[] {
			const rows = db.select({mediaId: collectionMedia.mediaId}).from(collectionMedia).where(eq(collectionMedia.collectionId, collectionId)).all()
			return rows.map((r: {mediaId: string}) => r.mediaId)
		},

		getCollectionIdsForMedia(mediaId: string): string[] {
			const rows = db.select({collectionId: collectionMedia.collectionId}).from(collectionMedia).where(eq(collectionMedia.mediaId, mediaId)).all()
			return rows.map((r: {collectionId: string}) => r.collectionId)
		}
	}
}
