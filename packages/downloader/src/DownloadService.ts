import type {DownloadProgress, DownloadResult} from './types'

export class DownloadService {
	download(_url: string, output: string, _onProgress?: (_p: DownloadProgress) => void): Promise<DownloadResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	cancel(_id: string): Promise<void> {
		// noop
		return Promise.resolve()
	}
	pause(_id: string): Promise<void> {
		// noop
		return Promise.resolve()
	}
	resume(_id: string): Promise<void> {
		// noop
		return Promise.resolve()
	}
}
