export class FFmpegRunner {
	run(_args: string[]): Promise<{exitCode: number; output: string}> {
		return Promise.resolve({exitCode: 0, output: ''})
	}

	runWithProgress(_args: string[], _onProgress: (p: {percent: number; fps: number}) => void): Promise<{exitCode: number}> {
		return Promise.resolve({exitCode: 0})
	}
}
