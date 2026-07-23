import {execSync} from 'node:child_process'
import os from 'node:os'

export interface DiskSpaceInfo {
	total: number
	free: number
	used: number
}

export function getDiskSpace(mountPoint: string): DiskSpaceInfo {
	if (os.platform() === 'win32') {
		const output = execSync(`wmic logicaldisk where "DeviceID='${mountPoint}'" get FreeSpace,Size /format:list`, {encoding: 'utf-8'})
		const free = parseInt(/FreeSpace=(\d+)/.exec(output)?.[1] ?? '0', 10)
		const total = parseInt(/Size=(\d+)/.exec(output)?.[1] ?? '0', 10)
		return {total, free, used: total - free}
	}
	const output = execSync(`df -B1 "${mountPoint}" | tail -1`, {encoding: 'utf-8'})
	const parts = output.split(/\s+/)
	const total = parseInt(parts[1], 10)
	const used = parseInt(parts[2], 10)
	const free = parseInt(parts[3], 10)
	return {total, free, used}
}

export function hasEnoughSpace(dir: string, requiredBytes: number): boolean {
	try {
		const {free} = getDiskSpace(dir)
		return free >= requiredBytes
	} catch {
		return false
	}
}
