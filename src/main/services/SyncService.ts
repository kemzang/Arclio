import log from 'electron-log/main.js'
import {SyncClient, reconcile, toSyncRecord, type SyncRecord} from '@arclio/cloud'
import {SyncAuthError} from '@arclio/cloud'
import type {MediaRepo} from '@main/db/repositories/mediaRepository.js'
import type {AccountStore} from '@main/stores/AccountStore.js'
import {SITE_URL} from '@shared/constants.js'

const logger = log.scope('sync')

export type SyncOutcome = {status: 'skipped'; reason: 'not-connected'} | {status: 'ok'; pulled: number; pushed: number; deleted: number} | {status: 'unauthorized'} | {status: 'failed'; error: string}

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
		private readonly baseUrl: string = SITE_URL
	) {}

	/** Local library projected onto the wire format. */
	private localRecords(): SyncRecord[] {
		return this.media.list().map(row => toSyncRecord({...row, isFavorite: row.isFavorite, deletedAt: row.status === 'DELETED' ? row.updatedAt : null}))
	}

	private applyUpsert(record: SyncRecord): void {
		const existing = this.media.getById(record.id)
		if (existing) {
			this.media.update(record.id, {title: record.title, url: record.url, sourceKey: record.sourceKey, mediaType: record.mediaType, duration: record.duration, isFavorite: record.isFavorite ? 1 : 0, updatedAt: record.updatedAt})
			return
		}

		// Arrived from another device, so the file is not here. MISSING is the
		// honest state: the entry is real and re-downloadable from its source URL,
		// but nothing on this disk backs it yet.
		this.media.create({
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

			for (const record of upserts) this.applyUpsert(record)
			for (const id of deletions) this.media.delete(id)

			const pushed = await client.push({cursor: remote.cursor, records: toPush})

			// Only advance once both halves succeeded: a cursor saved after a failed
			// push would mark remote changes as seen that were never merged.
			this.account.setSyncCursor(pushed.cursor)

			logger.info('Sync completed', {pulled: upserts.length, pushed: toPush.length, deleted: deletions.length})
			return {status: 'ok', pulled: upserts.length, pushed: toPush.length, deleted: deletions.length}
		} catch (error) {
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
