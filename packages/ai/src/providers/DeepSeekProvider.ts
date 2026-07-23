import type {AIProvider} from '../types'
export class DeepSeekProvider implements AIProvider {
	chat(_messages: Array<{role: string; content: string}>): Promise<string> {
		return Promise.resolve('')
	}
	generate(_prompt: string): Promise<string> {
		return Promise.resolve('')
	}
}
