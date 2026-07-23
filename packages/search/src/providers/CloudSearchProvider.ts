import type {SearchProvider, SearchQuery, SearchResult} from '../types'

export class CloudSearchProvider implements SearchProvider {
	search(_query: SearchQuery): Promise<SearchResult[]> {
		return Promise.resolve([])
	}
	async index(_document: {id: string; mediaId: string; title: string; content: string}): Promise<void> {
		// noop
	}
	async remove(_id: string): Promise<void> {
		// noop
	}
	async rebuild(): Promise<void> {
		// noop
	}
}
