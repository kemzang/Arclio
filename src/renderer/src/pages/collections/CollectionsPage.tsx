import {useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Plus, FolderHeart, Trash2, Edit2} from 'lucide-react'
import type {LibraryCollectionWithCount} from '@shared/api.js'
import {Button} from '@renderer/components/ui/button.js'
import {Input} from '@renderer/components/ui/input.js'

export function CollectionsPage(): React.JSX.Element {
	const {t} = useTranslation()
	const [collections, setCollections] = useState<LibraryCollectionWithCount[]>([])
	const [isCreating, setIsCreating] = useState(false)
	const [newName, setNewName] = useState('')

	const loadCollections = (): void => {
		void window.appApi.library.collection.list().then(setCollections)
	}

	useEffect(() => {
		loadCollections()
	}, [])

	const handleCreate = async (): Promise<void> => {
		if (!newName.trim()) return
		await window.appApi.library.collection.create({name: newName.trim()})
		setNewName('')
		setIsCreating(false)
		loadCollections()
	}

	const handleDelete = async (id: string): Promise<void> => {
		await window.appApi.library.collection.delete(id)
		loadCollections()
	}

	return (
		<div className="p-6 space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">{t('nav.collections')}</h1>
				<Button onClick={() => setIsCreating(true)} size="sm">
					<Plus className="size-4 mr-2" />
					{t('collections.create')}
				</Button>
			</div>

			{isCreating && (
				<div className="flex items-center gap-2 p-4 border border-[var(--border)] rounded-xl bg-[var(--glass-tile)]">
					<Input
						placeholder={t('collections.namePlaceholder')}
						value={newName}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
						onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
							if (e.key === 'Enter') void handleCreate()
							if (e.key === 'Escape') setIsCreating(false)
						}}
					/>
					<Button onClick={() => void handleCreate()} size="sm">
						{t('collections.save')}
					</Button>
					<Button variant="ghost" onClick={() => setIsCreating(false)} size="sm">
						{t('collections.cancel')}
					</Button>
				</div>
			)}

			{collections.length === 0 && !isCreating ? (
				<div className="flex flex-col items-center justify-center py-20 text-[var(--text-subtle)]">
					<FolderHeart className="size-12 mb-4 opacity-50" />
					<p className="text-lg font-medium">{t('collections.empty')}</p>
					<p className="text-sm">{t('collections.emptyHint')}</p>
				</div>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{collections.map(col => (
						<div key={col.id} className="group relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--glass-tile)] hover:shadow-lg transition-shadow cursor-pointer p-4">
							<div className="flex items-center gap-3 mb-3">
								{col.coverThumbnailUrl ? (
									<img src={col.coverThumbnailUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
								) : (
									<div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
										<FolderHeart className="size-6 text-[var(--text-subtle)]" />
									</div>
								)}
								<div className="flex-1 min-w-0">
									<p className="font-medium truncate">{col.name}</p>
									<p className="text-xs text-[var(--text-subtle)]">
										{col.mediaCount} {t('library.items')}
									</p>
								</div>
							</div>
							{col.description && <p className="text-xs text-[var(--text-subtle)] line-clamp-2">{col.description}</p>}
							<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
								<Button variant="ghost" size="icon" className="size-7">
									<Edit2 className="size-3" />
								</Button>
								<Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => void handleDelete(col.id)}>
									<Trash2 className="size-3" />
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
