import {eq} from 'drizzle-orm'
import type {DrizzleDatabase} from '../connection.js'
import {asset, type Asset, type NewAsset} from '../schema.js'
import {randomUUID} from 'node:crypto'

export interface AssetRepo {
	create(data: Omit<NewAsset, 'id' | 'createdAt'>): Asset
	createMany(items: Omit<NewAsset, 'id' | 'createdAt'>[]): Asset[]
	getById(id: string): Asset | null
	getByMediaId(mediaId: string): Asset[]
	getByPath(filePath: string): Asset | null
	update(id: string, data: Partial<Omit<NewAsset, 'id' | 'createdAt'>>): Asset | null
	delete(id: string): boolean
	deleteByMediaId(mediaId: string): boolean
	setStatus(id: string, status: 'AVAILABLE' | 'MISSING'): void
}

export function createAssetRepository(db: DrizzleDatabase): AssetRepo {
	return {
		create(data: Omit<NewAsset, 'id' | 'createdAt'>): Asset {
			const id = randomUUID()
			const now = new Date().toISOString()
			return db
				.insert(asset)
				.values({...data, id, createdAt: now})
				.returning()
				.get()
		},

		createMany(items: Omit<NewAsset, 'id' | 'createdAt'>[]): Asset[] {
			const now = new Date().toISOString()
			return items.map(data => {
				const id = randomUUID()
				return db
					.insert(asset)
					.values({...data, id, createdAt: now})
					.returning()
					.get()
			})
		},

		getById(id: string): Asset | null {
			return db.select().from(asset).where(eq(asset.id, id)).get() ?? null
		},

		getByMediaId(mediaId: string): Asset[] {
			return db.select().from(asset).where(eq(asset.mediaId, mediaId)).all()
		},

		getByPath(filePath: string): Asset | null {
			return db.select().from(asset).where(eq(asset.path, filePath)).get() ?? null
		},

		update(id: string, data: Partial<Omit<NewAsset, 'id' | 'createdAt'>>): Asset | null {
			return db.update(asset).set(data).where(eq(asset.id, id)).returning().get() ?? null
		},

		delete(id: string): boolean {
			return db.delete(asset).where(eq(asset.id, id)).run().changes > 0
		},

		deleteByMediaId(mediaId: string): boolean {
			return db.delete(asset).where(eq(asset.mediaId, mediaId)).run().changes > 0
		},

		setStatus(id: string, status: 'AVAILABLE' | 'MISSING'): void {
			db.update(asset).set({status}).where(eq(asset.id, id)).run()
		}
	}
}
