export interface ImageMetadataFields {
	width: number
	height: number
	format: string
	colorSpace?: string
	exif?: Record<string, unknown>
}
