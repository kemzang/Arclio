export interface DownloadProgress {
	bytesDownloaded: number
	totalBytes: number
	percent: number
	speed: number
}
export interface DownloadResult {
	outputPath: string
	size: number
	duration: number
}
