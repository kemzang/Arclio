import {eq, sql} from 'drizzle-orm'
import type {DrizzleDatabase} from '../connection.js'
import {tag, mediaTag, type Tag, type NewTag} from '../schema.js'
import {randomUUID} from 'node:crypto'

export interface TagWithCount extends Tag {
	mediaCount: number
}

export interface TagRepo {
	create(data: Omit<NewTag, 'id' | 'createdAt'>): Tag
	getById(id: string): Tag | null
	getByName(name: string): Tag | null
	list(): TagWithCount[]
	update(id: string, data: Partial<Omit<NewTag, 'id' | 'createdAt'>>): Tag | null
	delete(id: string): boolean
	addToMedia(tagId: string, mediaId: string): void
	removeFromMedia(tagId: string, mediaId: string): void
	getTagsForMedia(mediaId: string): Tag[]
	getMediaIdsForTag(tagId: string): string[]
}

export function createTagRepository(db: DrizzleDatabase): TagRepo {
	return {
		create(data: Omit<NewTag, 'id' | 'createdAt'>): Tag {
			const id = randomUUID()
			const now = new Date().toISOString()
			return db
				.insert(tag)
				.values({...data, id, createdAt: now})
				.returning()
				.get()
		},

		getById(id: string): Tag | null {
			return db.select().from(tag).where(eq(tag.id, id)).get() ?? null
		},

		getByName(name: string): Tag | null {
			return db.select().from(tag).where(eq(tag.name, name)).get() ?? null
		},

		list(): TagWithCount[] {
			const rows = db.select().from(tag).all()

			return rows.map((row: typeof tag.$inferSelect) => {
				const countResult = db.select({count: sql<number>`count(*)`}).from(mediaTag).where(eq(mediaTag.tagId, row.id)).get()

				return {...row, mediaCount: countResult?.count ?? 0}
			})
		},

		update(id: string, data: Partial<Omit<NewTag, 'id' | 'createdAt'>>): Tag | null {
			return db.update(tag).set(data).where(eq(tag.id, id)).returning().get() ?? null
		},

		delete(id: string): boolean {
			return db.delete(tag).where(eq(tag.id, id)).run().changes > 0
		},

		addToMedia(tagId: string, mediaId: string): void {
			db.insert(mediaTag).values({tagId, mediaId}).onConflictDoNothing().run()
		},

		removeFromMedia(tagId: string, mediaId: string): void {
			db.delete(mediaTag).where(sql`${mediaTag.tagId} = ${tagId} AND ${mediaTag.mediaId} = ${mediaId}`).run()
		},

		getTagsForMedia(mediaId: string): Tag[] {
			return db
				.select()
				.from(tag)
				.innerJoin(mediaTag, eq(tag.id, mediaTag.tagId))
				.where(eq(mediaTag.mediaId, mediaId))
				.all()
				.map((r: {tag: typeof tag.$inferSelect}) => r.tag)
		},

		getMediaIdsForTag(tagId: string): string[] {
			const rows = db.select({mediaId: mediaTag.mediaId}).from(mediaTag).where(eq(mediaTag.tagId, tagId)).all()
			return rows.map((r: {mediaId: string}) => r.mediaId)
		}
	}
}
