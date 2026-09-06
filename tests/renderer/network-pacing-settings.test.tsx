import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {NetworkPacingSettings} from '@renderer/components/wizard/NetworkPacingSettings.js'
import {useAppStore} from '@renderer/store/useAppStore.js'
import {defaultAppSettings} from '@shared/constants.js'
import {buildMockAppApi} from '../shared/mockAppApi.js'

function setup() {
	const api = buildMockAppApi()
	Object.defineProperty(window, 'appApi', {value: api, writable: true, configurable: true})
	const settings = defaultAppSettings('/tmp')
	useAppStore.setState({settings: {...settings, common: {...settings.common, networkPacingPreset: 'custom'}}})
	return api
}

describe('NetworkPacingSettings', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('regression: shows an error instead of silently discarding an invalid custom value', async () => {
		// Previously onFieldBlur just `return`ed on a failed schema parse — the
		// invalid draft stayed in the input with no indication anything was wrong.
		const api = setup()
		render(<NetworkPacingSettings />)

		const input = screen.getByTestId('pacing-sleep-requests')
		fireEvent.change(input, {target: {value: '-5'}})
		fireEvent.blur(input)

		expect(await screen.findByTestId('pacing-sleep-requests-error')).toHaveTextContent('Enter a valid, non-negative number.')
		expect(input).toHaveAttribute('aria-invalid', 'true')
		expect(api.settings.update).not.toHaveBeenCalled()
	})

	it('clears the error and saves once a valid value is entered', async () => {
		const api = setup()
		render(<NetworkPacingSettings />)

		const input = screen.getByTestId('pacing-sleep-requests')
		fireEvent.change(input, {target: {value: '-5'}})
		fireEvent.blur(input)
		expect(await screen.findByTestId('pacing-sleep-requests-error')).toBeInTheDocument()

		fireEvent.change(input, {target: {value: '3'}})
		expect(screen.queryByTestId('pacing-sleep-requests-error')).not.toBeInTheDocument()
		fireEvent.blur(input)

		await vi.waitFor(() => {
			expect(api.settings.update).toHaveBeenCalledWith({common: {pacingSleepRequests: 3}})
		})
	})
})
