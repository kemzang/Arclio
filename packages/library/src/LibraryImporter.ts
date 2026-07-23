import type {LibraryItem} from './types'
import type {MediaRecord} from '@arclio/media-indexer'

export class LibraryImporter {
	#items = new Map<string, LibraryItem>()

	importMedia(record: MediaRecord): Promise<LibraryItem> {
		const item: LibraryItem = {id: `lib-${record.id}`, mediaId: record.id, addedAt: new Date(), playCount: 0}
		this.#items.set(item.id, item)
		return Promise.resolve(item)
	}

	importBatch(records: MediaRecord[]): Promise<LibraryItem[]> {
		return Promise.all(records.map(r => this.importMedia(r)))
	}

	getItem(id: string): LibraryItem | undefined {
		return this.#items.get(id)
	}

	listItems(): LibraryItem[] {
		return Array.from(this.#items.values())
	}
}
