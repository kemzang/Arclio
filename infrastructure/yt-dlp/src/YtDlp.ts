export class YtDlp {
	probe(_url: string): Promise<unknown> {
		return Promise.resolve({})
	}
	download(_url: string, _output: string, _args: string[]): Promise<{exitCode: number}> {
		return Promise.resolve({exitCode: 0})
	}
}
