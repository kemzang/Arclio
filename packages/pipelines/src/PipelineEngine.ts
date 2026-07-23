import type {PipelineDefinition} from './types'

export class PipelineEngine {
	#pipelines = new Map<string, PipelineDefinition>()

	register(pipeline: PipelineDefinition): void {
		this.#pipelines.set(pipeline.id, pipeline)
	}

	async execute(pipelineId: string, input: unknown): Promise<unknown> {
		const pipeline = this.#pipelines.get(pipelineId)
		if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`)

		let result = input
		for (const step of pipeline.steps) {
			result = await step.execute(result)
		}
		return result
	}

	list(): PipelineDefinition[] {
		return Array.from(this.#pipelines.values())
	}
}
