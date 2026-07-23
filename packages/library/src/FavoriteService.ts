import type {Favorite} from './types'

export class FavoriteService {
	#favorites = new Map<string, Favorite>()

	add(mediaId: string): Favorite {
		const fav: Favorite = {id: `fav-${mediaId}`, mediaId, addedAt: new Date()}
		this.#favorites.set(fav.id, fav)
		return fav
	}

	remove(mediaId: string): void {
		this.#favorites.delete(`fav-${mediaId}`)
	}

	isFavorite(mediaId: string): boolean {
		return this.#favorites.has(`fav-${mediaId}`)
	}

	list(): Favorite[] {
		return Array.from(this.#favorites.values())
	}
}
