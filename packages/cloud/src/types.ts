export interface CloudConfig {
	endpoint: string
	apiKey: string
}
export interface CloudStorage {
	upload(path: string): Promise<string>
	download(url: string): Promise<string>
}
