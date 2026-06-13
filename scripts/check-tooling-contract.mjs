#!/usr/bin/env node
import {existsSync, readFileSync, readdirSync} from 'node:fs'
import {basename, dirname, join, relative, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const DEFAULT_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const REQUIRED_PACKAGE_SCRIPTS = ['typecheck', 'test', 'build', 'prepack', 'pack:dry-run']
const PUBLISH_DEPENDENCY_SECTIONS = ['dependencies', 'peerDependencies', 'optionalDependencies']
const ROOT_DEPENDENCY_SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies']
const PACKAGE_TOOLING_CONFIG_PATTERNS = [/^\.oxlintrc(?:\..*)?$/, /^oxlint\.config\./, /^eslint\.config\./, /^\.eslintrc(?:\..*)?$/, /^biome\.jsonc?$/, /^\.prettierrc(?:\..*)?$/, /^prettier\.config\./]
const COMMAND_SCAN_ROOTS = ['package.json', 'AGENTS.md', 'CONTRIBUTING.md', 'dev-docs', 'scripts', '.github', 'packages']
const COMMAND_SCAN_FILE_EXTENSIONS = new Set(['.json', '.jsonc', '.md', '.mjs', '.js', '.ts', '.tsx', '.mts', '.cts', '.yml', '.yaml', '.sh', '.ps1'])
const NPM_CLI_NAME = 'np' + 'm'
const NPX_CLI_NAME = 'np' + 'x'
const NPM_FAMILY_COMMAND_PATTERN = new RegExp(String.raw`\b(?:${NPM_CLI_NAME}|${NPX_CLI_NAME})[ \t]+`)
const NPM_COMMAND_PATTERN = new RegExp(String.raw`\b${NPM_CLI_NAME}[ \t]+`)

function rootFromArgs(argv) {
	const rootIndex = argv.indexOf('--root')
	if (rootIndex === -1) return DEFAULT_ROOT
	const root = argv[rootIndex + 1]
	if (!root) throw new Error('--root requires a path')
	return resolve(root)
}

const repoRoot = rootFromArgs(process.argv.slice(2))

function repoPath(path) {
	return join(repoRoot, path)
}

function posix(path) {
	return path.replaceAll('\\', '/')
}

function display(path) {
	return posix(relative(repoRoot, path))
}

function readJson(path) {
	return JSON.parse(readFileSync(repoPath(path), 'utf8'))
}

function readText(path) {
	return readFileSync(repoPath(path), 'utf8')
}

function isObject(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringMap(value) {
	return isObject(value) ? value : {}
}

function fail(message) {
	failures.push(message)
}

function assert(condition, message) {
	if (!condition) fail(message)
}

function packageDirsFromWorkspaces(workspaces) {
	const dirs = []
	for (const workspace of workspaces) {
		if (workspace.endsWith('/*')) {
			const base = workspace.slice(0, -2)
			const absBase = repoPath(base)
			if (!existsSync(absBase)) continue
			for (const entry of readdirSync(absBase, {withFileTypes: true})) {
				if (!entry.isDirectory()) continue
				const dir = `${base}/${entry.name}`
				if (existsSync(repoPath(`${dir}/package.json`))) dirs.push(dir)
			}
			continue
		}
		if (existsSync(repoPath(`${workspace}/package.json`))) dirs.push(workspace)
	}
	return [...new Set(dirs)].sort((a, b) => a.localeCompare(b))
}

function hasSourceFiles(dir) {
	const abs = repoPath(dir)
	if (!existsSync(abs)) return false
	for (const entry of readdirSync(abs, {withFileTypes: true})) {
		const child = join(abs, entry.name)
		if (entry.isDirectory()) {
			if (hasSourceFiles(display(child))) return true
			continue
		}
		if (/\.(?:ts|tsx|js|mjs|cjs|cts|mts)$/.test(entry.name)) return true
	}
	return false
}

function findPackageConfigFiles(dir) {
	const found = []
	const walk = absDir => {
		for (const entry of readdirSync(absDir, {withFileTypes: true})) {
			if (entry.name === 'node_modules' || entry.name === 'dist') continue
			const abs = join(absDir, entry.name)
			if (entry.isDirectory()) {
				walk(abs)
				continue
			}
			if (PACKAGE_TOOLING_CONFIG_PATTERNS.some(pattern => pattern.test(entry.name))) found.push(display(abs))
		}
	}
	walk(repoPath(dir))
	return found
}

function includeCoversPackage(include, dir) {
	const normalized = posix(include)
	if (normalized.startsWith('!')) return false
	return [normalized === dir, normalized.startsWith(`${dir}/`), normalized.startsWith(`${dir}**`), normalized.includes(`${dir}/**`)].some(Boolean)
}

function hasWorkspaceProtocol(spec) {
	return typeof spec === 'string' && spec.startsWith('workspace:')
}

function extensionFor(path) {
	const name = path.split('/').at(-1) ?? path
	const index = name.lastIndexOf('.')
	return index === -1 ? '' : name.slice(index)
}

function shouldScanCommandFile(path) {
	const normalized = posix(path)
	if (normalized.startsWith('.github/skills/')) return false
	if (normalized.includes('/node_modules/') || normalized.includes('/dist/')) return false
	if (normalized.includes('/src/generated/')) return false
	return COMMAND_SCAN_FILE_EXTENSIONS.has(extensionFor(normalized))
}

function findNpmFamilyCommands() {
	const matches = []
	const scan = absPath => {
		const normalized = display(absPath)
		if (normalized.startsWith('.github/skills/')) return
		const entries = readdirSync(absPath, {withFileTypes: true})
		for (const entry of entries) {
			const child = join(absPath, entry.name)
			const childDisplay = display(child)
			if (entry.isDirectory()) {
				if (entry.name === 'node_modules' || entry.name === 'dist') continue
				if (entry.name === 'generated' && childDisplay.includes('/src/generated')) continue
				if (childDisplay.startsWith('.github/skills/')) continue
				scan(child)
				continue
			}
			if (!shouldScanCommandFile(childDisplay)) continue
			const lines = readFileSync(child, 'utf8').split(/\r?\n/)
			for (const [index, line] of lines.entries()) {
				if (NPM_FAMILY_COMMAND_PATTERN.test(line)) matches.push(`${childDisplay}:${index + 1}: ${line.trim()}`)
			}
		}
	}

	for (const root of COMMAND_SCAN_ROOTS) {
		const abs = repoPath(root)
		if (!existsSync(abs)) continue
		const entry = readdirSync(dirname(abs), {withFileTypes: true}).find(candidate => candidate.name === basename(abs))
		if (!entry) continue
		if (entry.isDirectory()) scan(abs)
		if (entry.isFile() && shouldScanCommandFile(root)) {
			const lines = readText(root).split(/\r?\n/)
			for (const [index, line] of lines.entries()) {
				if (NPM_FAMILY_COMMAND_PATTERN.test(line)) matches.push(`${root}:${index + 1}: ${line.trim()}`)
			}
		}
	}

	return matches
}

const failures = []
const rootPackage = readJson('package.json')
const rootScripts = stringMap(rootPackage.scripts)
const workspaces = Array.isArray(rootPackage.workspaces) ? rootPackage.workspaces : []
const packageDirs = packageDirsFromWorkspaces(workspaces)
const packageRecords = packageDirs.map(dir => ({dir, packageJson: readJson(`${dir}/package.json`)}))
const workspacePackageNames = new Set(packageRecords.map(({packageJson}) => packageJson.name).filter(Boolean))
const biome = readJson('biome.jsonc')
const knip = readJson('knip.json')
const ciWorkflow = readText('.github/workflows/ci.yml')
const publishWorkflows = [
	{path: '.github/workflows/publish-ytdlp-errors.yml', command: 'bun run errors:check'},
	{path: '.github/workflows/publish-yt-dlp-bridge.yml', command: 'bun run bridge:check'}
]
const biomeIncludes = biome.files?.includes ?? []
const knipWorkspaces = knip.workspaces ?? {}
const madgeScript = posix(rootScripts.madge ?? '')

assert(rootPackage.private === true, 'Root package must stay private so workspace-only dependencies are never published from the app package.')
assert(biome.formatter?.enabled !== false, 'Biome formatter must stay enabled.')
assert(biome.linter?.enabled === false, 'Biome linter must stay disabled; Oxlint is the lint authority.')
assert(biome.assist?.enabled === false, 'Biome assist must stay disabled unless the tooling contract is updated.')
assert(rootScripts['lint:prepare'] === 'bun run errors:build', 'Root scripts must expose lint:prepare as the type-aware lint dependency prebuild.')
assert((rootScripts.lint ?? '').startsWith('bun run lint:prepare && oxlint --type-aware .'), 'Root lint script must run lint:prepare before oxlint --type-aware.')
assert(rootScripts['lint:parity'] === undefined, 'lint:parity has been renamed; use check:tooling-parity.')
assert(rootScripts['check:tooling-parity'] === 'node scripts/check-tooling-parity.mjs', 'Root scripts must expose check:tooling-parity.')
assert(rootScripts['check:tooling-contract'] === 'node scripts/check-tooling-contract.mjs', 'Root scripts must expose check:tooling-contract.')
assert(rootScripts['packages:verify-metadata'] === 'node scripts/check-package-publish-metadata.mjs', 'Root scripts must expose packages:verify-metadata.')
assert((rootScripts.check ?? '').includes('bun run check:tooling-parity'), 'Root check must run check:tooling-parity.')
assert((rootScripts.check ?? '').includes('bun run check:tooling-contract'), 'Root check must run check:tooling-contract.')
assert(/&&\s*bun run packages:check\s*$/.test(rootScripts.check ?? ''), 'Root check must finish with packages:check.')
assert(ciWorkflow.includes('run: bun run check'), 'CI workflow must call the canonical root check.')

const lintStaged = stringMap(rootPackage['lint-staged'])
const jsLintStagedCommand = lintStaged['*.{ts,tsx,cts,mts,js,mjs,cjs}'] ?? ''
assert(jsLintStagedCommand.includes('bun run lint:prepare'), 'lint-staged JS/TS command must run lint:prepare before Oxlint.')
assert(jsLintStagedCommand.includes('oxlint --fix --deny-warnings'), 'lint-staged JS/TS command must run Oxlint fixes with denied warnings.')

const packagesCheck = rootScripts['packages:check'] ?? ''
const errorsCheckIndex = packagesCheck.indexOf('errors:check')
const bridgeCheckIndex = packagesCheck.indexOf('bridge:check')
const metadataCheckIndex = packagesCheck.indexOf('packages:verify-metadata')
assert(errorsCheckIndex !== -1 && bridgeCheckIndex !== -1 && metadataCheckIndex !== -1 && errorsCheckIndex < bridgeCheckIndex && bridgeCheckIndex < metadataCheckIndex, 'packages:check must run errors:check, bridge:check, then packages:verify-metadata.')

for (const workflow of publishWorkflows) {
	const text = readText(workflow.path)
	assert(text.includes(`run: ${workflow.command}`), `${workflow.path} must call "${workflow.command}".`)
	assert(text.includes('bun pm view'), `${workflow.path} must use bun pm view for registry version checks.`)
	assert(text.includes('bun pm pack --destination'), `${workflow.path} must pack artifacts with bun pm pack.`)
	assert(text.includes('bun publish ./npm-artifacts/*.tgz --access public'), `${workflow.path} must publish artifacts with bun publish.`)
	assert(text.includes('NPM_CONFIG_TOKEN'), `${workflow.path} must authenticate bun publish with NPM_CONFIG_TOKEN.`)
	assert(!NPM_COMMAND_PATTERN.test(text), `${workflow.path} must not run registry CLI commands.`)
}

const npmFamilyCommands = findNpmFamilyCommands()
assert(npmFamilyCommands.length === 0, `Arroxy-owned tooling must not use npm-family commands:\n${npmFamilyCommands.join('\n')}`)

for (const {dir, packageJson} of packageRecords) {
	assert(
		biomeIncludes.some(include => includeCoversPackage(include, dir)),
		`${dir} must be represented in biome.jsonc files.includes.`
	)
	assert(Object.hasOwn(knipWorkspaces, dir), `${dir} must be represented in knip.json workspaces.`)

	if (existsSync(repoPath(`${dir}/src`)) && hasSourceFiles(`${dir}/src`)) {
		assert(madgeScript.includes(`${dir}/src`), `${dir}/src must be included in the root madge script.`)
	}

	const packageConfigFiles = findPackageConfigFiles(dir)
	assert(packageConfigFiles.length === 0, `${dir} must not define package-local formatter/linter configs: ${packageConfigFiles.join(', ')}`)

	const publishable = packageJson.private !== true && Boolean(packageJson.name) && Boolean(packageJson.version)
	if (!publishable) continue

	const packageScripts = stringMap(packageJson.scripts)
	for (const scriptName of REQUIRED_PACKAGE_SCRIPTS) {
		assert(typeof packageScripts[scriptName] === 'string' && packageScripts[scriptName].length > 0, `${dir} is publishable and must expose script "${scriptName}".`)
	}
	assert(packageScripts['pack:dry-run'] === 'bun pm pack --dry-run', `${dir} pack:dry-run must use bun pm pack --dry-run.`)

	for (const section of PUBLISH_DEPENDENCY_SECTIONS) {
		const deps = stringMap(packageJson[section])
		for (const [name, spec] of Object.entries(deps)) {
			if (!hasWorkspaceProtocol(spec)) continue
			assert(spec === 'workspace:*', `${dir} publishable ${section}.${name} must use workspace:* or plain semver; got ${spec}.`)
			assert(workspacePackageNames.has(name), `${dir} publishable ${section}.${name} uses ${spec}, but no workspace package named ${name} exists.`)
		}
	}
}

for (const section of ROOT_DEPENDENCY_SECTIONS) {
	const deps = stringMap(rootPackage[section])
	for (const [name, spec] of Object.entries(deps)) {
		if (!hasWorkspaceProtocol(spec)) continue
		assert(workspacePackageNames.has(name), `Root ${section}.${name} uses ${spec}, but no workspace package named ${name} exists.`)
	}
}

if (failures.length > 0) {
	console.error('[tooling-contract] failed:')
	for (const failure of failures) console.error(`- ${failure}`)
	process.exit(1)
}

console.log(`[tooling-contract] OK - ${packageRecords.length} workspace packages checked.`)
