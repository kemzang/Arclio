export interface ParsedQuery {
	terms: string[]
	filters: Record<string, string>
}

export function parseQuery(raw: string): ParsedQuery {
	const terms: string[] = []
	const filters: Record<string, string> = {}

	const tokens = raw.split(/\s+/)
	for (const token of tokens) {
		const match = /^(\w+):(.+)$/.exec(token)
		if (match) {
			filters[match[1]] = match[2]
		} else {
			terms.push(token)
		}
	}

	return {terms, filters}
}
