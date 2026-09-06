import type {PlaylistManifestStore} from '@main/stores/PlaylistManifestStore.js'
import type {PlaylistManifest} from '@shared/playlistManifest.js'

// Per-playlist-group serialization for M3U writes. Two items in the same
// playlist can complete in the same tick, so overlapping writeFile() calls
// would race on one .m3u path. Chaining keeps them sequential (writes are
// idempotent — file rebuilt from disk).
export class PlaylistM3uWriteChain {
	private readonly chains = new Map<string, Promise<void>>()

	constructor(private readonly playlist?: {manifestStore: PlaylistManifestStore; writeM3u: (manifest: PlaylistManifest) => Promise<void>}) {}

	enqueue(playlistGroupId: string): Promise<void> {
		const prev = this.chains.get(playlistGroupId) ?? Promise.resolve()
		const next = prev.then(() => this.write(playlistGroupId))
		const stored = next.catch(() => {})
		this.chains.set(playlistGroupId, stored)
		// Drop the entry once it settles, unless a newer write already replaced it
		// — otherwise the map retains one promise per group for the app's lifetime.
		void stored.finally(() => {
			if (this.chains.get(playlistGroupId) === stored) this.chains.delete(playlistGroupId)
		})
		return next
	}

	private async write(playlistGroupId: string): Promise<void> {
		if (!this.playlist) return
		const manifest = this.playlist.manifestStore.get(playlistGroupId)
		if (!manifest) return
		await this.playlist.writeM3u(manifest)
	}
}
