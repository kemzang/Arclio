import type {GetState, SetState} from '../types.js'

// One gate can be open at a time — a second call while the dialog is already
// showing reuses the same pending promise instead of racing a second one.
let pendingResolve: ((connected: boolean) => void) | null = null

/**
 * Resolves once the user has a connected Arclio account, or `false` if they
 * cancel. Already-connected callers resolve immediately without opening
 * anything. Callers await this before doing any download work.
 */
export function ensureAccountConnected(set: SetState, get: GetState): Promise<boolean> {
	if (get().accountGateOpen && pendingResolve) {
		return new Promise(resolve => {
			const previous = pendingResolve
			pendingResolve = connected => {
				previous?.(connected)
				resolve(connected)
			}
		})
	}
	return new Promise(resolve => {
		void window.appApi.account.status().then(status => {
			if (status.connected) {
				resolve(true)
				return
			}
			pendingResolve = resolve
			set({accountGateOpen: true})
		})
	})
}

// Called by the store's resolveAccountGate action once the dialog settles
// (connected or cancelled) — kept separate from the slice so the promise
// bookkeeping stays out of the store definition itself.
export function settleAccountGate(connected: boolean): void {
	const resolve = pendingResolve
	pendingResolve = null
	resolve?.(connected)
}
