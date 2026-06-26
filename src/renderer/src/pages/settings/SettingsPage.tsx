import {useTranslation} from 'react-i18next'
import {Settings as SettingsIcon} from 'lucide-react'

export function SettingsPage(): React.JSX.Element {
	const {t} = useTranslation()

	return (
		<div className="p-6 space-y-4">
			<h1 className="text-2xl font-bold">{t('nav.settings')}</h1>

			<div className="flex flex-col items-center justify-center py-20 text-[var(--text-subtle)]">
				<SettingsIcon className="size-12 mb-4 opacity-50" />
				<p className="text-lg font-medium">{t('settings.comingSoon')}</p>
				<p className="text-sm">{t('settings.comingSoonHint')}</p>
			</div>
		</div>
	)
}
