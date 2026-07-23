import type {SearchFilters as Filters} from './types'

export function createFilters(overrides: Partial<Filters> = {}): Filters {
	return {mediaType: overrides.mediaType, dateFrom: overrides.dateFrom, dateTo: overrides.dateTo, tags: overrides.tags, collections: overrides.collections, isFavorite: overrides.isFavorite}
}

export function mergeFilters(base: Filters, overrides: Partial<Filters>): Filters {
	return {...base, ...overrides}
}
