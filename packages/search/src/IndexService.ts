import type {SearchProvider} from './types'

export class IndexService {
	#provider: SearchProvider

	constructor(provider: SearchProvider) {
		this.#provider = provider
	}

	async indexAll(documents: Array<{id: string; mediaId: string; title: string; content: string}>): Promise<void> {
		for (const doc of documents) {
			await this.#provider.index(doc)
		}
	}

	async removeFromIndex(id: string): Promise<void> {
		await this.#provider.remove(id)
	}

	async rebuildIndex(): Promise<void> {
		await this.#provider.rebuild()
	}
}
