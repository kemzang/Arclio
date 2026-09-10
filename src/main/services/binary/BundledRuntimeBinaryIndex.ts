import type {RuntimeBinaryIndex} from '@shared/types.js'

// Regenerate with `bun run runtime-manifest:generate` and copy the github/stable
// entries from dist/runtime-binaries/runtime-index-v1.json here. This is only a
// stopgap fallback for when the remote manifest can't be fetched or verified —
// see dev-docs/runtime-binaries.md. It does NOT auto-update; it is pinned at
// whatever version this file was last edited to, so it goes stale between app
// releases exactly like a bundled binary would. The real fix is publishing a
// signed remote manifest (the repo the app already points at,
// kemzang-Bryan/arclio-runtime-binaries, does not exist yet — see that doc).
const YT_DLP_VERSION = '2026.08.19'
const YT_DLP_RELEASE = `https://github.com/yt-dlp/yt-dlp/releases/download/${YT_DLP_VERSION}`

export const BUNDLED_RUNTIME_BINARY_INDEX: RuntimeBinaryIndex = {
	schemaVersion: 1,
	generatedAt: '2026-09-10T08:16:36.246Z',
	entries: [
		{id: 'yt-dlp', channel: 'stable', provider: 'github', version: YT_DLP_VERSION, platform: 'win32', arch: 'x64', url: `${YT_DLP_RELEASE}/yt-dlp.exe`, mirrors: [], size: 17840399, sha256: '66674953fe251b89f4d08c5f0e35e0728679bd67ab3d7d05c0562af101dd3e7a', format: 'raw', executablePath: 'yt-dlp.exe'},
		{id: 'yt-dlp', channel: 'stable', provider: 'github', version: YT_DLP_VERSION, platform: 'win32', arch: 'arm64', url: `${YT_DLP_RELEASE}/yt-dlp.exe`, mirrors: [], size: 17840399, sha256: '66674953fe251b89f4d08c5f0e35e0728679bd67ab3d7d05c0562af101dd3e7a', format: 'raw', executablePath: 'yt-dlp.exe'},
		{id: 'yt-dlp', channel: 'stable', provider: 'github', version: YT_DLP_VERSION, platform: 'darwin', arch: 'x64', url: `${YT_DLP_RELEASE}/yt-dlp_macos`, mirrors: [], size: 37146048, sha256: '0f192b7ec147ab6288885d6351d9ab67367640029b4377576ef46dd79cf7b202', format: 'raw', executablePath: 'yt-dlp'},
		{id: 'yt-dlp', channel: 'stable', provider: 'github', version: YT_DLP_VERSION, platform: 'darwin', arch: 'arm64', url: `${YT_DLP_RELEASE}/yt-dlp_macos`, mirrors: [], size: 37146048, sha256: '0f192b7ec147ab6288885d6351d9ab67367640029b4377576ef46dd79cf7b202', format: 'raw', executablePath: 'yt-dlp'},
		{id: 'yt-dlp', channel: 'stable', provider: 'github', version: YT_DLP_VERSION, platform: 'linux', arch: 'x64', url: `${YT_DLP_RELEASE}/yt-dlp_linux`, mirrors: [], size: 40446224, sha256: '58162f9bfdc27458ea47bfcb311cf47028f17d8154a8bf7d689861d46399230a', format: 'raw', executablePath: 'yt-dlp'},
		{id: 'yt-dlp', channel: 'stable', provider: 'github', version: YT_DLP_VERSION, platform: 'linux', arch: 'arm64', url: `${YT_DLP_RELEASE}/yt-dlp_linux_aarch64`, mirrors: [], size: 40167448, sha256: 'b16e4dab368a816cd05d477d698a605a6ae87ccee1c8ffd38fa21d7254141fcc', format: 'raw', executablePath: 'yt-dlp'}
	]
}
