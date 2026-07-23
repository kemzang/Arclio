import type {Trigger} from './types'

export function createTrigger(id: string, event: string, condition?: (payload: unknown) => boolean): Trigger {
	return {id, event, condition}
}
