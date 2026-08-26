import type {MergeDecision, SyncRecord} from './types.js'

/**
 * Reconciliation for library sync.
 *
 * Last-write-wins per record, arbitrated by `updatedAt`. Chosen over per-field
 * merging because the records are small and user-edited one at a time: a
 * field-level merge would buy little and would let two devices produce a state
 * that never existed on either of them.
 *
 * Everything here is pure — no clock, no network, no database — so the rules
 * can be tested exhaustively.
 */

/** Fields that may travel. Anything not listed is device-local by definition. */
interface LocalMedia {
	id: string
	title: string
	url: string
	sourceKey: string | null
	mediaType: string
	duration: number | null
	isFavorite: boolean | number
	tags?: string[]
	collections?: string[]
	updatedAt: string
	deletedAt?: string | null
	/** Present on the local row; deliberately dropped on the way out. */
	thumbnailPath?: string | null
	metadata?: string | null
}

/**
 * Projects a local library row onto the wire format.
 *
 * The explicit field list is the privacy boundary: adding a column to the
 * `media` table must not silently start uploading it.
 */
export function toSyncRecord(media: LocalMedia): SyncRecord {
	// Sorted so two devices holding the same memberships produce identical
	// payloads, which keeps the comparison stable.
	return {
		id: media.id,
		title: media.title,
		url: media.url,
		sourceKey: media.sourceKey,
		mediaType: media.mediaType,
		duration: media.duration,
		isFavorite: Boolean(media.isFavorite),
		tags: [...(media.tags ?? [])].sort(),
		collections: [...(media.collections ?? [])].sort(),
		updatedAt: media.updatedAt,
		deletedAt: media.deletedAt ?? null
	}
}

/**
 * Decides what to do with one remote record given the local one.
 *
 * A tie on `updatedAt` keeps the local copy: two devices that edited within the
 * same millisecond are indistinguishable, and refusing to churn is the calmer
 * behaviour. Deletion is expressed as a tombstone rather than an absence, so it
 * can win or lose on the same timestamp rule as any other change.
 */
export function mergeRecord(local: SyncRecord | undefined, remote: SyncRecord): MergeDecision {
	if (!local) {
		// Never resurrect something the server already knows was deleted.
		return remote.deletedAt ? {action: 'keep-local'} : {action: 'take-remote', record: remote}
	}

	if (remote.updatedAt <= local.updatedAt) return {action: 'keep-local'}
	return remote.deletedAt ? {action: 'delete-local'} : {action: 'take-remote', record: remote}
}

export interface ReconcileResult {
	/** Records to insert or update locally. */
	upserts: SyncRecord[]
	/** Ids to remove locally. */
	deletions: string[]
	/** Local records the server has not seen, or that are newer here. */
	toPush: SyncRecord[]
}

/**
 * Full two-way reconciliation for one sync round.
 *
 * Push candidates are computed from the same comparison, so a record is never
 * both taken from the server and sent back to it in the same round.
 */
export function reconcile(localRecords: SyncRecord[], remoteRecords: SyncRecord[]): ReconcileResult {
	const localById = new Map(localRecords.map(record => [record.id, record]))
	const remoteById = new Map(remoteRecords.map(record => [record.id, record]))

	const upserts: SyncRecord[] = []
	const deletions: string[] = []

	for (const remote of remoteRecords) {
		const decision = mergeRecord(localById.get(remote.id), remote)
		if (decision.action === 'take-remote') upserts.push(decision.record)
		else if (decision.action === 'delete-local') deletions.push(remote.id)
	}

	const toPush = localRecords.filter(local => {
		const remote = remoteById.get(local.id)
		// Unknown to the server, or changed here since the server's copy.
		return !remote || local.updatedAt > remote.updatedAt
	})

	return {upserts, deletions, toPush}
}
