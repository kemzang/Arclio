export const DOMAIN_EVENTS = [
	// Download events
	'download:started',
	'download:progress',
	'download:completed',
	'download:failed',
	'download:cancelled',
	'download:paused',
	'download:resumed',
	// Queue events
	'queue:itemAdded',
	'queue:itemRemoved',
	'queue:paused',
	'queue:resumed',
	'queue:cleared',
	'queue:priorityChanged',
	// Library events
	'library:updated',
	'library:imported',
	'library:scanStarted',
	'library:scanCompleted',
	'library:scanFailed',
	// Media events
	'media:added',
	'media:removed',
	'media:updated',
	// Metadata events
	'metadata:extracted',
	'metadata:failed',
	// Thumbnail events
	'thumbnail:generated',
	'thumbnail:failed',
	// Converter events
	'converter:started',
	'converter:progress',
	'converter:completed',
	'converter:failed',
	// Viewer events
	'viewer:positionChanged',
	'viewer:sessionStarted',
	'viewer:sessionEnded',
	// Source events
	'source:scanStarted',
	'source:scanCompleted',
	'source:scanFailed',
	'source:changed',
	// System events
	'system:ready',
	'system:error',
	'system:shutdown'
] as const

export type DomainEvent = (typeof DOMAIN_EVENTS)[number]
