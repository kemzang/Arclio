export interface ShareLink {
	id: string
	mediaId: string
	url: string
	expiresAt?: Date
}
export interface SharePlatform {
	name: string
	shareUrl: string
}
