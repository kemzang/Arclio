import log from 'electron-log/main.js'
import {SyncAuthError, SyncClient, SyncPlanError, reconcile, toSyncRecord, type SyncRecord} from '@arclio/cloud'
import type {MediaRepo} from '@main/db/repositories/mediaRepository.js'
import type {TagRepo} from '@main/db/repositories/tagRepository.js'
import type {CollectionRepo} from '@main/db/repositories/collectionRepository.js'
import type {AccountStore} from '@main/stores/AccountStore.js'
import type {SyncOutcome} from '@shared/api.js'
import {SITE_URL} from '@shared/constants.js'

const logger = log.scope('sync')

/**
 * Runs one sync round between the local library and the account.
 *
 * Only the catalogue travels — titles, tags, favourites, source URLs. Media
 * files and local paths never leave the machine, which is enforced by the
 * explicit projection in `toSyncRecord` rather than by convention here.
 */
export class SyncService {
	constructor(
		private readonly media: MediaRepo,
		private readonly account: AccountStore,
		private readonly baseUrl: string = SITE_URL,
		private readonly tags?: TagRepo,
		private readonly collections?: CollectionRepo
	) {}

	/** Collection names by id, built once per round instead of per record. */
	private collectionNames(): Map<string, string> {
		return new Map((this.collections?.list() ?? []).map(row => [row.id, row.name]))
	}

	/** Collection names a media belongs to. Ids with no known name are skipped
	 *  rather than surfaced as empty strings. */
	private collectionNamesFor(mediaId: string, names: Map<string, string>): string[] {
		return (this.collections?.getCollectionIdsForMedia(mediaId) ?? []).flatMap(id => {
			const name = names.get(id)
			return name ? [name] : []
		})
	}

	/** Resolves a tag by name, creating it when this device has never seen it. */
	private ensureTag(name: string): string | null {
		if (!this.tags) return null
		return (this.tags.getByName(name) ?? this.tags.create({name, color: null})).id
	}

	private ensureCollection(name: string, names: Map<string, string>): string | null {
		if (!this.collections) return null
		for (const [id, existing] of names) if (existing === name) return id
		const created = this.collections.create({name, description: null, icon: null, color: null, sortOrder: 0})
		names.set(created.id, created.name)
		return created.id
	}

	/** Applies membership by name, adding and removing only what actually changed. */
	private applyMemberships(mediaId: string, record: SyncRecord, names: Map<string, string>): void {
		if (this.tags) {
			const current = new Map(this.tags.getTagsForMedia(mediaId).map(tag => [tag.name, tag.id]))
			for (const name of record.tags)
				if (!current.has(name)) {
					const id = this.ensureTag(name)
					if (id) this.tags.addToMedia(id, mediaId)
				}
			for (const [name, id] of current) if (!record.tags.includes(name)) this.tags.removeFromMedia(id, mediaId)
		}

		if (this.collections) {
			const currentIds = this.collections.getCollectionIdsForMedia(mediaId)
			const currentNames = new Map(currentIds.map(id => [names.get(id) ?? '', id]))
			for (const name of record.collections)
				if (!currentNames.has(name)) {
					const id = this.ensureCollection(name, names)
					if (id) this.collections.addMedia(id, mediaId)
				}
			for (const [name, id] of currentNames) if (!record.collections.includes(name)) this.collections.removeMedia(id, mediaId)
		}
	}

	/** Local library projected onto the wire format. */
	private localRecords(): SyncRecord[] {
		const names = this.collectionNames()
		return this.media.list().map(row => toSyncRecord({...row, isFavorite: row.isFavorite, tags: this.tags?.getTagsForMedia(row.id).map(tag => tag.name) ?? [], collections: this.collectionNamesFor(row.id, names), deletedAt: row.status === 'DELETED' ? row.updatedAt : null}))
	}

	private applyUpsert(record: SyncRecord, names: Map<string, string>): void {
		const existing = this.media.getById(record.id)
		if (existing) {
			this.media.update(record.id, {title: record.title, url: record.url, sourceKey: record.sourceKey, mediaType: record.mediaType, duration: record.duration, isFavorite: record.isFavorite ? 1 : 0, updatedAt: record.updatedAt})
			this.applyMemberships(record.id, record, names)
			return
		}

		// Arrived from another device, so the file is not here. MISSING is the
		// honest state: the entry is real and re-downloadable from its source URL,
		// but nothing on this disk backs it yet.
		const created = this.media.create({
			title: record.title,
			url: record.url,
			sourceKey: record.sourceKey,
			mediaType: record.mediaType,
			duration: record.duration,
			isFavorite: record.isFavorite ? 1 : 0,
			status: 'MISSING',
			createdBy: 'SYNC',
			downloadDate: record.updatedAt,
			sourceType: 'UNKNOWN',
			description: null,
			author: null,
			thumbnailUrl: null,
			thumbnailPath: null,
			metadata: null
		})
		// Memberships travel with the record, so they are applied in the same step
		// rather than left for a later round that might never come.
		this.applyMemberships(created.id, record, names)
	}

	async sync(): Promise<SyncOutcome> {
		const stored = this.account.load()
		if (!stored) return {status: 'skipped', reason: 'not-connected'}

		const client = new SyncClient({baseUrl: this.baseUrl, deviceToken: stored.deviceToken})

		try {
			const cursor = this.account.getSyncCursor()
			const remote = await client.pull(cursor)
			const local = this.localRecords()
			const {upserts, deletions, toPush} = reconcile(local, remote.records)

			const names = this.collectionNames()
			for (const record of upserts) this.applyUpsert(record, names)
			for (const id of deletions) this.media.delete(id)

			const pushed = await client.push({cursor: remote.cursor, records: toPush})

			// Only advance once both halves succeeded: a cursor saved after a failed
			// push would mark remote changes as seen that were never merged.
			this.account.setSyncCursor(pushed.cursor)

			logger.info('Sync completed', {pulled: upserts.length, pushed: toPush.length, deleted: deletions.length})
			return {status: 'ok', pulled: upserts.length, pushed: toPush.length, deleted: deletions.length}
		} catch (error) {
			if (error instanceof SyncPlanError) {
				// The credential is fine; the plan is not. Report it so the UI can
				// explain the difference instead of showing a generic failure.
				logger.info('Sync refused by plan', {reason: error.reason})
				return {status: 'requires-plan', reason: error.reason}
			}
			if (error instanceof SyncAuthError) {
				// Revoked from the account page, or the token no longer exists. Retrying
				// cannot help, so drop the local credentials and let the UI offer
				// pairing again instead of failing silently on every round.
				logger.warn('Device is no longer authorised; disconnecting locally')
				this.account.clear()
				return {status: 'unauthorized'}
			}
			const message = error instanceof Error ? error.message : String(error)
			logger.warn('Sync failed', {error: message})
			return {status: 'failed', error: message}
		}
	}
}
