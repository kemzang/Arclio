export class PhaseExecutor {
	execute(_phase: string, _args: string[]): Promise<{exitCode: number; output: string}> {
		return Promise.resolve({exitCode: 0, output: ''})
	}
}
