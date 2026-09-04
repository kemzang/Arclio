export interface TokenProvider {
	// signal lets a caller (warmup cancel, a download's own abort) give up on
	// a hidden-window load that never settles instead of waiting forever.
	ensureReady(signal?: AbortSignal): Promise<void>
	getVisitorData(): Promise<string>
	mintToken(contentBinding: string): Promise<string>
	releaseWindow(): void
	dispose(): void
}
