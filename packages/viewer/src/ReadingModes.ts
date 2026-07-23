import type {ReadingMode} from './types'

export const READING_MODES: ReadingMode[] = ['page-by-page', 'vertical-scroll', 'double-page']

export function getDefaultReadingMode(): ReadingMode {
	return 'page-by-page'
}
