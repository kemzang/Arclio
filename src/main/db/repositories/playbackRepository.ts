import {eq, desc} from 'drizzle-orm'
import type {DrizzleDatabase} from '../connection.js'
import {playbackHistory, type PlaybackHistory, type NewPlaybackHistory} from '../schema.js'
import {randomUUID} from 'node:crypto'

export interface PlaybackRepo {
	create(data: Omit<NewPlaybackHistory, 'id' | 'createdAt'>): PlaybackHistory
	getByMediaId(mediaId: string): PlaybackHistory | null
	updatePosition(mediaId: string, position: number, duration: number): void
	listRecent(limit?: number): PlaybackHistory[]
	deleteByMediaId(mediaId: string): boolean
}

export function createPlaybackRepository(db: DrizzleDatabase): PlaybackRepo {
	return {
		create(data: Omit<NewPlaybackHistory, 'id' | 'createdAt'>): PlaybackHistory {
			const id = randomUUID()
			const now = new Date().toISOString()
			return db
				.insert(playbackHistory)
				.values({...data, id, createdAt: now})
				.returning()
				.get()
		},

		getByMediaId(mediaId: string): PlaybackHistory | null {
			return db.select().from(playbackHistory).where(eq(playbackHistory.mediaId, mediaId)).get() ?? null
		},

		updatePosition(mediaId: string, position: number, duration: number): void {
			const existing = this.getByMediaId(mediaId)
			const now = new Date().toISOString()

			if (existing) {
				const completed = duration > 0 && position / duration > 0.95 ? 1 : 0
				db.update(playbackHistory)
					.set({lastPosition: position, duration, playCount: existing.playCount + 1, completed: existing.completed || completed ? 1 : 0, lastOpenedAt: now})
					.where(eq(playbackHistory.mediaId, mediaId))
					.run()
			} else {
				this.create({mediaId, lastPosition: position, duration, playCount: 1, completed: 0, lastOpenedAt: now})
			}
		},

		listRecent(limit = 50): PlaybackHistory[] {
			return db.select().from(playbackHistory).orderBy(desc(playbackHistory.lastOpenedAt)).limit(limit).all()
		},

		deleteByMediaId(mediaId: string): boolean {
			return db.delete(playbackHistory).where(eq(playbackHistory.mediaId, mediaId)).run().changes > 0
		}
	}
}
