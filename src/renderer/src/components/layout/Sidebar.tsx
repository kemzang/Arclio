import {NavLink} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {Download, Library, FolderHeart, Star, Tag, Clock, Settings, Search, Zap} from 'lucide-react'
import {cn} from '@renderer/lib/utils.js'
import {GlobalSearch} from '@renderer/components/search/GlobalSearch.js'

// `fallbackLabel` is the English shown while a key has no catalog entry yet.
// Without it i18next renders the raw key ("nav.search") straight into the UI.
const NAV_ITEMS: Array<{to: string; icon: typeof Download; labelKey: string; fallbackLabel: string; end?: boolean}> = [
	{to: '/', icon: Download, labelKey: 'nav.home', fallbackLabel: 'Home', end: true},
	{to: '/library', icon: Library, labelKey: 'nav.library', fallbackLabel: 'Library'},
	{to: '/search', icon: Search, labelKey: 'nav.search', fallbackLabel: 'Search'},
	{to: '/converter', icon: Zap, labelKey: 'nav.converter', fallbackLabel: 'Converter'},
	{to: '/collections', icon: FolderHeart, labelKey: 'nav.collections', fallbackLabel: 'Collections'},
	{to: '/favorites', icon: Star, labelKey: 'nav.favorites', fallbackLabel: 'Favorites'},
	{to: '/tags', icon: Tag, labelKey: 'nav.tags', fallbackLabel: 'Tags'},
	{to: '/history', icon: Clock, labelKey: 'nav.history', fallbackLabel: 'History'},
	{to: '/settings', icon: Settings, labelKey: 'nav.settings', fallbackLabel: 'Settings'}
]

export function Sidebar(): React.JSX.Element {
	const {t} = useTranslation()

	return (
		<nav className="flex flex-col w-56 shrink-0 border-r border-[var(--border)] bg-[var(--glass-panel)] py-3 px-2 gap-0.5 overflow-y-auto">
			<div className="px-1 mb-2">
				<GlobalSearch />
			</div>
			{NAV_ITEMS.map(({to, icon: Icon, labelKey, fallbackLabel, end}) => (
				<NavLink key={to} to={to} end={end} className={({isActive}) => cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors', 'hover:bg-[var(--glass-tile)] hover:text-foreground', isActive ? 'bg-[var(--glass-tile)] text-foreground shadow-sm' : 'text-[var(--text-subtle)]')}>
					<Icon className="size-4 shrink-0" />
					<span>{t(labelKey, fallbackLabel)}</span>
				</NavLink>
			))}
		</nav>
	)
}
