export interface SearchResult {
	id: string
	mediaId: string
	title: string
	score: number
	highlights?: string[]
}

export interface SearchQuery {
	text: string
	filters?: SearchFilters
	limit?: number
	offset?: number
}

export interface SearchFilters {
	mediaType?: string
	dateFrom?: Date
	dateTo?: Date
	tags?: string[]
	collections?: string[]
	isFavorite?: boolean
}

export interface SearchProvider {
	search(query: SearchQuery): Promise<SearchResult[]>
	index(document: {id: string; mediaId: string; title: string; content: string}): Promise<void>
	remove(id: string): Promise<void>
	rebuild(): Promise<void>
}
