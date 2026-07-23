export class BinaryManager {
	getPath(): string {
		return 'yt-dlp'
	}
	ensureLatest(): Promise<void> {
		// noop
		return Promise.resolve()
	}
}
