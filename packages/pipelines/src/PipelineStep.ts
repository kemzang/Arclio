import type {PipelineStep} from './types'

export function createStep(id: string, name: string, execute: (input: unknown) => Promise<unknown>): PipelineStep {
	return {id, name, execute}
}
