export interface Source {
	id: string
	name: string
	type: 'folder' | 'nas' | 'cloud' | 'ftp'
	path: string
	enabled: boolean
	lastScan?: Date
}

export interface SourceFile {
	path: string
	name: string
	size: number
	extension: string
	modifiedAt: Date
}

export interface SourceScanResult {
	sourceId: string
	files: SourceFile[]
	errors: string[]
	scannedAt: Date
}
