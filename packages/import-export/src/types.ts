export interface ImportResult {
	imported: number
	errors: string[]
}
export interface ExportResult {
	path: string
	count: number
}
export interface Importer {
	import(source: string): Promise<ImportResult>
}
export interface Exporter {
	export(data: unknown): Promise<ExportResult>
}
