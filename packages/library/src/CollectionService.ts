import type {Collection} from './types'

export class CollectionService {
	#collections = new Map<string, Collection>()

	create(name: string, description?: string): Collection {
		const now = new Date()
		const collection: Collection = {id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, description, itemIds: [], createdAt: now, updatedAt: now}
		this.#collections.set(collection.id, collection)
		return collection
	}

	addItems(collectionId: string, itemIds: string[]): void {
		const col = this.#collections.get(collectionId)
		if (!col) throw new Error(`Collection ${collectionId} not found`)
		for (const id of itemIds) {
			if (!col.itemIds.includes(id)) {
				col.itemIds.push(id)
			}
		}
		col.updatedAt = new Date()
	}

	removeItems(collectionId: string, itemIds: string[]): void {
		const col = this.#collections.get(collectionId)
		if (!col) return
		col.itemIds = col.itemIds.filter(id => !itemIds.includes(id))
		col.updatedAt = new Date()
	}

	get(id: string): Collection | undefined {
		return this.#collections.get(id)
	}

	list(): Collection[] {
		return Array.from(this.#collections.values())
	}

	delete(id: string): void {
		this.#collections.delete(id)
	}
}
