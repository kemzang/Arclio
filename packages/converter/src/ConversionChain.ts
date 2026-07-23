import type {ConversionStep, ConversionResult} from './types'

export class ConversionChainEngine {
	#steps: ConversionStep[] = []

	addStep(step: ConversionStep): void {
		this.#steps.push(step)
	}

	getSteps(): ConversionStep[] {
		return [...this.#steps]
	}

	clear(): void {
		this.#steps = []
	}

	execute(_input: string, output: string): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}
}
