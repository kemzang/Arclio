export function rankResults(results: Array<{id: string; score: number}>, sortBy: 'score' | 'date' | 'title' = 'score'): Array<{id: string; score: number}> {
	return [...results].sort((a, b) => {
		if (sortBy === 'score') return b.score - a.score
		return 0
	})
}
