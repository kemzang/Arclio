import type {Tag} from './types'

export class TagService {
	#tags = new Map<string, Tag>()
	#itemTags = new Map<string, Set<string>>()

	create(name: string, color?: string): Tag {
		const tag: Tag = {id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, color}
		this.#tags.set(tag.id, tag)
		return tag
	}

	tagItem(itemId: string, tagId: string): void {
		if (!this.#itemTags.has(itemId)) {
			this.#itemTags.set(itemId, new Set())
		}
		this.#itemTags.get(itemId)!.add(tagId)
	}

	untagItem(itemId: string, tagId: string): void {
		this.#itemTags.get(itemId)?.delete(tagId)
	}

	getItemTags(itemId: string): Tag[] {
		const tagIds = this.#itemTags.get(itemId) ?? new Set()
		return Array.from(tagIds)
			.map(id => this.#tags.get(id))
			.filter(Boolean) as Tag[]
	}

	list(): Tag[] {
		return Array.from(this.#tags.values())
	}

	delete(id: string): void {
		this.#tags.delete(id)
		for (const tags of this.#itemTags.values()) {
			tags.delete(id)
		}
	}
}
