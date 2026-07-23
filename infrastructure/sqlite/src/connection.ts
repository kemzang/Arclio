import Database from 'better-sqlite3'
import type {Database as DB} from 'better-sqlite3'

let instance: DB | null = null

export function getConnection(path: string): DB {
	if (!instance) {
		instance = new Database(path)
		instance.pragma('journal_mode = WAL')
		instance.pragma('foreign_keys = ON')
	}
	return instance
}

export function closeConnection(): void {
	instance?.close()
	instance = null
}

export function getExistingConnection(): DB | null {
	return instance
}
