import {NavLink} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {Download, Library, FolderHeart, Star, Tag, Clock, Settings} from 'lucide-react'
import {cn} from '@renderer/lib/utils.js'
import {GlobalSearch} from '@renderer/components/search/GlobalSearch.js'

const NAV_ITEMS: Array<{to: string; icon: typeof Download; labelKey: string; end?: boolean}> = [
	{to: '/', icon: Download, labelKey: 'nav.home', end: true},
	{to: '/library', icon: Library, labelKey: 'nav.library'},
	{to: '/collections', icon: FolderHeart, labelKey: 'nav.collections'},
	{to: '/favorites', icon: Star, labelKey: 'nav.favorites'},
	{to: '/tags', icon: Tag, labelKey: 'nav.tags'},
	{to: '/history', icon: Clock, labelKey: 'nav.history'},
	{to: '/settings', icon: Settings, labelKey: 'nav.settings'}
]

export function Sidebar(): React.JSX.Element {
	const {t} = useTranslation()

	return (
		<nav className="flex flex-col w-56 shrink-0 border-r border-[var(--border)] bg-[var(--glass-panel)] py-3 px-2 gap-0.5 overflow-y-auto">
			<div className="px-1 mb-2">
				<GlobalSearch />
			</div>
			{NAV_ITEMS.map(({to, icon: Icon, labelKey, end}) => (
				<NavLink key={to} to={to} end={end} className={({isActive}) => cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors', 'hover:bg-[var(--glass-tile)] hover:text-foreground', isActive ? 'bg-[var(--glass-tile)] text-foreground shadow-sm' : 'text-[var(--text-subtle)]')}>
					<Icon className="size-4 shrink-0" />
					<span>{t(labelKey as 'nav.home')}</span>
				</NavLink>
			))}
		</nav>
	)
}
