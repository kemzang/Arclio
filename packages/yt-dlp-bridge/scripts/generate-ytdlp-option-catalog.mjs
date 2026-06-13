import {mkdirSync, writeFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {spawnSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const outputPath = resolve(scriptDir, '../src/generated/ytdlp-options.json')
const extractorPath = resolve(scriptDir, 'extract-ytdlp-options.py')
const python = process.env.PYTHON ?? 'python3'
const env = {...process.env}

const result = spawnSync(python, [extractorPath], {encoding: 'utf8', env})

if (result.error) {
	console.error(result.error.message)
	process.exit(1)
}

if (result.status !== 0 || result.status === null) {
	process.stderr.write(result.stderr)
	process.stderr.write(result.stdout)
	process.exit(result.status ?? 1)
}

mkdirSync(dirname(outputPath), {recursive: true})
writeFileSync(outputPath, result.stdout)
console.error(`Wrote ${outputPath}`)
