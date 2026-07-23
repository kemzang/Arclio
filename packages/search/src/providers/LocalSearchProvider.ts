import type {SearchProvider, SearchQuery, SearchResult} from '../types'

export class LocalSearchProvider implements SearchProvider {
	#documents = new Map<string, {id: string; mediaId: string; title: string; content: string}>()

	search(query: SearchQuery): Promise<SearchResult[]> {
		const results: SearchResult[] = []
		const lowerQuery = query.text.toLowerCase()

		for (const doc of this.#documents.values()) {
			const titleMatch = doc.title.toLowerCase().includes(lowerQuery)
			const contentMatch = doc.content.toLowerCase().includes(lowerQuery)
			if (titleMatch || contentMatch) {
				results.push({id: doc.id, mediaId: doc.mediaId, title: doc.title, score: titleMatch ? 1.0 : 0.5})
			}
		}

		return Promise.resolve(results.slice(0, query.limit ?? 50))
	}

	index(document: {id: string; mediaId: string; title: string; content: string}): Promise<void> {
		this.#documents.set(document.id, document)
		return Promise.resolve()
	}

	remove(id: string): Promise<void> {
		this.#documents.delete(id)
		return Promise.resolve()
	}

	rebuild(): Promise<void> {
		this.#documents.clear()
		return Promise.resolve()
	}
}
