import {useCallback} from 'react'
import {useTranslation} from 'react-i18next'
import {FolderOpen, Globe, Monitor, Clipboard, Subtitles, Image} from 'lucide-react'
import {SUPPORTED_LANGS, LANGUAGE_NATIVE_NAMES, type SupportedLang} from '@shared/i18n/index.js'
import {useAppStore} from '../../store/useAppStore.js'
import {Button} from '../../components/ui/button.js'
import {Switch} from '../../components/ui/switch.js'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../../components/ui/select.js'
import {ThemeToggle} from '../../components/system/ThemeToggle.js'

export function SettingsPage(): React.JSX.Element {
	const {t} = useTranslation()
	const {settings, language, setLanguage} = useAppStore()

	const updateSettings = useCallback(async (patch: Parameters<typeof window.appApi.settings.update>[0]) => {
		await window.appApi.settings.update(patch)
	}, [])

	const handleChangeOutputDir = useCallback(() => {
		void (async () => {
			const result = await window.appApi.dialog.chooseFolder(settings?.common.defaultOutputDir)
			if (result.ok && result.data.path) {
				await updateSettings({common: {defaultOutputDir: result.data.path}})
			}
		})()
	}, [settings?.common.defaultOutputDir, updateSettings])

	const handleLanguageChange = useCallback(
		(lang: string | null) => {
			if (lang !== null) setLanguage(lang as SupportedLang)
		},
		[setLanguage]
	)

	const handleToggleClipboardWatch = useCallback(
		(checked: boolean) => {
			void updateSettings({common: {clipboardWatchEnabled: checked}})
		},
		[updateSettings]
	)

	const handleToggleWriteSubtitles = useCallback(
		(checked: boolean) => {
			void updateSettings({single: {lastSubtitleLanguages: checked ? ['en'] : []}})
		},
		[updateSettings]
	)

	const handleToggleEmbedThumbnail = useCallback(
		(checked: boolean) => {
			void updateSettings({common: {embedThumbnail: checked}})
		},
		[updateSettings]
	)

	if (!settings) return <div className="p-6" />

	const {common} = settings

	return (
		<div className="p-6 space-y-6 max-w-2xl">
			<h1 className="text-2xl font-bold">{t('nav.settings')}</h1>

			<SettingsSection icon={FolderOpen} title={t('settings.outputDir')} description={t('settings.outputDirDescription')}>
				<div className="flex items-center gap-2">
					<code className="text-xs bg-muted px-2 py-1 rounded max-w-[280px] truncate">{common.defaultOutputDir}</code>
					<Button variant="outline" size="sm" onClick={handleChangeOutputDir}>
						{t('settings.change')}
					</Button>
				</div>
			</SettingsSection>

			<SettingsSection icon={Globe} title={t('settings.language')} description={t('settings.languageDescription')}>
				<Select value={language} onValueChange={handleLanguageChange}>
					<SelectTrigger className="w-[180px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{SUPPORTED_LANGS.map(code => (
							<SelectItem key={code} value={code}>
								{LANGUAGE_NATIVE_NAMES[code]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</SettingsSection>

			<SettingsSection icon={Monitor} title={t('settings.theme')} description={t('settings.themeDescription')}>
				<ThemeToggle />
			</SettingsSection>

			<SettingsSection icon={Clipboard} title={t('settings.clipboardWatch')} description={t('settings.clipboardWatchDescription')}>
				<Switch checked={common.clipboardWatchEnabled} onCheckedChange={handleToggleClipboardWatch} />
			</SettingsSection>

			<SettingsSection icon={Subtitles} title={t('settings.writeSubtitles')} description={t('settings.writeSubtitlesDescription')}>
				<Switch checked={(settings.single.lastSubtitleLanguages?.length ?? 0) > 0} onCheckedChange={handleToggleWriteSubtitles} />
			</SettingsSection>

			<SettingsSection icon={Image} title={t('settings.embedThumbnail')} description={t('settings.embedThumbnailDescription')}>
				<Switch checked={common.embedThumbnail ?? false} onCheckedChange={handleToggleEmbedThumbnail} />
			</SettingsSection>
		</div>
	)
}

function SettingsSection({icon: Icon, title, description, children}: {icon: typeof FolderOpen; title: string; description: string; children: React.ReactNode}): React.JSX.Element {
	return (
		<div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[var(--border)] bg-card">
			<div className="flex items-start gap-3 min-w-0">
				<Icon className="size-5 mt-0.5 text-[var(--text-subtle)] shrink-0" />
				<div className="min-w-0">
					<p className="text-sm font-medium">{title}</p>
					<p className="text-xs text-[var(--text-subtle)]">{description}</p>
				</div>
			</div>
			<div className="shrink-0">{children}</div>
		</div>
	)
}
