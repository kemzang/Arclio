import {IPC_CHANNELS} from '@shared/ipc.js'
import {updateSettingsSchema} from '@shared/schemas.js'
import {ok} from '@shared/result.js'
import type {SettingsStore} from '@main/stores/SettingsStore.js'
import type {ClipboardWatcher} from '@main/services/ClipboardWatcher.js'
import {setAnalyticsEnabled} from '@main/services/analytics.js'
import {buildCommonPaths, handle, handleRaw, toUnknownFailure} from './utils.js'

interface SettingsHandlerDeps {
	settingsStore: SettingsStore
	clipboardWatcher: ClipboardWatcher
}

export function registerSettingsHandlers(deps: SettingsHandlerDeps): void {
	const {settingsStore, clipboardWatcher} = deps

	handleRaw(IPC_CHANNELS.settingsGet, async () => {
		try {
			const settings = await settingsStore.get()
			return ok({...settings, common: {...settings.common, commonPaths: buildCommonPaths()}})
		} catch (error) {
			return toUnknownFailure(error)
		}
	})

	handle(IPC_CHANNELS.settingsUpdate, updateSettingsSchema, async data => {
		const updated = await settingsStore.update(data)
		clipboardWatcher.setEnabled(updated.common.clipboardWatchEnabled)
		if (data.common?.analyticsEnabled !== undefined) {
			setAnalyticsEnabled(updated.common.analyticsEnabled ?? true)
		}
		return ok(updated)
	})

	handleRaw(IPC_CHANNELS.settingsReset, async () => {
		try {
			const restored = await settingsStore.reset()
			// Side effects that track settings must follow the restored values.
			clipboardWatcher.setEnabled(restored.common.clipboardWatchEnabled)
			setAnalyticsEnabled(restored.common.analyticsEnabled ?? true)
			return ok({...restored, common: {...restored.common, commonPaths: buildCommonPaths()}})
		} catch (error) {
			return toUnknownFailure(error)
		}
	})
}
