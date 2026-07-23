export interface ConversionOptions {
	outputFormat: string
	quality?: 'low' | 'medium' | 'high'
	preset?: string
}

export interface ConversionResult {
	outputPath: string
	size: number
	duration: number
}

export interface ConversionStep {
	name: string
	args: string[]
}

export interface ConversionChain {
	id: string
	name: string
	steps: ConversionStep[]
}

export interface ConversionPreset {
	id: string
	name: string
	format: string
	quality: 'low' | 'medium' | 'high'
	options: Record<string, string>
}

export interface ConversionJob {
	id: string
	sourcePath: string
	outputPath: string
	progress: number
	status: 'pending' | 'running' | 'completed' | 'failed'
	error?: string
}
