import type {SearchQuery, SearchResult, SearchProvider} from './types'

export class SearchService {
	#provider: SearchProvider

	constructor(provider: SearchProvider) {
		this.#provider = provider
	}

	async search(query: SearchQuery): Promise<SearchResult[]> {
		return this.#provider.search(query)
	}

	async index(document: {id: string; mediaId: string; title: string; content: string}): Promise<void> {
		await this.#provider.index(document)
	}

	async remove(id: string): Promise<void> {
		await this.#provider.remove(id)
	}

	async rebuild(): Promise<void> {
		await this.#provider.rebuild()
	}
}
