export interface ProbeResult {
	title: string
	duration: number
	formats: unknown[]
	thumbnail: string
}

export class ProbeApplicationService {
	probe(_url: string): Promise<ProbeResult> {
		return Promise.resolve({title: '', duration: 0, formats: [], thumbnail: ''})
	}
}
