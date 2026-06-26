import {useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Tag as TagIcon, Plus, X} from 'lucide-react'
import type {LibraryTagWithCount} from '@shared/api.js'
import {Button} from '@renderer/components/ui/button.js'
import {Input} from '@renderer/components/ui/input.js'

export function TagsPage(): React.JSX.Element {
	const {t} = useTranslation()
	const [tags, setTags] = useState<LibraryTagWithCount[]>([])
	const [isCreating, setIsCreating] = useState(false)
	const [newName, setNewName] = useState('')
	const [newColor, setNewColor] = useState('#6366f1')

	const loadTags = (): void => {
		void window.appApi.library.tag.list().then(setTags)
	}

	useEffect(() => {
		loadTags()
	}, [])

	const handleCreate = async (): Promise<void> => {
		if (!newName.trim()) return
		await window.appApi.library.tag.create({name: newName.trim(), color: newColor})
		setNewName('')
		setIsCreating(false)
		loadTags()
	}

	const handleDelete = async (id: string): Promise<void> => {
		await window.appApi.library.tag.delete(id)
		loadTags()
	}

	return (
		<div className="p-6 space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">{t('nav.tags')}</h1>
				<Button onClick={() => setIsCreating(true)} size="sm">
					<Plus className="size-4 mr-2" />
					{t('tags.create')}
				</Button>
			</div>

			{isCreating && (
				<div className="flex items-center gap-2 p-4 border border-[var(--border)] rounded-xl bg-[var(--glass-tile)]">
					<input type="color" value={newColor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
					<Input
						placeholder={t('tags.namePlaceholder')}
						value={newName}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
						onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
							if (e.key === 'Enter') void handleCreate()
							if (e.key === 'Escape') setIsCreating(false)
						}}
					/>
					<Button onClick={() => void handleCreate()} size="sm">
						{t('tags.save')}
					</Button>
					<Button variant="ghost" onClick={() => setIsCreating(false)} size="sm">
						{t('tags.cancel')}
					</Button>
				</div>
			)}

			{tags.length === 0 && !isCreating ? (
				<div className="flex flex-col items-center justify-center py-20 text-[var(--text-subtle)]">
					<TagIcon className="size-12 mb-4 opacity-50" />
					<p className="text-lg font-medium">{t('tags.empty')}</p>
					<p className="text-sm">{t('tags.emptyHint')}</p>
				</div>
			) : (
				<div className="flex flex-wrap gap-2">
					{tags.map(tag => (
						<div key={tag.id} className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--glass-tile)] hover:shadow-md transition-shadow">
							<span className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor: tag.color ?? '#6366f1'}} />
							<span className="text-sm font-medium">{tag.name}</span>
							<span className="text-xs text-[var(--text-subtle)]">{tag.mediaCount}</span>
							<button onClick={() => void handleDelete(tag.id)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
								<X className="size-3 text-[var(--text-subtle)] hover:text-destructive" />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
