import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it, vi} from 'vitest'

const handleCalls: {channel: string; fn: (e: unknown, payload?: unknown) => unknown}[] = []

vi.mock('electron', () => ({
	app: {getPath: vi.fn().mockReturnValue('/tmp/downloads')},
	dialog: {showOpenDialog: vi.fn()},
	shell: {openPath: vi.fn().mockResolvedValue(''), openExternal: vi.fn(), showItemInFolder: vi.fn()},
	ipcMain: {
		handle: vi.fn().mockImplementation((channel: string, fn: (e: unknown, payload?: unknown) => unknown) => {
			handleCalls.push({channel, fn})
		}),
		removeHandler: vi.fn()
	}
}))

const {registerFileHandlers} = await import('@main/ipc/fileHandlers.js')
const {IPC_CHANNELS} = await import('@shared/ipc.js')
const {shell} = await import('electron')

function findCall(channel: string) {
	const call = handleCalls.findLast(c => c.channel === channel)
	if (!call) throw new Error(`no handler registered for ${channel}`)
	return call.fn
}

const mainWindow = {} as never
const binaryManager = {} as never

async function tempDir(): Promise<string> {
	return fs.mkdtemp(path.join(os.tmpdir(), 'file-handlers-'))
}

afterEach(() => {
	vi.clearAllMocks()
})

describe('shellOpenFolder', () => {
	it('opens a real directory', async () => {
		handleCalls.length = 0
		registerFileHandlers(mainWindow, binaryManager)
		const dir = await tempDir()

		const result = await findCall(IPC_CHANNELS.shellOpenFolder)({}, dir)

		expect(result).toEqual({ok: true, data: {opened: true}})
		expect(shell.openPath).toHaveBeenCalledWith(dir)
	})

	it('regression: refuses to open a file path (would execute it via OS file association)', async () => {
		handleCalls.length = 0
		registerFileHandlers(mainWindow, binaryManager)
		const dir = await tempDir()
		const filePath = path.join(dir, 'not-a-folder.sh')
		await fs.writeFile(filePath, '#!/bin/sh\necho pwned\n')

		const result = (await findCall(IPC_CHANNELS.shellOpenFolder)({}, filePath)) as {ok: boolean}

		expect(result.ok).toBe(false)
		expect(shell.openPath).not.toHaveBeenCalled()
	})

	it('regression: refuses a nonexistent path instead of forwarding it to shell.openPath', async () => {
		handleCalls.length = 0
		registerFileHandlers(mainWindow, binaryManager)

		const result = (await findCall(IPC_CHANNELS.shellOpenFolder)({}, '/nonexistent/path/xyz')) as {ok: boolean}

		expect(result.ok).toBe(false)
		expect(shell.openPath).not.toHaveBeenCalled()
	})
})
