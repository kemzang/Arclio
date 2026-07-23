export interface SyncProvider {
	push(data: unknown): Promise<void>
	pull(): Promise<unknown>
}
