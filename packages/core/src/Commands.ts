export type CommandType = 'download' | 'convert' | 'scan' | 'search' | 'view'

export interface Command<T = unknown> {
	type: CommandType
	payload: T
}

export function createCommand<T>(type: CommandType, payload: T): Command<T> {
	return {type, payload}
}
