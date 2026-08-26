/**
 * Wire format for library sync.
 *
 * Only device-independent facts travel. Local file paths live in the `asset`
 * table and never leave the machine, and media files are never uploaded — the
 * server holds a catalogue, not a copy of the user's library.
 */
export interface SyncRecord {
	id: string
	title: string
	url: string
	sourceKey: string | null
	mediaType: string
	duration: number | null
	isFavorite: boolean
	/** ISO timestamp. Drives last-write-wins reconciliation. */
	updatedAt: string
	/** Set when the record was deleted; kept so a deletion propagates. */
	deletedAt: string | null
}

export interface SyncPushRequest {
	/** Opaque marker of what this device already has. Null on a first sync. */
	cursor: string | null
	records: SyncRecord[]
}

export interface SyncPullResponse {
	cursor: string
	records: SyncRecord[]
}

/** Outcome of merging one remote record against the local one. */
export type MergeDecision = {action: 'keep-local'} | {action: 'take-remote'; record: SyncRecord} | {action: 'delete-local'}
