import type {ConversionJob} from './types'

export class ConversionQueue {
	#jobs: ConversionJob[] = []
	#running = false
	#concurrency = 1

	constructor(concurrency = 1) {
		this.#concurrency = concurrency
	}

	add(job: ConversionJob): void {
		this.#jobs.push(job)
		void this.#process()
	}

	getJobs(): ConversionJob[] {
		return [...this.#jobs]
	}

	#process(): Promise<void> {
		if (this.#running) return Promise.resolve()
		this.#running = true

		while (this.#jobs.some(j => j.status === 'pending')) {
			const pending = this.#jobs.filter(j => j.status === 'pending')
			for (const job of pending.slice(0, this.#concurrency)) {
				job.status = 'running'
				job.status = 'completed'
				job.progress = 100
			}
		}

		this.#running = false
		return Promise.resolve()
	}
}
