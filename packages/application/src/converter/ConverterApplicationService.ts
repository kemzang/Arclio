import {EventBus} from '@arclio/events'

export interface ConversionInput {
	sourcePath: string
	outputPath: string
	format: string
}

export class ConverterApplicationService {
	#events: EventBus

	constructor(events: EventBus) {
		this.#events = events
	}

	run(input: ConversionInput): Promise<void> {
		this.#events.emit('converter:started', input)
		// Stub
		this.#events.emit('converter:completed', input)
		return Promise.resolve()
	}
}
