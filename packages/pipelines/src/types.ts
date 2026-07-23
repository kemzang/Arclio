export interface PipelineStep {
	id: string
	name: string
	execute: (input: unknown) => Promise<unknown>
}

export interface Trigger {
	id: string
	event: string
	condition?: (payload: unknown) => boolean
}

export interface PipelineDefinition {
	id: string
	name: string
	steps: PipelineStep[]
	trigger: Trigger
}
