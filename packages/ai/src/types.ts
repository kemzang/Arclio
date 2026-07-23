export interface AIProvider {
	chat(messages: Array<{role: string; content: string}>): Promise<string>
	generate(prompt: string): Promise<string>
}
export interface AIConfig {
	provider: string
	apiKey: string
	model: string
}
