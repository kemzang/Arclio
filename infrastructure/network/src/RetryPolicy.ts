export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn()
		} catch {
			if (i === maxRetries - 1) throw new Error('max retries exceeded')
			await new Promise(r => setTimeout(r, delayMs))
		}
	}
	throw new Error('unreachable')
}
