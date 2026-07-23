export interface CollectionInput {
	name: string
	description?: string
	itemIds: string[]
}

export class CollectionApplicationService {
	create(_input: CollectionInput): Promise<{id: string}> {
		return Promise.resolve({id: `col-${Date.now()}`})
	}

	addItems(_collectionId: string, _itemIds: string[]): Promise<void> {
		return Promise.resolve()
	}
	removeItems(_collectionId: string, _itemIds: string[]): Promise<void> {
		return Promise.resolve()
	}
}
