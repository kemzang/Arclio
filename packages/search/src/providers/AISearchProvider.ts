import type {SearchProvider, SearchQuery, SearchResult} from '../types'

export class AISearchProvider implements SearchProvider {
	search(_query: SearchQuery): Promise<SearchResult[]> {
		return Promise.resolve([])
	}
	index(_document: {id: string; mediaId: string; title: string; content: string}): Promise<void> {
		// noop
		return Promise.resolve()
	}
	remove(_id: string): Promise<void> {
		// noop
		return Promise.resolve()
	}
	rebuild(): Promise<void> {
		// noop
		return Promise.resolve()
	}
}
